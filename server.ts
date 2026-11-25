import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './src/db/index.ts';
import {
  adminActivityLogs,
  applications,
  contactMessages,
  enquiries,
  notifications,
  opportunities,
  opportunityCategories,
  payments,
  providerDocuments,
  providers,
  reports,
  savedOpportunities,
  sponsoredListings,
  subscriptions,
  systemSettings,
  userPreferences,
  userProfiles,
  users,
  verificationRequests,
} from './src/db/schema.ts';
import { ensureSeeded } from './src/db/seed.ts';
import {
  type AuthRequest,
  hashPassword,
  optionalAuth,
  requireAdmin,
  requireAuth,
  signSessionToken,
  verifyPassword,
} from './src/middleware/auth.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '2mb' }));

// Ensure database has initial pilot seed data on API requests
app.use('/api', async (_req, _res, next) => {
  await ensureSeeded();
  next();
});

// Helper to get provider for a user
async function getProviderForUser(userId: number) {
  const rows = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userId))
    .limit(1);
  return rows[0] || null;
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'unnati-api' });
});

// ========================
// AUTH & SESSION ROUTES
// ========================
app.get('/api/auth/session', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const [profileRows, prefRows, providerRows] = await Promise.all([
      db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1),
      db.select().from(userPreferences).where(eq(userPreferences.userId, user.id)).limit(1),
      db.select().from(providers).where(eq(providers.userId, user.id)).limit(1),
    ]);

    res.json({
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        location: user.location,
        preferredLanguage: user.preferredLanguage,
      },
      profile: profileRows[0] || null,
      preferences: prefRows[0] || null,
      provider: providerRows[0] || null,
    });
  } catch (err) {
    console.error('Session load error:', err);
    res.status(500).json({ error: 'Unable to load account session.' });
  }
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(24),
  password: z.string().min(6).max(100),
  location: z.string().min(2).max(120).default('Raichur, Karnataka'),
  profileType: z.string().min(2).max(50).default('Student'),
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all required registration fields.' });
    }
    const { name, email, phone, password, location, profileType } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const uid = `local-${crypto.randomUUID()}`;
    const passwordHash = hashPassword(password);
    const isAdminEmail = normalizedEmail === 'alokkumarrcr@gmail.com';

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        name,
        phone,
        passwordHash,
        role: isAdminEmail ? 'admin' : profileType === 'Trainer' ? 'provider' : 'user',
        status: 'active',
        location,
        preferredLanguage: 'en',
      })
      .returning();

    const createdUser = inserted[0];

    await db.insert(userProfiles).values({
      userId: createdUser.id,
      profileType,
      interests: JSON.stringify(['Learn', 'Earn']),
      preferredLocation: location,
      onboardingCompleted: false,
    });

    await db.insert(userPreferences).values({
      userId: createdUser.id,
    });

    await db.insert(notifications).values({
      userId: createdUser.id,
      title: 'Welcome to UNNATI Raichur',
      message:
        'Complete your 5-step onboarding to unlock personalized local skill, job, and sports recommendations.',
      category: 'general',
      linkUrl: '/onboarding',
      isRead: false,
    });

    const token = signSessionToken({ uid: createdUser.uid, email: createdUser.email });
    res.status(201).json({
      token,
      user: {
        id: createdUser.id,
        uid: createdUser.uid,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
        location: createdUser.location,
        preferredLanguage: createdUser.preferredLanguage,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Valid email and password are required.' });
    }
    const normalizedEmail = parsed.data.email.toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    const user = rows[0];
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials or this account uses Google Sign-In.',
      });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account is suspended.' });
    }
    if (!verifyPassword(parsed.data.password, user.passwordHash)) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const token = signSessionToken({ uid: user.uid, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        location: user.location,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Sign-in failed. Please try again.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  res.json({
    message:
      'If an email-registered account exists for this address, reset guidance has been queued. Google Sign-In accounts manage passwords directly via Google.',
  });
});

// Admin passcode claim / bootstrap status & verification
app.get('/api/auth/admin-status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const stored = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'admin_passcode_hash'))
      .limit(1);
    res.json({
      isAdmin: req.authUser!.role === 'admin',
      requiresSetup: !envPasscode && stored.length === 0,
    });
  } catch (err) {
    console.error('Admin status error:', err);
    res.status(500).json({ error: 'Failed to check admin status.' });
  }
});

app.post('/api/auth/admin-claim', requireAuth, async (req: AuthRequest, res) => {
  try {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.trim() : '';
    if (passcode.length < 6) {
      return res.status(400).json({ error: 'Passcode must be at least 6 characters.' });
    }
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const existingSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, 'admin_passcode_hash'))
      .limit(1);

    if (envPasscode) {
      if (passcode !== envPasscode) {
        return res.status(403).json({ error: 'Invalid admin passcode.' });
      }
    } else if (existingSetting.length === 0) {
      const hash = hashPassword(passcode);
      await db.insert(systemSettings).values({
        key: 'admin_passcode_hash',
        value: hash,
      });
    } else {
      if (!verifyPassword(passcode, existingSetting[0].value)) {
        return res.status(403).json({ error: 'Invalid admin passcode.' });
      }
    }

    const updated = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, req.authUser!.id))
      .returning();

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'ADMIN_ACCESS_VERIFIED',
      targetType: 'user',
      targetId: req.authUser!.id,
      details: `${req.authUser!.email} verified admin privileges.`,
    });

    res.json({ ok: true, role: updated[0].role });
  } catch (err) {
    console.error('Admin claim error:', err);
    res.status(500).json({ error: 'Could not verify admin privileges.' });
  }
});

