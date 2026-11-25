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
import { Eye, FolderKanban, MessageSquare, Pause, Play, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import {
  type EnquiryRecord,
  type OpportunityRecord,
  type ProviderRecord,
  RAICHUR_LOCALITIES,
} from '../types.ts';

type ProviderTab =
  | 'register'
  | 'dashboard'
  | 'create'
  | 'manage'
  | 'enquiries'
  | 'verification'
  | 'analytics'
  | 'subscription'
  | 'settings';

export function ProviderPortalPage({ tab }: { tab: ProviderTab }) {
  const { user, authFetch, refreshSession } = useAuth();
  const navigate = useNavigate();

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    pendingApprovals: 0,
    enquiriesReceived: 0,
    totalViews: 0,
  });
  const [listings, setListings] = useState<OpportunityRecord[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [verifs, setVerifs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState('');

  // Provider Registration Form
  const [regForm, setRegForm] = useState({
    providerType: 'Organization' as 'Individual' | 'Organization',
    name: '',
    category: 'Academy',
    contactEmail: '',
    contactPhone: '',
    address: '',
    locality: 'Station Road',
    city: 'Raichur, Karnataka',
    description: '',
    docType: 'Registration Certificate',
    docName: '',
  });

  // Dynamic Create Listing Form
  const [createForm, setCreateForm] = useState({
    categorySlug: 'learn' as 'learn' | 'earn' | 'grow' | 'connect',
    subcategory: 'Coding',
    title: '',
    description: '',
    requirements: '',
    eligibility: '',
    opportunityType: 'Course',
    mode: 'In-person',
    locality: 'Station Road',
    city: 'Raichur, Karnataka',
    feeOrSalary: '',
    feeType: 'Paid',
    duration: '',
    timings: '',
    ageGroup: '16+ years',
    qualification: '10th / Any',
    experience: 'Beginner',
    instructorOrCoach: '',
    contactPhone: '',
    contactEmail: '',
  });

  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [verifNotes, setVerifNotes] = useState('');
  const [verifDocType, setVerifDocType] = useState('Trade License');
  const [verifDocName, setVerifDocName] = useState('');

  const loadProvider = useCallback(async () => {
    if (!user) return;
    const res = await authFetch('/api/provider/dashboard');
    if (res.ok) {
      const data = await res.json();
      setHasProfile(data.hasProviderProfile);
      if (data.hasProviderProfile) {
        setProvider(data.provider);
        setStats(data.stats);
        setListings(data.listings || []);
        setEnquiries(data.enquiries || []);
        setVerifs(data.verificationRequests || []);
        setSubs(data.subscriptions || []);
        setPayments(data.payments || []);
        setRegForm((f) => ({
          ...f,
          providerType: data.provider.providerType,
          name: data.provider.name,
          category: data.provider.category,
          contactEmail: data.provider.contactEmail,
          contactPhone: data.provider.contactPhone,
          address: data.provider.address,
          locality: data.provider.locality,
          city: data.provider.city,
          description: data.provider.description,
        }));
        setCreateForm((f) => ({
          ...f,
          contactPhone: f.contactPhone || data.provider.contactPhone,
          contactEmail: f.contactEmail || data.provider.contactEmail,
          locality: data.provider.locality,
        }));
      } else {
        setRegForm((f) => ({
          ...f,
          contactEmail: user.email,
        }));
      }
    }
  }, [user, authFetch]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center">
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-8 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Provider Portal Sign-In Required
          </h1>
          <p className="text-sm text-[#78847D]">
            Sign in or register an account to onboard your academy, business, coaching centre, or NGO on UNNATI Raichur.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold">
              Sign In
            </Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl border border-[#E6EAE6] text-xs font-semibold">
              Register Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleRegisterProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/provider/register', {
      method: 'POST',
      body: JSON.stringify(regForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error || 'Could not save provider profile.');
      return;
    }
    await refreshSession();
    await loadProvider();
    setFeedback('Provider profile saved! You can now create listings.');
    if (tab === 'register') navigate('/provider/dashboard');
  };

  if (tab === 'register' || hasProfile === false) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <form
          onSubmit={handleRegisterProvider}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <div className="text-xs font-semibold text-[#145C43] mb-1">Provider Onboarding</div>
            <h1 className="font-display text-2xl font-bold text-[#202820]">
              Register as a Local UNNATI Provider
            </h1>
            <p className="text-xs text-[#78847D] mt-1">
              Individual tutors, coaches, academies, employers, and NGOs in Raichur can publish opportunities for admin review.
            </p>
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-[#145C43]/10 text-[#145C43] text-xs font-medium">
              {feedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Provider Type</label>
              <select
                value={regForm.providerType}
                onChange={(e) =>
                  setRegForm({
                    ...regForm,
                    providerType: e.target.value as 'Individual' | 'Organization',
                  })
                }
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                <option value="Organization">Organization / Institution</option>
                <option value="Individual">Individual Tutor / Coach</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Provider Category</label>
              <select
                value={regForm.category}
                onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {['Tutor', 'Trainer', 'Coach', 'Academy', 'Local Business', 'Employer', 'NGO', 'Institution'].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  )
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Organization or Trainer Name</label>
            <input
              required
              type="text"
              value={regForm.name}
              onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              placeholder="e.g. Raichur Technical Skills Centre"
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Contact Email</label>
              <input
                required
                type="email"
                value={regForm.contactEmail}
                onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Contact Phone</label>
              <input
                required
                type="tel"
                value={regForm.contactPhone}
                onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                placeholder="+91"
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Raichur Locality</label>
              <select
                value={regForm.locality}
                onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {RAICHUR_LOCALITIES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Full Street Address</label>
              <input
                required
                type="text"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                placeholder="Building, Road, PIN"
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={regForm.description}
              onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
              placeholder="Describe what skills, jobs, or coaching you offer to the Raichur community..."
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F8F8F2] border border-[#E6EAE6] rounded-xl">
            <div>
              <label className="block text-xs font-medium mb-1">Verification Document Type</label>
              <select
                value={regForm.docType}
                onChange={(e) => setRegForm({ ...regForm, docType: e.target.value })}
                className="w-full border border-[#E6EAE6] bg-[#FFFFFF] rounded-lg px-3 py-2 text-xs"
              >
                <option>Registration Certificate</option>
                <option>Trade License</option>
                <option>Government ID Proof</option>
                <option>Academy Accreditation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Document Reference / File Name</label>
              <input
                type="text"
                value={regForm.docName}
                onChange={(e) => setRegForm({ ...regForm, docName: e.target.value })}
                placeholder="e.g. Trade_License_Raichur.pdf"
                className="w-full border border-[#E6EAE6] bg-[#FFFFFF] rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934]"
          >
            Submit Provider Profile
          </button>
        </form>
      </div>
    );
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/provider/listings', {
      method: 'POST',
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(data.error || 'Could not create listing.');
      return;
    }
    await loadProvider();
    setFeedback('Listing submitted! Status is Pending Admin Approval until verified by moderators.');
    navigate('/provider/manage-listings');
  };

  const handleListingAction = async (id: number, action: 'pause' | 'renew') => {
    const res = await authFetch(`/api/provider/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await loadProvider();
      setFeedback(`Listing ${action === 'pause' ? 'status updated' : 'renewed for 90 days'}.`);
    }
  };

  const handleDeleteListing = async (id: number) => {
    const res = await authFetch(`/api/provider/listings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadProvider();
      setFeedback('Listing deleted.');
    }
  };

  const handleReplyEnquiry = async (id: number) => {
    const res = await authFetch(`/api/provider/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'replied', replyNote: replyText[id] || 'Replied via UNNATI' }),
    });
    if (res.ok) {
      await loadProvider();
      setFeedback('Reply saved.');
    }
  };

  const handleRequestVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/provider/verification', {
      method: 'POST',
      body: JSON.stringify({
        notes: verifNotes,
        docType: verifDocType,
        docName: verifDocName,
      }),
    });
    if (res.ok) {
      setVerifNotes('');
      setVerifDocName('');
      await loadProvider();
      setFeedback('Verification request submitted to Admin queue.');
    }
  };

  const handleSelectPlan = async (planName: string, amountInr: number) => {
    const res = await authFetch('/api/provider/subscription', {
      method: 'POST',
      body: JSON.stringify({ planName, amountInr }),
    });
    if (res.ok) {
      await loadProvider();
      setFeedback(
        `Selected ${planName}. Note: Paid visibility plans never grant automatic provider verification.`
      );
    }
  };

  const chartData = listings.map((l) => ({
    name: l.title.slice(0, 18) + (l.title.length > 18 ? '…' : ''),
    views: l.viewsCount,
  }));

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-6">
      {feedback && (
        <div className="bg-[#145C43]/10 border border-[#145C43]/30 text-[#145C43] rounded-xl px-4 py-3 text-xs font-medium flex justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'dashboard' && (
        <>
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#78847D] mb-1">
                {provider?.category} · {provider?.verificationStatus}
              </div>
              <h1 className="font-display text-2xl font-bold text-[#202820]">{provider?.name}</h1>
            </div>
            <Link
              to="/provider/create-listing"
              className="px-4 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              + Create New Listing
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Listings', val: stats.totalListings, icon: FolderKanban },
              { label: 'Active Listings', val: stats.activeListings, icon: Play },
              { label: 'Pending Approvals', val: stats.pendingApprovals, icon: ShieldCheck },
              { label: 'Enquiries', val: stats.enquiriesReceived, icon: MessageSquare },
              { label: 'Listing Views', val: stats.totalViews, icon: Eye },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs text-[#78847D]">
                    <span>{k.label}</span>
                    <Icon className="w-4 h-4 text-[#42A875]" />
                  </div>
                  <div className="font-mono-num text-2xl font-bold text-[#202820] mt-2">
                    {k.val}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'create' && (
        <form
          onSubmit={handleCreateListing}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 max-w-3xl space-y-5"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-[#202820]">
              Create Opportunity Listing
            </h1>
            <p className="text-xs text-[#78847D] mt-1">
              Fields adapt dynamically by category. New submissions remain Pending until reviewed by an Admin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Opportunity Category</label>
              <select
                value={createForm.categorySlug}
                onChange={(e) => {
                  const cat = e.target.value as 'learn' | 'earn' | 'grow' | 'connect';
                  setCreateForm({
                    ...createForm,
                    categorySlug: cat,
                    opportunityType:
                      cat === 'earn'
                        ? 'Job'
                        : cat === 'grow'
                          ? 'Sports'
                          : cat === 'connect'
                            ? 'Business Service'
                            : 'Course',
                    feeType: cat === 'earn' ? 'Salary' : 'Paid',
                    subcategory:
                      cat === 'earn'
                        ? 'Full-time Jobs'
                        : cat === 'grow'
                          ? 'Badminton'
                          : cat === 'connect'
                            ? 'Local Businesses'
                            : 'Coding',
                  });
                }}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                <option value="learn">Learn (Courses, Training & Workshops)</option>
                <option value="earn">Earn (Jobs, Internships & Apprenticeships)</option>
                <option value="grow">Grow (Sports, Arts, Music & Yoga)</option>
                <option value="connect">Connect (Local Business Services)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Subcategory</label>
              <input
                required
                type="text"
                value={createForm.subcategory}
                onChange={(e) => setCreateForm({ ...createForm, subcategory: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              {createForm.categorySlug === 'earn'
                ? 'Job Title / Role'
                : createForm.categorySlug === 'grow'
                  ? 'Activity / Sport Name'
                  : createForm.categorySlug === 'connect'
                    ? 'Business / Service Title'
                    : 'Course / Training Title'}
            </label>
            <input
              required
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                {createForm.categorySlug === 'earn' ? 'Salary / Stipend' : 'Fees'}
              </label>
              <input
                required
                type="text"
                placeholder={createForm.categorySlug === 'earn' ? '₹14,000 / month' : 'Free or ₹2,500'}
                value={createForm.feeOrSalary}
                onChange={(e) => setCreateForm({ ...createForm, feeOrSalary: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                {createForm.categorySlug === 'earn' ? 'Employment Type' : 'Duration'}
              </label>
              <input
                type="text"
                placeholder={createForm.categorySlug === 'earn' ? 'Full-time / Part-time' : '8 Weeks'}
                value={createForm.duration}
                onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Locality in Raichur</label>
              <select
                value={createForm.locality}
                onChange={(e) => setCreateForm({ ...createForm, locality: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {RAICHUR_LOCALITIES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                {createForm.categorySlug === 'grow' ? 'Age Group' : 'Qualification / Eligibility'}
              </label>
              <input
                type="text"
                value={
                  createForm.categorySlug === 'grow' ? createForm.ageGroup : createForm.qualification
                }
                onChange={(e) =>
                  setCreateForm(
                    createForm.categorySlug === 'grow'
                      ? { ...createForm, ageGroup: e.target.value }
                      : { ...createForm, qualification: e.target.value }
                  )
                }
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                {createForm.categorySlug === 'earn' ? 'Experience' : 'Timings'}
              </label>
              <input
                type="text"
                value={
                  createForm.categorySlug === 'earn' ? createForm.experience : createForm.timings
                }
                onChange={(e) =>
                  setCreateForm(
                    createForm.categorySlug === 'earn'
                      ? { ...createForm, experience: e.target.value }
                      : { ...createForm, timings: e.target.value }
                  )
                }
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                {createForm.categorySlug === 'grow' ? 'Coach / Instructor' : 'Mode'}
              </label>
              {createForm.categorySlug === 'grow' ? (
                <input
                  type="text"
                  value={createForm.instructorOrCoach}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, instructorOrCoach: e.target.value })
                  }
                  className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
                />
              ) : (
                <select
                  value={createForm.mode}
                  onChange={(e) => setCreateForm({ ...createForm, mode: e.target.value })}
                  className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
                >
                  <option>In-person</option>
                  <option>Hybrid</option>
                  <option>Online</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Detailed Description</label>
            <textarea
              required
              rows={4}
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934]"
          >
            Submit Listing for Approval
          </button>
        </form>
      )}

      {tab === 'manage' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-[#202820]">Manage Listings</h1>
            <Link
              to="/provider/create-listing"
              className="px-3.5 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              + New Listing
            </Link>
          </div>
          {listings.length === 0 ? (
            <p className="text-sm text-[#78847D]">No listings created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6EAE6] text-[#78847D]">
                    <th className="py-2.5 pr-4">Title</th>
                    <th className="py-2.5 pr-4">Category</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4 text-right">Views</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAE6]">
                  {listings.map((l) => (
                    <tr key={l.id}>
                      <td className="py-3 pr-4 font-semibold text-[#202820]">{l.title}</td>
                      <td className="py-3 pr-4 capitalize text-[#78847D]">{l.categorySlug}</td>
                      <td className="py-3 pr-4 capitalize font-medium text-[#145C43]">{l.status}</td>
                      <td className="py-3 pr-4 text-right font-mono-num">{l.viewsCount}</td>
                      <td className="py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'pause')}
                          title="Pause or Resume"
                          className="p-1.5 rounded border border-[#E6EAE6] hover:bg-[#F8F8F2]"
                        >
                          {l.status === 'paused' ? (
                            <Play className="w-3.5 h-3.5" />
                          ) : (
                            <Pause className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleListingAction(l.id, 'renew')}
                          title="Renew 90 days"
                          className="p-1.5 rounded border border-[#E6EAE6] hover:bg-[#F8F8F2]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(l.id)}
                          title="Delete"
                          className="p-1.5 rounded border border-[#E6EAE6] text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'enquiries' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">Received Enquiries</h1>
          {enquiries.length === 0 ? (
            <p className="text-sm text-[#78847D]">No enquiries received yet.</p>
          ) : (
            <div className="divide-y divide-[#E6EAE6]">
              {enquiries.map((eq) => (
                <div key={eq.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-sm">{eq.subject}</div>
                    <span className="text-xs font-medium capitalize text-[#145C43]">{eq.status}</span>
                  </div>
                  <div className="text-xs text-[#78847D]">
                    From: {eq.senderName} ({eq.senderPhone} · {eq.senderEmail})
                  </div>
                  <p className="text-xs text-[#202820]">{eq.message}</p>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Write a reply note..."
                      value={replyText[eq.id] ?? eq.replyNote ?? ''}
                      onChange={(e) => setReplyText({ ...replyText, [eq.id]: e.target.value })}
                      className="flex-1 border border-[#E6EAE6] rounded-lg px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleReplyEnquiry(eq.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
                    >
                      Save Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleRequestVerification}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4"
          >
            <h1 className="font-display text-xl font-bold text-[#202820]">
              Provider Verification
            </h1>
            <p className="text-xs text-[#78847D]">
              Current Status: <strong className="text-[#145C43]">{provider?.verificationStatus}</strong>
            </p>
            <div>
              <label className="block text-xs font-medium mb-1">Document Type</label>
              <select
                value={verifDocType}
                onChange={(e) => setVerifDocType(e.target.value)}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                <option>Trade License</option>
                <option>Registration Certificate</option>
                <option>Government ID Proof</option>
                <option>Coaching / Faculty Certificate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Document Reference</label>
              <input
                required
                type="text"
                value={verifDocName}
                onChange={(e) => setVerifDocName(e.target.value)}
                placeholder="e.g. CMC_Trade_Cert_2026.pdf"
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Verification Notes</label>
              <textarea
                rows={3}
                value={verifNotes}
                onChange={(e) => setVerifNotes(e.target.value)}
                placeholder="Share details for manual Raichur verification..."
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              Request Manual Verification
            </button>
          </form>

          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold text-[#202820]">
              Verification History
            </h2>
            {verifs.length === 0 ? (
              <p className="text-xs text-[#78847D]">No verification requests submitted yet.</p>
            ) : (
              verifs.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-[#F8F8F2] border border-[#E6EAE6] text-xs">
                  <div className="font-semibold text-[#145C43]">{v.status}</div>
                  <div className="text-[#202820] mt-0.5">{v.documentsSummary}</div>
                  <div className="text-[#78847D] mt-0.5">{v.notes}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Listing Views & Engagement
          </h1>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6EAE6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78847D' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78847D' }} />
                <Tooltip />
                <Bar dataKey="views" fill="#145C43" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'subscription' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6">
            <h1 className="font-display text-xl font-bold text-[#202820] mb-1">
              Provider Visibility Plans
            </h1>
            <p className="text-xs text-[#78847D]">
              Essential user access is always free. Paid visibility plans highlight sponsored listings clearly and never automatically grant verification.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {[
                {
                  name: 'Community Free',
                  price: 0,
                  desc: 'Standard verified listings for tutors, NGOs, and small businesses.',
                },
                {
                  name: 'Growth Visibility',
                  price: 499,
                  desc: 'Priority placement in Category Top + enquiry analytics.',
                },
                {
                  name: 'Institutional Partner',
                  price: 1499,
                  desc: 'Multi-batch promotion for colleges, academies, and regional employers.',
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="border border-[#E6EAE6] rounded-xl p-5 flex flex-col justify-between gap-4 bg-[#F8F8F2]"
                >
                  <div>
                    <div className="font-display font-bold text-base text-[#202820]">
                      {plan.name}
                    </div>
                    <div className="font-mono-num text-2xl font-bold text-[#145C43] mt-1">
                      ₹{plan.price}
                      <span className="text-xs font-normal text-[#78847D]"> / month</span>
                    </div>
                    <p className="text-xs text-[#78847D] mt-2">{plan.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan.name, plan.price)}
                    className="w-full py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
                  >
                    Select {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6">
            <h2 className="font-display text-base font-bold text-[#202820] mb-3">
              Subscription & Payment History ({subs.length} plans · {payments.length} records)
            </h2>
            <div className="space-y-2 text-xs">
              {payments.length === 0 ? (
                <p className="text-[#78847D]">No billing records yet.</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="flex justify-between py-2 border-b border-[#E6EAE6]">
                    <span>{p.purpose}</span>
                    <span className="font-mono-num font-semibold">₹{p.amountInr} · {p.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <form
          onSubmit={handleRegisterProvider}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-2xl space-y-4"
        >
          <h1 className="font-display text-xl font-bold text-[#202820]">Provider Settings</h1>
          <input
            type="text"
            value={regForm.name}
            onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={regForm.contactPhone}
            onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={regForm.address}
            onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <textarea
            rows={3}
            value={regForm.description}
            onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            Update Provider Details
          </button>
        </form>
      )}
    </div>
  );
}
