import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { userPreferences, userProfiles, users } from '../db/schema.ts';

const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const PRIMARY_ADMIN_EMAIL = 'alokkumarrcr@gmail.com';

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: string;
  status: string;
  location: string;
  preferredLanguage: string;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function signSessionToken(payload: { uid: string; email: string }): string {
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const data = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `unnati.${data}.${sig}`;
}

export function verifySessionToken(token: string): { uid: string; email: string } | null {
  if (!token.startsWith('unnati.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    return { uid: parsed.uid, email: parsed.email };
  } catch {
    return null;
  }
}

export async function getOrCreateDbUser(
  uid: string,
  email: string,
  displayName?: string
): Promise<AuthenticatedUser> {
  const normalizedEmail = email.toLowerCase();
  const isPrimaryAdmin = normalizedEmail === PRIMARY_ADMIN_EMAIL;

  const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
  if (existing.length > 0) {
    const u = existing[0];
    if (isPrimaryAdmin && u.role !== 'admin') {
      const updated = await db
        .update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, u.id))
        .returning();
      return updated[0];
    }
    return u;
  }

  // Also check if an account with the same email exists (link UID smoothly)
  const byEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (byEmail.length > 0) {
    const updated = await db
      .update(users)
      .set({
        uid,
        name: displayName || byEmail[0].name,
        role: isPrimaryAdmin ? 'admin' : byEmail[0].role,
      })
      .where(eq(users.id, byEmail[0].id))
      .returning();
    return updated[0];
  }

  const inserted = await db
    .insert(users)
    .values({
      uid,
      email: normalizedEmail,
      name: displayName || normalizedEmail.split('@')[0],
      role: isPrimaryAdmin ? 'admin' : 'user',
      status: 'active',
      location: 'Raichur, Karnataka',
      preferredLanguage: 'en',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email: normalizedEmail },
    })
    .returning();

  const user = inserted[0];

  await db
    .insert(userProfiles)
    .values({
      userId: user.id,
      profileType: 'Student',
      interests: JSON.stringify(['Learn', 'Earn']),
      preferredLocation: 'Raichur Town',
      onboardingCompleted: false,
    })
    .onConflictDoNothing();

  await db
    .insert(userPreferences)
    .values({ userId: user.id })
    .onConflictDoNothing();

  return user;
}

async function resolveAuthFromHeader(authHeader?: string): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  if (token.startsWith('unnati.')) {
    const session = verifySessionToken(token);
    if (!session) return null;
    const rows = await db.select().from(users).where(eq(users.uid, session.uid)).limit(1);
    return rows[0] || null;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email || `${decoded.uid}@users.unnati.local`;
    return await getOrCreateDbUser(decoded.uid, email, decoded.name);
  } catch {
    return null;
  }
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthFromHeader(req.headers.authorization);
    if (user && user.status !== 'suspended') {
      req.authUser = user;
    }
  } catch {
    // Ignore optional auth failures
  }
  next();
};

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await resolveAuthFromHeader(req.headers.authorization);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account is currently suspended.' });
    }
    req.authUser = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.authUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};