// 5-Step Onboarding Wizard Save
const onboardingSchema = z.object({
  profileType: z.string().min(2),
  interests: z.array(z.string()).min(1),
  preferredLocation: z.string().min(2),
  qualification: z.string().optional().default(''),
  experience: z.string().optional().default(''),
  preferences: z.object({
    jobAlerts: z.boolean(),
    internshipAlerts: z.boolean(),
    courseAlerts: z.boolean(),
    freeTrainingAlerts: z.boolean(),
    apprenticeshipAlerts: z.boolean(),
    sportsAlerts: z.boolean(),
    flexibleWorkAlerts: z.boolean(),
    savedCategoryAlerts: z.boolean(),
    emailOptIn: z.boolean(),
    whatsappOptIn: z.boolean(),
  }),
});

app.post('/api/auth/onboarding', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all onboarding steps.' });
    }
    const userId = req.authUser!.id;
    const { profileType, interests, preferredLocation, qualification, experience, preferences } =
      parsed.data;

    await db
      .update(users)
      .set({ location: preferredLocation })
      .where(eq(users.id, userId));

    await db
      .insert(userProfiles)
      .values({
        userId,
        profileType,
        interests: JSON.stringify(interests),
        preferredLocation,
        qualification,
        experience,
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          profileType,
          interests: JSON.stringify(interests),
          preferredLocation,
          qualification,
          experience,
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(userPreferences)
      .values({
        userId,
        ...preferences,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...preferences,
          updatedAt: new Date(),
        },
      });

    res.json({ ok: true });
  } catch (err) {
    console.error('Onboarding save error:', err);
    res.status(500).json({ error: 'Failed to save onboarding preferences.' });
  }
});

// ========================
// PUBLIC STATS & DISCOVERY
// ========================
app.get('/api/stats/public', async (_req, res) => {
  try {
    const [activeOpps, verifiedProviders, categoriesCount, citiesRows] = await Promise.all([
      db
        .select({ value: count() })
        .from(opportunities)
        .where(eq(opportunities.status, 'active')),
      db
        .select({ value: count() })
        .from(providers)
        .where(eq(providers.verificationStatus, 'Verified')),
      db.select({ value: count() }).from(opportunityCategories),
      db
        .selectDistinct({ city: opportunities.city })
        .from(opportunities)
        .where(eq(opportunities.status, 'active')),
    ]);

    res.json({
      activeOpportunities: Number(activeOpps[0]?.value || 0),
      verifiedProviders: Number(verifiedProviders[0]?.value || 0),
      categoriesCount: Number(categoriesCount[0]?.value || 0),
      citiesCount: Math.max(1, citiesRows.length),
    });
  } catch (err) {
    console.error('Public stats error:', err);
    res.status(500).json({ error: 'Failed to load platform stats.' });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await db.select().from(opportunityCategories);
    res.json(
      rows.map((r) => ({
        ...r,
        subcategories: JSON.parse(r.subcategories || '[]'),
      }))
    );
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Failed to load categories.' });
  }
});

// Query active opportunities with full PostgreSQL filters
app.get('/api/opportunities', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      q,
      category,
      subcategory,
      locality,
      city,
      feeType,
      mode,
      opportunityType,
      qualification,
      experience,
      ageGroup,
      verifiedOnly,
      featuredOnly,
      sort = 'newest',
      limit = '24',
      offset = '0',
    } = req.query as Record<string, string | undefined>;

    const conditions = [eq(opportunities.status, 'active')];

    if (category && category !== 'all') {
      conditions.push(eq(opportunities.categorySlug, category));
    }
    if (subcategory && subcategory !== 'all') {
      conditions.push(ilike(opportunities.subcategory, `%${subcategory}%`));
    }
    if (locality && locality !== 'all') {
      conditions.push(ilike(opportunities.locality, `%${locality}%`));
    }
    if (city && city !== 'all') {
      conditions.push(ilike(opportunities.city, `%${city}%`));
    }
    if (feeType && feeType !== 'all') {
      conditions.push(eq(opportunities.feeType, feeType));
    }
    if (mode && mode !== 'all') {
      conditions.push(eq(opportunities.mode, mode));
    }
    if (opportunityType && opportunityType !== 'all') {
      conditions.push(eq(opportunities.opportunityType, opportunityType));
    }
    if (qualification && qualification !== 'all') {
      conditions.push(ilike(opportunities.qualification, `%${qualification}%`));
    }
    if (experience && experience !== 'all') {
      conditions.push(ilike(opportunities.experience, `%${experience}%`));
    }
    if (ageGroup && ageGroup !== 'all') {
      conditions.push(ilike(opportunities.ageGroup, `%${ageGroup}%`));
    }
    if (verifiedOnly === 'true') {
      conditions.push(eq(opportunities.verificationStatus, 'Verified'));
    }
    if (featuredOnly === 'true') {
      conditions.push(eq(opportunities.isFeatured, true));
    }
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      const searchExpr = or(
        ilike(opportunities.title, term),
        ilike(opportunities.description, term),
        ilike(opportunities.subcategory, term),
        ilike(opportunities.locality, term),
        ilike(opportunities.qualification, term)
      );
      if (searchExpr) conditions.push(searchExpr);
    }

    const whereClause = and(...conditions);

    const orderBy =
      sort === 'views'
        ? desc(opportunities.viewsCount)
        : sort === 'featured'
          ? desc(opportunities.isFeatured)
          : desc(opportunities.createdAt);

    const parsedLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
    const parsedOffset = Math.max(Number(offset) || 0, 0);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          opportunity: opportunities,
          providerName: providers.name,
          providerCategory: providers.category,
          providerVerification: providers.verificationStatus,
        })
        .from(opportunities)
        .innerJoin(providers, eq(opportunities.providerId, providers.id))
        .where(whereClause)
        .orderBy(orderBy, desc(opportunities.id))
        .limit(parsedLimit)
        .offset(parsedOffset),
      db.select({ value: count() }).from(opportunities).where(whereClause),
    ]);

    let savedSet = new Set<number>();
    if (req.authUser) {
      const saved = await db
        .select({ oppId: savedOpportunities.opportunityId })
        .from(savedOpportunities)
        .where(eq(savedOpportunities.userId, req.authUser.id));
      savedSet = new Set(saved.map((s) => s.oppId));
    }

    res.json({
      total: Number(totalRows[0]?.value || 0),
      items: rows.map((r) => ({
        ...r.opportunity,
        providerName: r.providerName,
        providerCategory: r.providerCategory,
        providerVerification: r.providerVerification,
        isSaved: savedSet.has(r.opportunity.id),
      })),
    });
  } catch (err) {
    console.error('Opportunities query error:', err);
    res.status(500).json({ error: 'Failed to load opportunities.' });
  }
});

