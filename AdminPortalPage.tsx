import React, { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Search, ShieldAlert, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { OpportunityRecord, ProviderRecord, ReportRecord } from '../types.ts';

type AdminTab =
  | 'overview'
  | 'users'
  | 'providers'
  | 'approvals'
  | 'categories'
  | 'reports'
  | 'featured'
  | 'revenue'
  | 'analytics'
  | 'settings';

export function AdminPortalPage({ tab }: { tab: AdminTab }) {
  const { user, authFetch, refreshSession } = useAuth();

  const [requiresSetup, setRequiresSetup] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [claimError, setClaimError] = useState('');

  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [providersData, setProvidersData] = useState<{
    providers: ProviderRecord[];
    documents: any[];
    verificationRequests: any[];
  }>({ providers: [], documents: [], verificationRequests: [] });
  const [listings, setListings] = useState<OpportunityRecord[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [revenue, setRevenue] = useState<any>({ subscriptions: [], payments: [], sponsored: [] });
  const [settings, setSettings] = useState({
    defaultCity: 'Raichur, Karnataka',
    expansionCities: 'Koppal, Ballari, Kalaburagi, Yadgir',
    requireListingApproval: true,
    enableKannadaToggle: true,
  });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    authFetch('/api/auth/admin-status')
      .then((r) => r.json())
      .then((d) => setRequiresSetup(Boolean(d.requiresSetup)))
      .catch(() => {});
  }, [user, authFetch]);

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    const [ov, us, pr, li, ca, rp, rv, st] = await Promise.all([
      authFetch('/api/admin/overview').then((r) => r.json()),
      authFetch(`/api/admin/users?q=${encodeURIComponent(userQuery)}`).then((r) => r.json()),
      authFetch('/api/admin/providers').then((r) => r.json()),
      authFetch('/api/admin/listings').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      authFetch('/api/admin/reports').then((r) => r.json()),
      authFetch('/api/admin/revenue').then((r) => r.json()),
      authFetch('/api/admin/settings').then((r) => r.json()),
    ]);
    setOverview(ov);
    setUsersList(Array.isArray(us) ? us : []);
    setProvidersData(pr);
    setListings(Array.isArray(li) ? li : []);
    setCategories(Array.isArray(ca) ? ca : []);
    setReports(Array.isArray(rp) ? rp : []);
    setRevenue(rv);
    if (st && st.defaultCity) setSettings(st);
  }, [user, authFetch, userQuery]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center">
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-8 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Admin Sign-In Required
          </h1>
          <p className="text-sm text-[#78847D]">
            Sign in with the administrator Google account or verify your admin passcode to open the UNNATI Control Center.
          </p>
          <Link
            to="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    const handleClaim = async (e: React.FormEvent) => {
      e.preventDefault();
      setClaimError('');
      const res = await authFetch('/api/auth/admin-claim', {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setClaimError(data.error || 'Verification failed.');
        return;
      }
      await refreshSession();
    };

    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <form
          onSubmit={handleClaim}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4"
        >
          <h1 className="font-display text-xl font-bold text-[#202820]">
            {requiresSetup ? 'Set Initial Admin Passcode' : 'Verify Admin Access'}
          </h1>
          <p className="text-xs text-[#78847D] leading-relaxed">
            {requiresSetup
              ? 'First-run setup: set a server-side admin passcode (min 6 characters) or sign in with Google as alokkumarrcr@gmail.com.'
              : 'Enter your server admin passcode to unlock moderation and verification controls.'}
          </p>
          {claimError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {claimError}
            </div>
          )}
          <input
            required
            minLength={6}
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Admin passcode"
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            {requiresSetup ? 'Claim Admin Passcode' : 'Verify & Unlock Admin'}
          </button>
        </form>
      </div>
    );
  }

  const updateUser = async (id: number, patch: { role?: string; status?: string }) => {
    const res = await authFetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await loadAdminData();
      setFeedback('User updated.');
    }
  };

  const updateProvider = async (id: number, verificationStatus: string) => {
    const res = await authFetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ verificationStatus }),
    });
    if (res.ok) {
      await loadAdminData();
      setFeedback(`Provider status set to ${verificationStatus}.`);
    }
  };

  const updateListing = async (id: number, patch: Record<string, unknown>) => {
    const res = await authFetch(`/api/admin/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await loadAdminData();
      setFeedback('Listing updated.');
    }
  };

  const deleteListing = async (id: number) => {
    const res = await authFetch(`/api/admin/listings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadAdminData();
      setFeedback('Listing removed.');
    }
  };

  const updateReport = async (id: number, status: string, adminNote: string) => {
    const res = await authFetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
    if (res.ok) {
      await loadAdminData();
      setFeedback(`Report marked ${status}.`);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setFeedback('Platform settings saved.');
    }
  };

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto space-y-6">
      {feedback && (
        <div className="bg-[#145C43]/10 border border-[#145C43]/30 text-[#145C43] rounded-xl px-4 py-3 text-xs font-medium flex justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {(tab === 'overview' || tab === 'analytics') && overview && (
        <>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#202820]">
              {tab === 'analytics' ? 'Platform Analytics' : 'Admin Control Center'}
            </h1>
            <p className="text-xs text-[#78847D] mt-1">
              Live Raichur pilot governance, moderation, and engagement telemetry from PostgreSQL.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Users', val: overview.metrics.totalUsers },
              { label: 'Providers', val: overview.metrics.totalProviders },
              { label: 'Active', val: overview.metrics.publishedOpportunities },
              { label: 'Pending', val: overview.metrics.pendingListings },
              { label: 'Open Reports', val: overview.metrics.reportedListings },
              { label: 'Enquiries', val: overview.metrics.totalEnquiries },
              { label: 'Applications', val: overview.metrics.totalApplications },
            ].map((m) => (
              <div key={m.label} className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
                <div className="text-[11px] text-[#78847D]">{m.label}</div>
                <div className="font-mono-num text-xl font-bold text-[#145C43] mt-1">{m.val}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6">
              <h2 className="font-display text-base font-bold text-[#202820] mb-4">
                Category Distribution & Listing Views
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6EAE6" />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#78847D' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#78847D' }} />
                    <Tooltip />
                    <Bar dataKey="listings" name="Listings" fill="#145C43" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views" name="Total Views" fill="#EABF59" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6">
              <h2 className="font-display text-base font-bold text-[#202820] mb-3">
                Recent Admin Activity Logs
              </h2>
              <div className="space-y-2.5 max-h-64 overflow-y-auto text-xs">
                {overview.recentLogs?.map((log: any) => (
                  <div key={log.id} className="pb-2 border-b border-[#E6EAE6]">
                    <div className="font-semibold text-[#145C43]">{log.action}</div>
                    <div className="text-[#202820]">{log.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-xl font-bold text-[#202820]">User Management</h1>
            <div className="flex items-center border border-[#E6EAE6] rounded-lg px-3 py-1.5 bg-[#F8F8F2]">
              <Search className="w-3.5 h-3.5 text-[#78847D] mr-2" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                className="bg-transparent text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6EAE6] text-[#78847D]">
                  <th className="py-2.5 pr-4">Name</th>
                  <th className="py-2.5 pr-4">Email</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAE6]">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-semibold text-[#202820]">{u.name}</td>
                    <td className="py-3 pr-4 text-[#78847D]">{u.email}</td>
                    <td className="py-3 pr-4">
                      <select
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="border border-[#E6EAE6] rounded px-2 py-1 text-xs"
                      >
                        <option value="user">user</option>
                        <option value="provider">provider</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4 capitalize">{u.status}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          updateUser(u.id, {
                            status: u.status === 'suspended' ? 'active' : 'suspended',
                          })
                        }
                        className="px-3 py-1 rounded border border-[#E6EAE6] hover:bg-[#F8F8F2]"
                      >
                        {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'providers' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Provider Verification & Moderation
          </h1>
          <div className="space-y-3">
            {providersData.providers.map((p) => {
              const docs = providersData.documents.filter((d) => d.providerId === p.id);
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-[#E6EAE6] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="font-display text-sm font-bold text-[#202820]">
                      {p.name} · <span className="text-[#145C43]">{p.category}</span>
                    </div>
                    <div className="text-xs text-[#78847D]">
                      {p.address} · {p.contactPhone} · Status:{' '}
                      <strong className="text-[#202820]">{p.verificationStatus}</strong>
                    </div>
                    {docs.length > 0 && (
                      <div className="text-xs text-[#145C43]">
                        Documents: {docs.map((d) => `${d.docType} (${d.docName})`).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateProvider(p.id, 'Verified')}
                      className="px-3 py-1.5 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProvider(p.id, 'Rejected')}
                      className="px-3 py-1.5 rounded-lg border border-[#E6EAE6] text-xs font-semibold"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => updateProvider(p.id, 'Suspended')}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold"
                    >
                      Suspend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(tab === 'approvals' || tab === 'featured') && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            {tab === 'featured'
              ? 'Featured & Sponsored Listings'
              : 'Listing Approvals & Moderation'}
          </h1>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E6EAE6] text-[#78847D]">
                  <th className="py-2.5 pr-4">Title</th>
                  <th className="py-2.5 pr-4">Provider</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 pr-4">Flags</th>
                  <th className="py-2.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6EAE6]">
                {listings.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 pr-4 font-semibold text-[#202820]">{l.title}</td>
                    <td className="py-3 pr-4 text-[#78847D]">{l.providerName}</td>
                    <td className="py-3 pr-4 capitalize font-medium text-[#145C43]">{l.status}</td>
                    <td className="py-3 pr-4 text-[#78847D]">
                      {l.isFeatured ? 'Featured · ' : ''}
                      {l.isSponsored ? 'Sponsored · ' : ''}
                      {l.verificationStatus}
                    </td>
                    <td className="py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(l.id, {
                            status: 'active',
                            verificationStatus: 'Verified',
                          })
                        }
                        title="Approve & Verify"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#145C43] text-[#FFFFFF]"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateListing(l.id, {
                            status: 'rejected',
                            verificationStatus: 'Rejected',
                          })
                        }
                        title="Reject"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E6EAE6]"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => updateListing(l.id, { isFeatured: !l.isFeatured })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border ${
                          l.isFeatured
                            ? 'bg-[#EABF59]/25 border-[#EABF59] text-[#202820]'
                            : 'border-[#E6EAE6]'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {l.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteListing(l.id)}
                        title="Remove Listing"
                        className="p-1.5 rounded border border-[#E6EAE6] text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">Opportunity Categories</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat.slug} className="p-4 rounded-xl border border-[#E6EAE6] space-y-2">
                <div className="font-display font-bold text-base text-[#145C43]">{cat.name}</div>
                <p className="text-xs text-[#78847D]">{cat.description}</p>
                <div className="text-xs text-[#202820]">
                  Subcategories: {(cat.subcategories || []).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Reports & Complaints Moderation
          </h1>
          {reports.length === 0 ? (
            <p className="text-sm text-[#78847D]">No open reports.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-[#E6EAE6] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-[#202820] inline-flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#EABF59]" />
                      {r.opportunityTitle} ({r.providerName})
                    </span>
                    <span className="capitalize font-semibold text-[#145C43]">{r.status}</span>
                  </div>
                  <div className="text-xs font-medium text-[#202820]">Reason: {r.reason}</div>
                  <p className="text-xs text-[#78847D]">{r.details}</p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateReport(r.id, 'investigating', 'Under moderator review')}
                      className="px-3 py-1 rounded border border-[#E6EAE6] text-xs font-semibold"
                    >
                      Mark Investigating
                    </button>
                    <button
                      type="button"
                      onClick={() => updateReport(r.id, 'resolved', 'Verified and resolved')}
                      className="px-3 py-1 rounded bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'revenue' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-5">
          <div>
            <h1 className="font-display text-xl font-bold text-[#202820]">
              Subscriptions, Sponsored Placements & Pilot Ledger
            </h1>
            <p className="text-xs text-[#78847D] mt-1">
              Note: Sample Pilot entries illustrate the revenue model; UNNATI does not claim active commercial revenue prior to launch.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#E6EAE6] rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-[#202820]">Subscriptions</div>
              {revenue.subscriptions?.map((s: any) => (
                <div key={s.id} className="flex justify-between py-1.5 border-b border-[#E6EAE6]">
                  <span>{s.providerName}</span>
                  <span className="font-mono-num">
                    {s.planName} (₹{s.amountInr})
                  </span>
                </div>
              ))}
            </div>
            <div className="border border-[#E6EAE6] rounded-xl p-4 space-y-2">
              <div className="font-bold text-sm text-[#202820]">Sponsored Listings</div>
              {revenue.sponsored?.map((sp: any) => (
                <div key={sp.id} className="flex justify-between py-1.5 border-b border-[#E6EAE6]">
                  <span>{sp.opportunityTitle}</span>
                  <span className="font-mono-num">
                    {sp.placementType} · {sp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <form
          onSubmit={saveSettings}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-2xl space-y-4"
        >
          <h1 className="font-display text-xl font-bold text-[#202820]">Platform Settings</h1>
          <div>
            <label className="block text-xs font-medium mb-1">Default Launch City</label>
            <input
              type="text"
              value={settings.defaultCity}
              onChange={(e) => setSettings({ ...settings, defaultCity: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              Expansion Regions (comma-separated)
            </label>
            <input
              type="text"
              value={settings.expansionCities}
              onChange={(e) => setSettings({ ...settings, expansionCities: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireListingApproval}
              onChange={(e) =>
                setSettings({ ...settings, requireListingApproval: e.target.checked })
              }
            />
            Require Admin Approval before new provider listings go live
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enableKannadaToggle}
              onChange={(e) =>
                setSettings({ ...settings, enableKannadaToggle: e.target.checked })
              }
            />
            Enable Kannada / English interface language switch
          </label>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
            Save Platform Settings
          </button>
        </form>
      )}
    </div>
  );
}