// Single opportunity details
app.get('/api/opportunities/:id', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid opportunity identifier.' });
    }

    const rows = await db
      .select({
        opportunity: opportunities,
        provider: providers,
      })
      .from(opportunities)
      .innerJoin(providers, eq(opportunities.providerId, providers.id))
      .where(eq(opportunities.id, id))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    // Increment view count
    await db
      .update(opportunities)
      .set({ viewsCount: sql`${opportunities.viewsCount} + 1` })
      .where(eq(opportunities.id, id));

    let isSaved = false;
    let hasApplied = false;
    if (req.authUser) {
      const [savedRow, appRow] = await Promise.all([
        db
          .select()
          .from(savedOpportunities)
          .where(
            and(
              eq(savedOpportunities.userId, req.authUser.id),
              eq(savedOpportunities.opportunityId, id)
            )
          )
          .limit(1),
        db
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.userId, req.authUser.id),
              eq(applications.opportunityId, id)
            )
          )
          .limit(1),
      ]);
      isSaved = savedRow.length > 0;
      hasApplied = appRow.length > 0;
    }

    res.json({
      ...rows[0].opportunity,
      viewsCount: rows[0].opportunity.viewsCount + 1,
      provider: rows[0].provider,
      isSaved,
      hasApplied,
    });
  } catch (err) {
    console.error('Opportunity detail error:', err);
    res.status(500).json({ error: 'Failed to load opportunity details.' });
  }
});

// Providers directory (Connect)
app.get('/api/providers', async (req, res) => {
  try {
    const { category, locality, q, verifiedOnly } = req.query as Record<string, string | undefined>;
    const conditions = [];
    if (category && category !== 'all') {
      conditions.push(eq(providers.category, category));
    }
    if (locality && locality !== 'all') {
      conditions.push(ilike(providers.locality, `%${locality}%`));
    }
    if (verifiedOnly === 'true') {
      conditions.push(eq(providers.verificationStatus, 'Verified'));
    }
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      const expr = or(
        ilike(providers.name, term),
        ilike(providers.description, term),
        ilike(providers.locality, term),
        ilike(providers.category, term)
      );
      if (expr) conditions.push(expr);
    }

    const list = await db
      .select()
      .from(providers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(providers.createdAt));

    const counts = await db
      .select({
        providerId: opportunities.providerId,
        total: count(),
      })
      .from(opportunities)
      .where(eq(opportunities.status, 'active'))
      .groupBy(opportunities.providerId);

    const countMap = new Map(counts.map((c) => [c.providerId, Number(c.total)]));

    res.json(
      list.map((p) => ({
        ...p,
        activeListingsCount: countMap.get(p.id) || 0,
      }))
    );
  } catch (err) {
    console.error('Providers list error:', err);
    res.status(500).json({ error: 'Failed to load providers.' });
  }
});

app.get('/api/providers/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid provider identifier.' });
    }
    const rows = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found.' });
    }
    const providerOpps = await db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.providerId, id), eq(opportunities.status, 'active')))
      .orderBy(desc(opportunities.createdAt));

    res.json({
      provider: rows[0],
      opportunities: providerOpps,
    });
  } catch (err) {
    console.error('Provider detail error:', err);
    res.status(500).json({ error: 'Failed to load provider profile.' });
  }
});

// ========================
// USER DASHBOARD & ACTIONS
// ========================
app.get('/api/user/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const [profileRows, savedRows, appRows, enqRows, notifRows, allActiveOpps] = await Promise.all([
      db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1),
      db
        .select({
          saved: savedOpportunities,
          opportunity: opportunities,
          providerName: providers.name,
        })
        .from(savedOpportunities)
        .innerJoin(opportunities, eq(savedOpportunities.opportunityId, opportunities.id))
        .innerJoin(providers, eq(opportunities.providerId, providers.id))
        .where(eq(savedOpportunities.userId, userId))
        .orderBy(desc(savedOpportunities.createdAt)),
      db
        .select({
          application: applications,
          opportunityTitle: opportunities.title,
          opportunityCategory: opportunities.categorySlug,
          providerName: providers.name,
        })
        .from(applications)
        .innerJoin(opportunities, eq(applications.opportunityId, opportunities.id))
        .innerJoin(providers, eq(opportunities.providerId, providers.id))
        .where(eq(applications.userId, userId))
        .orderBy(desc(applications.createdAt)),
      db
        .select({
          enquiry: enquiries,
          providerName: providers.name,
          opportunityTitle: opportunities.title,
        })
        .from(enquiries)
        .leftJoin(providers, eq(enquiries.providerId, providers.id))
        .leftJoin(opportunities, eq(enquiries.opportunityId, opportunities.id))
        .where(eq(enquiries.userId, userId))
        .orderBy(desc(enquiries.createdAt)),
      db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)),
      db
        .select({
          opportunity: opportunities,
          providerName: providers.name,
        })
        .from(opportunities)
        .innerJoin(providers, eq(opportunities.providerId, providers.id))
        .where(eq(opportunities.status, 'active'))
        .orderBy(desc(opportunities.isFeatured), desc(opportunities.viewsCount))
        .limit(12),
    ]);

    const profile = profileRows[0] || null;
    const interests: string[] = profile ? JSON.parse(profile.interests || '[]') : [];
    const recommended = allActiveOpps
      .map((r) => {
        const text = `${r.opportunity.title} ${r.opportunity.subcategory} ${r.opportunity.categorySlug}`.toLowerCase();
        const score = interests.reduce(
          (acc, interest) => (text.includes(interest.toLowerCase()) ? acc + 2 : acc),
          0
        );
        return {
          ...r.opportunity,
          providerName: r.providerName,
          matchScore: score,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);

    res.json({
      profile,
      recommended,
      saved: savedRows.map((s) => ({
        ...s.opportunity,
        providerName: s.providerName,
        savedAt: s.saved.createdAt,
      })),
      applications: appRows.map((a) => ({
        ...a.application,
        opportunityTitle: a.opportunityTitle,
        opportunityCategory: a.opportunityCategory,
        providerName: a.providerName,
      })),
      enquiries: enqRows.map((e) => ({
        ...e.enquiry,
        providerName: e.providerName,
        opportunityTitle: e.opportunityTitle,
      })),
      notifications: notifRows,
    });
  } catch (err) {
    console.error('User dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

app.post('/api/user/save', requireAuth, async (req: AuthRequest, res) => {
  try {
    const oppId = Number(req.body?.opportunityId);
    if (!Number.isInteger(oppId) || oppId <= 0) {
      return res.status(400).json({ error: 'Invalid opportunity ID.' });
    }
    const userId = req.authUser!.id;
    const existing = await db
      .select()
      .from(savedOpportunities)
      .where(
        and(
          eq(savedOpportunities.userId, userId),
          eq(savedOpportunities.opportunityId, oppId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(savedOpportunities)
        .where(eq(savedOpportunities.id, existing[0].id));
      return res.json({ saved: false });
    }

    await db.insert(savedOpportunities).values({ userId, opportunityId: oppId });
    res.json({ saved: true });
  } catch (err) {
    console.error('Save toggle error:', err);
    res.status(500).json({ error: 'Failed to update saved item.' });
  }
});

const applySchema = z.object({
  opportunityId: z.number().int().positive(),
  applicantName: z.string().min(2),
  applicantPhone: z.string().min(6),
  qualification: z.string().optional().default(''),
  coverNote: z.string().min(5),
  resumeLabel: z.string().optional().default(''),
});

app.post('/api/user/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all application details.' });
    }
    const userId = req.authUser!.id;
    const { opportunityId, applicantName, applicantPhone, qualification, coverNote, resumeLabel } =
      parsed.data;

    const existing = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.userId, userId),
          eq(applications.opportunityId, opportunityId)
        )
      )
      .limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already applied to this opportunity.' });
    }

    const oppRows = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, opportunityId))
      .limit(1);
    if (oppRows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const inserted = await db
      .insert(applications)
      .values({
        userId,
        opportunityId,
        applicantName,
        applicantPhone,
        qualification,
        coverNote,
        resumeLabel,
        status: 'submitted',
      })
      .returning();

    await db.insert(notifications).values({
      userId,
      title: 'Application Submitted',
      message: `Your application for "${oppRows[0].title}" has been recorded.`,
      category: 'application',
      linkUrl: '/dashboard/applications',
      isRead: false,
    });

    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Application submit error:', err);
    res.status(500).json({ error: 'Could not submit application.' });
  }
});

const enquirySchema = z.object({
  opportunityId: z.number().int().positive().optional(),
  providerId: z.number().int().positive(),
  senderName: z.string().min(2),
  senderEmail: z.string().email(),
  senderPhone: z.string().min(6),
  subject: z.string().min(2),
  message: z.string().min(5),
});

app.post('/api/enquiries', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all enquiry fields.' });
    }
    const inserted = await db
      .insert(enquiries)
      .values({
        userId: req.authUser?.id || null,
        opportunityId: parsed.data.opportunityId || null,
        providerId: parsed.data.providerId,
        senderName: parsed.data.senderName,
        senderEmail: parsed.data.senderEmail,
        senderPhone: parsed.data.senderPhone,
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: 'new',
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Enquiry error:', err);
    res.status(500).json({ error: 'Failed to send enquiry.' });
  }
});

app.patch('/api/user/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.authUser!.id)));
    res.json({ ok: true });
  } catch (err) {
    console.error('Notification read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

app.post('/api/user/notifications/mark-all-read', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, req.authUser!.id));
    res.json({ ok: true });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const {
      name,
      phone,
      location,
      preferredLanguage,
      profileType,
      qualification,
      experience,
      bio,
      interests,
    } = req.body || {};

    await db
      .update(users)
      .set({
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(location ? { location } : {}),
        ...(preferredLanguage ? { preferredLanguage } : {}),
      })
      .where(eq(users.id, userId));

    await db
      .insert(userProfiles)
      .values({
        userId,
        profileType: profileType || 'Student',
        qualification: qualification || '',
        experience: experience || '',
        bio: bio || '',
        interests: JSON.stringify(Array.isArray(interests) ? interests : []),
        preferredLocation: location || 'Raichur, Karnataka',
        onboardingCompleted: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: {
          ...(profileType ? { profileType } : {}),
          ...(qualification !== undefined ? { qualification } : {}),
          ...(experience !== undefined ? { experience } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(Array.isArray(interests) ? { interests: JSON.stringify(interests) } : {}),
          ...(location ? { preferredLocation: location } : {}),
          updatedAt: new Date(),
        },
      });

    res.json({ ok: true });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

app.put('/api/user/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const p = req.body || {};
    await db
      .insert(userPreferences)
      .values({
        userId,
        jobAlerts: Boolean(p.jobAlerts),
        internshipAlerts: Boolean(p.internshipAlerts),
        courseAlerts: Boolean(p.courseAlerts),
        freeTrainingAlerts: Boolean(p.freeTrainingAlerts),
        apprenticeshipAlerts: Boolean(p.apprenticeshipAlerts),
        sportsAlerts: Boolean(p.sportsAlerts),
        flexibleWorkAlerts: Boolean(p.flexibleWorkAlerts),
        savedCategoryAlerts: Boolean(p.savedCategoryAlerts),
        emailOptIn: Boolean(p.emailOptIn),
        whatsappOptIn: Boolean(p.whatsappOptIn),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          jobAlerts: Boolean(p.jobAlerts),
          internshipAlerts: Boolean(p.internshipAlerts),
          courseAlerts: Boolean(p.courseAlerts),
          freeTrainingAlerts: Boolean(p.freeTrainingAlerts),
          apprenticeshipAlerts: Boolean(p.apprenticeshipAlerts),
          sportsAlerts: Boolean(p.sportsAlerts),
          flexibleWorkAlerts: Boolean(p.flexibleWorkAlerts),
          savedCategoryAlerts: Boolean(p.savedCategoryAlerts),
          emailOptIn: Boolean(p.emailOptIn),
          whatsappOptIn: Boolean(p.whatsappOptIn),
          updatedAt: new Date(),
        },
      });

    if (p.preferredLanguage) {
      await db
        .update(users)
        .set({ preferredLanguage: p.preferredLanguage })
        .where(eq(users.id, userId));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Preferences update error:', err);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// Report listing
app.post('/api/reports', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const opportunityId = Number(req.body?.opportunityId);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const details = typeof req.body?.details === 'string' ? req.body.details.trim() : '';
    if (!Number.isInteger(opportunityId) || !reason || !details) {
      return res.status(400).json({ error: 'Reason and details are required to submit a report.' });
    }
    const inserted = await db
      .insert(reports)
      .values({
        reporterUserId: req.authUser?.id || null,
        opportunityId,
        reason,
        details,
        status: 'open',
      })
      .returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// Contact form
app.post('/api/contact', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(6),
      topic: z.string().min(2),
      message: z.string().min(5),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all contact form fields.' });
    }
    const inserted = await db.insert(contactMessages).values(parsed.data).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ========================
// PROVIDER PORTAL ROUTES
// ========================
const providerRegSchema = z.object({
  providerType: z.enum(['Individual', 'Organization']),
  name: z.string().min(2),
  category: z.string().min(2),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(6),
  address: z.string().min(5),
  locality: z.string().min(2),
  city: z.string().min(2).default('Raichur, Karnataka'),
  description: z.string().min(10),
  docType: z.string().optional(),
  docName: z.string().optional(),
});

app.post('/api/provider/register', requireAuth, async (req: AuthRequest, res) => {
  try {
    const parsed = providerRegSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all provider profile fields.' });
    }
    const userId = req.authUser!.id;
    const existing = await getProviderForUser(userId);
    const data = parsed.data;

    let providerRecord;
    if (existing) {
      const updated = await db
        .update(providers)
        .set({
          providerType: data.providerType,
          name: data.name,
          category: data.category,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          locality: data.locality,
          city: data.city,
          description: data.description,
        })
        .where(eq(providers.id, existing.id))
        .returning();
      providerRecord = updated[0];
    } else {
      const inserted = await db
        .insert(providers)
        .values({
          userId,
          providerType: data.providerType,
          name: data.name,
          category: data.category,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          address: data.address,
          locality: data.locality,
          city: data.city,
          description: data.description,
          verificationStatus: 'Pending Verification',
          isSample: false,
        })
        .returning();
      providerRecord = inserted[0];

      // Upgrade user role to 'provider' unless already 'admin'
      if (req.authUser!.role === 'user') {
        await db.update(users).set({ role: 'provider' }).where(eq(users.id, userId));
      }

      await db.insert(subscriptions).values({
        providerId: providerRecord.id,
        planName: 'Community Free',
        status: 'active',
        amountInr: 0,
        billingCycle: 'monthly',
      });
    }

    if (data.docName && data.docType) {
      await db.insert(providerDocuments).values({
        providerId: providerRecord.id,
        docType: data.docType,
        docName: data.docName,
        docUrl: `/uploads/${data.docName}`,
        status: 'submitted',
      });
    }

    res.status(201).json(providerRecord);
  } catch (err) {
    console.error('Provider registration error:', err);
    res.status(500).json({ error: 'Failed to save provider profile.' });
  }
});

app.get('/api/provider/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) {
      return res.json({ hasProviderProfile: false });
    }

    const [myListings, myEnquiries, myDocs, myVerifs, mySubs, myPayments] = await Promise.all([
      db
        .select()
        .from(opportunities)
        .where(eq(opportunities.providerId, provider.id))
        .orderBy(desc(opportunities.createdAt)),
      db
        .select({
          enquiry: enquiries,
          opportunityTitle: opportunities.title,
        })
        .from(enquiries)
        .leftJoin(opportunities, eq(enquiries.opportunityId, opportunities.id))
        .where(eq(enquiries.providerId, provider.id))
        .orderBy(desc(enquiries.createdAt)),
      db
        .select()
        .from(providerDocuments)
        .where(eq(providerDocuments.providerId, provider.id))
        .orderBy(desc(providerDocuments.uploadedAt)),
      db
        .select()
        .from(verificationRequests)
        .where(eq(verificationRequests.providerId, provider.id))
        .orderBy(desc(verificationRequests.createdAt)),
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.providerId, provider.id))
        .orderBy(desc(subscriptions.startedAt)),
      db
        .select()
        .from(payments)
        .where(eq(payments.providerId, provider.id))
        .orderBy(desc(payments.createdAt)),
    ]);

    const totalViews = myListings.reduce((sum, l) => sum + l.viewsCount, 0);
    const activeListings = myListings.filter((l) => l.status === 'active').length;
    const pendingListings = myListings.filter((l) => l.status === 'pending').length;

    res.json({
      hasProviderProfile: true,
      provider,
      stats: {
        totalListings: myListings.length,
        activeListings,
        pendingApprovals: pendingListings,
        enquiriesReceived: myEnquiries.length,
        totalViews,
      },
      listings: myListings,
      enquiries: myEnquiries.map((e) => ({
        ...e.enquiry,
        opportunityTitle: e.opportunityTitle,
      })),
      documents: myDocs,
      verificationRequests: myVerifs,
      subscriptions: mySubs,
      payments: myPayments,
    });
  } catch (err) {
    console.error('Provider dashboard error:', err);
    res.status(500).json({ error: 'Failed to load provider dashboard.' });
  }
});

const createListingSchema = z.object({
  categorySlug: z.enum(['learn', 'earn', 'grow', 'connect']),
  subcategory: z.string().min(2),
  title: z.string().min(3),
  description: z.string().min(10),
  requirements: z.string().optional().default(''),
  eligibility: z.string().optional().default('Open to local residents'),
  opportunityType: z.string().min(2),
  mode: z.string().default('In-person'),
  locality: z.string().min(2),
  city: z.string().default('Raichur, Karnataka'),
  feeOrSalary: z.string().min(1),
  feeType: z.string().default('Free'),
  duration: z.string().default('Flexible'),
  timings: z.string().default('Flexible'),
  ageGroup: z.string().default('16+ years'),
  qualification: z.string().default('Any'),
  experience: z.string().default('Beginner / Fresher'),
  instructorOrCoach: z.string().optional().default(''),
  contactPhone: z.string().min(6),
  contactEmail: z.string().email(),
});

app.post('/api/provider/listings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) {
      return res.status(403).json({ error: 'Register a provider profile before creating listings.' });
    }
    if (provider.verificationStatus === 'Suspended') {
      return res.status(403).json({ error: 'Your provider profile is currently suspended.' });
    }

    const parsed = createListingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Please complete all required listing fields.' });
    }

    // Critical rule: New listings must remain pending until admin approval!
    const inserted = await db
      .insert(opportunities)
      .values({
        ...parsed.data,
        providerId: provider.id,
        status: 'pending',
        verificationStatus: 'Pending Verification',
        isFeatured: false,
        isSponsored: false,
        isSample: false,
        expiresAt: new Date(Date.now() + 90 * 86400000),
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to submit listing.' });
  }
});

app.patch('/api/provider/listings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) return res.status(403).json({ error: 'Provider profile not found.' });

    const existing = await db
      .select()
      .from(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.providerId, provider.id)))
      .limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Listing not found or unauthorized.' });
    }

    const action = req.body?.action;
    let updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (action === 'pause') {
      updateData.status = existing[0].status === 'paused' ? 'active' : 'paused';
    } else if (action === 'renew') {
      updateData.expiresAt = new Date(Date.now() + 90 * 86400000);
      if (existing[0].status === 'expired') updateData.status = 'active';
    } else {
      const { title, description, feeOrSalary, timings, locality } = req.body || {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (feeOrSalary) updateData.feeOrSalary = feeOrSalary;
      if (timings) updateData.timings = timings;
      if (locality) updateData.locality = locality;
    }

    const updated = await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, id))
      .returning();

    res.json(updated[0]);
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

app.delete('/api/provider/listings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) return res.status(403).json({ error: 'Provider profile not found.' });

    const deleted = await db
      .delete(opportunities)
      .where(and(eq(opportunities.id, id), eq(opportunities.providerId, provider.id)))
      .returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

app.patch('/api/provider/enquiries/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) return res.status(403).json({ error: 'Provider profile not found.' });

    const { status, replyNote } = req.body || {};
    const updated = await db
      .update(enquiries)
      .set({
        status: status || 'replied',
        replyNote: replyNote || '',
      })
      .where(and(eq(enquiries.id, id), eq(enquiries.providerId, provider.id)))
      .returning();

    if (updated.length === 0) return res.status(404).json({ error: 'Enquiry not found.' });
    res.json(updated[0]);
  } catch (err) {
    console.error('Enquiry update error:', err);
    res.status(500).json({ error: 'Failed to update enquiry.' });
  }
});

app.post('/api/provider/verification', requireAuth, async (req: AuthRequest, res) => {
  try {
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) return res.status(403).json({ error: 'Provider profile not found.' });

    const { notes, docType, docName } = req.body || {};
    if (docType && docName) {
      await db.insert(providerDocuments).values({
        providerId: provider.id,
        docType,
        docName,
        docUrl: `/uploads/${docName}`,
        status: 'submitted',
      });
    }

    const reqRow = await db
      .insert(verificationRequests)
      .values({
        providerId: provider.id,
        notes: notes || 'Verification review requested by provider.',
        documentsSummary: docName ? `${docType}: ${docName}` : 'Submitted profile documents',
        status: 'Pending Verification',
      })
      .returning();

    await db
      .update(providers)
      .set({ verificationStatus: 'Pending Verification' })
      .where(eq(providers.id, provider.id));

    res.status(201).json(reqRow[0]);
  } catch (err) {
    console.error('Verification request error:', err);
    res.status(500).json({ error: 'Failed to submit verification request.' });
  }
});

app.post('/api/provider/subscription', requireAuth, async (req: AuthRequest, res) => {
  try {
    const provider = await getProviderForUser(req.authUser!.id);
    if (!provider) return res.status(403).json({ error: 'Provider profile not found.' });

    const { planName, amountInr, opportunityIdToSponsor } = req.body || {};
    if (!planName) return res.status(400).json({ error: 'Select a plan.' });

    // IMPORTANT RULE: Paid subscriptions do NOT automatically grant verification!
    const sub = await db
      .insert(subscriptions)
      .values({
        providerId: provider.id,
        planName,
        status: 'active',
        amountInr: Number(amountInr) || 0,
        billingCycle: 'monthly',
        expiresAt: new Date(Date.now() + 30 * 86400000),
      })
      .returning();

    if (Number(amountInr) > 0) {
      await db.insert(payments).values({
        providerId: provider.id,
        subscriptionId: sub[0].id,
        amountInr: Number(amountInr),
        purpose: `Plan Subscription — ${planName} (Pilot Preview)`,
        status: 'paid',
        referenceCode: `PILOT-${Date.now().toString().slice(-6)}`,
      });
    }

    if (opportunityIdToSponsor) {
      const oppId = Number(opportunityIdToSponsor);
      await db
        .update(opportunities)
        .set({ isSponsored: true })
        .where(and(eq(opportunities.id, oppId), eq(opportunities.providerId, provider.id)));
      await db.insert(sponsoredListings).values({
        opportunityId: oppId,
        providerId: provider.id,
        placementType: 'Category Top',
        budgetInr: Number(amountInr) || 300,
        status: 'active',
        endsAt: new Date(Date.now() + 30 * 86400000),
      });
    }

    res.status(201).json(sub[0]);
  } catch (err) {
    console.error('Subscription update error:', err);
    res.status(500).json({ error: 'Failed to update subscription.' });
  }
});

// ========================
// ADMIN CONTROL CENTER ROUTES
// ========================
app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      publishedOpps,
      pendingOpps,
      reportedOpen,
      totalEnquiries,
      totalApps,
      catCounts,
      recentLogs,
    ] = await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(providers),
      db
        .select({ value: count() })
        .from(opportunities)
        .where(eq(opportunities.status, 'active')),
      db
        .select({ value: count() })
        .from(opportunities)
        .where(eq(opportunities.status, 'pending')),
      db.select({ value: count() }).from(reports).where(eq(reports.status, 'open')),
      db.select({ value: count() }).from(enquiries),
      db.select({ value: count() }).from(applications),
      db
        .select({
          category: opportunities.categorySlug,
          count: count(),
          views: sql<number>`coalesce(sum(${opportunities.viewsCount}), 0)`,
        })
        .from(opportunities)
        .groupBy(opportunities.categorySlug),
      db.select().from(adminActivityLogs).orderBy(desc(adminActivityLogs.createdAt)).limit(15),
    ]);

    res.json({
      metrics: {
        totalUsers: Number(totalUsers[0]?.value || 0),
        totalProviders: Number(totalProviders[0]?.value || 0),
        publishedOpportunities: Number(publishedOpps[0]?.value || 0),
        pendingListings: Number(pendingOpps[0]?.value || 0),
        reportedListings: Number(reportedOpen[0]?.value || 0),
        totalEnquiries: Number(totalEnquiries[0]?.value || 0),
        totalApplications: Number(totalApps[0]?.value || 0),
      },
      categoryDistribution: catCounts.map((c) => ({
        category: c.category.toUpperCase(),
        listings: Number(c.count),
        views: Number(c.views),
      })),
      recentLogs,
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const list = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        status: users.status,
        location: users.location,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(q ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`)) : undefined)
      .orderBy(desc(users.createdAt));
    res.json(list);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { role, status } = req.body || {};
    const updated = await db
      .update(users)
      .set({
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      })
      .where(eq(users.id, id))
      .returning();
    if (updated.length === 0) return res.status(404).json({ error: 'User not found.' });

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'UPDATE_USER',
      targetType: 'user',
      targetId: id,
      details: `Updated role=${updated[0].role}, status=${updated[0].status}`,
    });

    res.json(updated[0]);
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

app.get('/api/admin/providers', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [list, docs, reqs] = await Promise.all([
      db.select().from(providers).orderBy(desc(providers.createdAt)),
      db.select().from(providerDocuments),
      db.select().from(verificationRequests).orderBy(desc(verificationRequests.createdAt)),
    ]);
    res.json({ providers: list, documents: docs, verificationRequests: reqs });
  } catch (err) {
    console.error('Admin providers error:', err);
    res.status(500).json({ error: 'Failed to load providers.' });
  }
});

app.patch('/api/admin/providers/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { verificationStatus } = req.body || {};
    const updated = await db
      .update(providers)
      .set({
        verificationStatus,
        ...(verificationStatus === 'Verified' ? { lastVerifiedDate: new Date() } : {}),
      })
      .where(eq(providers.id, id))
      .returning();
    if (updated.length === 0) return res.status(404).json({ error: 'Provider not found.' });

    await db
      .update(verificationRequests)
      .set({
        status: verificationStatus,
        reviewedBy: req.authUser!.name,
        reviewedAt: new Date(),
      })
      .where(eq(verificationRequests.providerId, id));

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'PROVIDER_VERIFICATION',
      targetType: 'provider',
      targetId: id,
      details: `Set provider "${updated[0].name}" status to ${verificationStatus}.`,
    });

    res.json(updated[0]);
  } catch (err) {
    console.error('Admin provider update error:', err);
    res.status(500).json({ error: 'Failed to update provider.' });
  }
});

app.get('/api/admin/listings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        opportunity: opportunities,
        providerName: providers.name,
        providerVerification: providers.verificationStatus,
      })
      .from(opportunities)
      .innerJoin(providers, eq(opportunities.providerId, providers.id))
      .orderBy(desc(opportunities.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.opportunity,
        providerName: r.providerName,
        providerVerification: r.providerVerification,
      }))
    );
  } catch (err) {
    console.error('Admin listings error:', err);
    res.status(500).json({ error: 'Failed to load listings.' });
  }
});

app.patch('/api/admin/listings/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, verificationStatus, isFeatured, isSponsored, title, feeOrSalary } = req.body || {};

    const updateSet: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updateSet.status = status;
    if (verificationStatus) {
      updateSet.verificationStatus = verificationStatus;
      if (verificationStatus === 'Verified') updateSet.lastVerifiedAt = new Date();
    }
    if (typeof isFeatured === 'boolean') updateSet.isFeatured = isFeatured;
    if (typeof isSponsored === 'boolean') updateSet.isSponsored = isSponsored;
    if (title) updateSet.title = title;
    if (feeOrSalary) updateSet.feeOrSalary = feeOrSalary;

    const updated = await db
      .update(opportunities)
      .set(updateSet)
      .where(eq(opportunities.id, id))
      .returning();
    if (updated.length === 0) return res.status(404).json({ error: 'Listing not found.' });

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'MODERATION_LISTING',
      targetType: 'opportunity',
      targetId: id,
      details: `Updated listing "${updated[0].title}" (status=${updated[0].status}, verified=${updated[0].verificationStatus}, featured=${updated[0].isFeatured})`,
    });

    res.json(updated[0]);
  } catch (err) {
    console.error('Admin listing update error:', err);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

app.delete('/api/admin/listings/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await db.delete(opportunities).where(eq(opportunities.id, id)).returning();
    if (deleted.length === 0) return res.status(404).json({ error: 'Listing not found.' });

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'DELETE_LISTING',
      targetType: 'opportunity',
      targetId: id,
      details: `Removed listing "${deleted[0].title}".`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete listing error:', err);
    res.status(500).json({ error: 'Failed to remove listing.' });
  }
});

app.get('/api/admin/reports', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        report: reports,
        opportunityTitle: opportunities.title,
        providerName: providers.name,
      })
      .from(reports)
      .innerJoin(opportunities, eq(reports.opportunityId, opportunities.id))
      .innerJoin(providers, eq(opportunities.providerId, providers.id))
      .orderBy(desc(reports.createdAt));

    res.json(
      rows.map((r) => ({
        ...r.report,
        opportunityTitle: r.opportunityTitle,
        providerName: r.providerName,
      }))
    );
  } catch (err) {
    console.error('Admin reports error:', err);
    res.status(500).json({ error: 'Failed to load reports.' });
  }
});

app.patch('/api/admin/reports/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, adminNote } = req.body || {};
    const updated = await db
      .update(reports)
      .set({
        status: status || 'resolved',
        adminNote: adminNote || '',
        ...(status === 'resolved' || status === 'dismissed' ? { resolvedAt: new Date() } : {}),
      })
      .where(eq(reports.id, id))
      .returning();
    if (updated.length === 0) return res.status(404).json({ error: 'Report not found.' });

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'RESOLVE_REPORT',
      targetType: 'report',
      targetId: id,
      details: `Report #${id} marked as ${updated[0].status}.`,
    });
    res.json(updated[0]);
  } catch (err) {
    console.error('Admin report update error:', err);
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

app.put('/api/admin/categories/:slug', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { slug } = req.params;
    const { name, description, subcategories } = req.body || {};
    const updated = await db
      .update(opportunityCategories)
      .set({
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        ...(Array.isArray(subcategories) ? { subcategories: JSON.stringify(subcategories) } : {}),
      })
      .where(eq(opportunityCategories.slug, slug))
      .returning();
    res.json(updated[0]);
  } catch (err) {
    console.error('Admin category update error:', err);
    res.status(500).json({ error: 'Failed to update category.' });
  }
});

app.get('/api/admin/revenue', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [subs, pays, sponsored] = await Promise.all([
      db
        .select({
          subscription: subscriptions,
          providerName: providers.name,
        })
        .from(subscriptions)
        .innerJoin(providers, eq(subscriptions.providerId, providers.id))
        .orderBy(desc(subscriptions.startedAt)),
      db
        .select({
          payment: payments,
          providerName: providers.name,
        })
        .from(payments)
        .innerJoin(providers, eq(payments.providerId, providers.id))
        .orderBy(desc(payments.createdAt)),
      db
        .select({
          sponsored: sponsoredListings,
          opportunityTitle: opportunities.title,
          providerName: providers.name,
        })
        .from(sponsoredListings)
        .innerJoin(opportunities, eq(sponsoredListings.opportunityId, opportunities.id))
        .innerJoin(providers, eq(sponsoredListings.providerId, providers.id))
        .orderBy(desc(sponsoredListings.startsAt)),
    ]);

    res.json({
      subscriptions: subs.map((s) => ({ ...s.subscription, providerName: s.providerName })),
      payments: pays.map((p) => ({ ...p.payment, providerName: p.providerName })),
      sponsored: sponsored.map((sp) => ({
        ...sp.sponsored,
        opportunityTitle: sp.opportunityTitle,
        providerName: sp.providerName,
      })),
    });
  } catch (err) {
    console.error('Admin revenue error:', err);
    res.status(500).json({ error: 'Failed to load revenue data.' });
  }
});

app.get('/api/admin/settings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(systemSettings);
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.key !== 'admin_passcode_hash') {
        map[r.key] = r.value;
      }
    }
    res.json({
      defaultCity: map.default_city || 'Raichur, Karnataka',
      expansionCities: map.expansion_cities || 'Koppal, Ballari, Kalaburagi, Yadgir',
      requireListingApproval: map.require_listing_approval !== 'false',
      enableKannadaToggle: map.enable_kannada_toggle !== 'false',
    });
  } catch (err) {
    console.error('Admin settings get error:', err);
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

app.put('/api/admin/settings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const entries: [string, string][] = [
      ['default_city', String(req.body?.defaultCity || 'Raichur, Karnataka')],
      ['expansion_cities', String(req.body?.expansionCities || 'Koppal, Ballari, Kalaburagi')],
      ['require_listing_approval', String(req.body?.requireListingApproval !== false)],
      ['enable_kannada_toggle', String(req.body?.enableKannadaToggle !== false)],
    ];

    for (const [key, value] of entries) {
      await db
        .insert(systemSettings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: { value, updatedAt: new Date() },
        });
    }

    await db.insert(adminActivityLogs).values({
      adminUserId: req.authUser!.id,
      action: 'UPDATE_PLATFORM_SETTINGS',
      targetType: 'settings',
      details: `Default city set to ${entries[0][1]}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin settings save error:', err);
    res.status(500).json({ error: 'Failed to save platform settings.' });
  }
});

// ========================
// VITE / STATIC SERVING
// ========================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UNNATI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
