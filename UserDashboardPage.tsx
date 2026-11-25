import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Bookmark, CheckCheck, Compass, FileCheck2, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  type ApplicationRecord,
  type EnquiryRecord,
  type NotificationRecord,
  type OpportunityRecord,
  RAICHUR_LOCALITIES,
} from '../types.ts';

type UserTab =
  | 'overview'
  | 'discover'
  | 'applications'
  | 'saved'
  | 'enquiries'
  | 'notifications'
  | 'profile'
  | 'settings';

export function UserDashboardPage({ tab }: { tab: UserTab }) {
  const { user, profile, preferences, authFetch, refreshSession, language, setLanguage } = useAuth();
  const navigate = useNavigate();

  const [recommended, setRecommended] = useState<OpportunityRecord[]>([]);
  const [saved, setSaved] = useState<OpportunityRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Editable Profile State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    location: 'Raichur, Karnataka',
    profileType: 'Student',
    qualification: '',
    experience: '',
    bio: '',
  });

  // Editable Preferences State
  const [prefForm, setPrefForm] = useState({
    jobAlerts: true,
    internshipAlerts: true,
    courseAlerts: true,
    freeTrainingAlerts: true,
    apprenticeshipAlerts: false,
    sportsAlerts: false,
    flexibleWorkAlerts: true,
    savedCategoryAlerts: true,
    emailOptIn: true,
    whatsappOptIn: false,
  });

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/user/dashboard');
      if (res.ok) {
        const data = await res.json();
        setRecommended(data.recommended || []);
        setSaved(data.saved || []);
        setApplications(data.applications || []);
        setEnquiries(data.enquiries || []);
        setNotifications(data.notifications || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user, authFetch]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        location: user.location || 'Raichur, Karnataka',
        profileType: profile?.profileType || 'Student',
        qualification: profile?.qualification || '',
        experience: profile?.experience || '',
        bio: profile?.bio || '',
      });
    }
    if (preferences) {
      setPrefForm({
        jobAlerts: preferences.jobAlerts,
        internshipAlerts: preferences.internshipAlerts,
        courseAlerts: preferences.courseAlerts,
        freeTrainingAlerts: preferences.freeTrainingAlerts,
        apprenticeshipAlerts: preferences.apprenticeshipAlerts,
        sportsAlerts: preferences.sportsAlerts,
        flexibleWorkAlerts: preferences.flexibleWorkAlerts,
        savedCategoryAlerts: preferences.savedCategoryAlerts,
        emailOptIn: preferences.emailOptIn,
        whatsappOptIn: preferences.whatsappOptIn,
      });
    }
  }, [user, profile, preferences]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 text-center">
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-8 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">
            Sign in to Access Your Dashboard
          </h1>
          <p className="text-sm text-[#78847D]">
            Save opportunities, track applications, and manage Raichur alerts from one workspace.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl border border-[#E6EAE6] text-xs font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleSave = async (oppId: number) => {
    const res = await authFetch('/api/user/save', {
      method: 'POST',
      body: JSON.stringify({ opportunityId: oppId }),
    });
    if (res.ok) await loadDashboard();
  };

  const markNotificationRead = async (id: number) => {
    await authFetch(`/api/user/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    await authFetch('/api/user/notifications/mark-all-read', { method: 'POST' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      await refreshSession();
      setStatusMsg('Profile updated.');
    }
  };

  const savePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/user/preferences', {
      method: 'PUT',
      body: JSON.stringify({ ...prefForm, preferredLanguage: language }),
    });
    if (res.ok) {
      await refreshSession();
      setStatusMsg('Notification & language preferences saved.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto space-y-6">
      {statusMsg && (
        <div className="bg-[#145C43]/10 border border-[#145C43]/30 text-[#145C43] rounded-xl px-4 py-3 text-xs font-medium flex justify-between">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {tab === 'overview' && (
        <>
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#202820]">
                Welcome back, {user.name}
              </h1>
              <p className="text-xs text-[#78847D] mt-1">
                {profile?.profileType || 'Member'} · {user.location}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!profile?.onboardingCompleted && (
                <Link
                  to="/onboarding"
                  className="px-4 py-2 rounded-lg bg-[#EABF59] text-[#202820] text-xs font-bold"
                >
                  Complete 5-Step Onboarding
                </Link>
              )}
              <Link
                to="/explore"
                className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
              >
                Explore Raichur
              </Link>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-[#78847D]">
                <span>Saved Items</span>
                <Bookmark className="w-4 h-4 text-[#145C43]" />
              </div>
              <div className="font-mono-num text-2xl font-bold text-[#202820] mt-2">
                {saved.length}
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-[#78847D]">
                <span>Applications</span>
                <FileCheck2 className="w-4 h-4 text-[#42A875]" />
              </div>
              <div className="font-mono-num text-2xl font-bold text-[#202820] mt-2">
                {applications.length}
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-[#78847D]">
                <span>Enquiries</span>
                <MessageSquare className="w-4 h-4 text-[#EABF59]" />
              </div>
              <div className="font-mono-num text-2xl font-bold text-[#202820] mt-2">
                {enquiries.length}
              </div>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-[#78847D]">
                <span>Unread Alerts</span>
                <Bell className="w-4 h-4 text-[#145C43]" />
              </div>
              <div className="font-mono-num text-2xl font-bold text-[#202820] mt-2">
                {unreadCount}
              </div>
            </div>
          </div>

          {/* Personalized Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-[#202820]">
                Recommended For You in Raichur
              </h2>
              <Link to="/explore" className="text-xs font-semibold text-[#145C43] hover:underline">
                See all →
              </Link>
            </div>
            {loading ? (
              <div className="h-40 bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl animate-pulse" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map((item, idx) => (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    index={idx}
                    onToggleSave={toggleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'discover' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#202820]">
                Discover Personalized Opportunities
              </h1>
              <p className="text-xs text-[#78847D] mt-1">
                Matched to your profile interests and preferred Raichur locality.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              <Compass className="w-3.5 h-3.5" />
              Open Full Search Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((item, idx) => (
              <OpportunityCard key={item.id} item={item} index={idx} onToggleSave={toggleSave} />
            ))}
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">My Applications</h1>
          {applications.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#78847D]">
              You haven&apos;t submitted any applications yet.{' '}
              <Link to="/earn" className="text-[#145C43] font-semibold underline">
                Browse Earn opportunities
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6EAE6] text-[#78847D]">
                    <th className="py-2.5 pr-4 font-semibold">Opportunity</th>
                    <th className="py-2.5 pr-4 font-semibold">Provider</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6EAE6]">
                  {applications.map((a) => (
                    <tr key={a.id} className="hover:bg-[#F8F8F2]/60">
                      <td className="py-3 pr-4 font-semibold text-[#202820]">
                        <Link to={`/opportunity/${a.opportunityId}`} className="hover:text-[#145C43]">
                          {a.opportunityTitle}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-[#78847D]">{a.providerName}</td>
                      <td className="py-3 pr-4 capitalize font-medium text-[#145C43]">
                        {a.status.replace('_', ' ')}
                      </td>
                      <td className="py-3 text-right font-mono-num text-[#78847D]">
                        {new Date(a.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">Saved Opportunities</h1>
          {saved.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-8 text-center text-sm text-[#78847D]">
              No saved listings yet. Click the bookmark button on any listing to save it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saved.map((item, idx) => (
                <OpportunityCard
                  key={item.id}
                  item={{ ...item, isSaved: true }}
                  index={idx}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'enquiries' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <h1 className="font-display text-xl font-bold text-[#202820]">My Enquiries</h1>
          {enquiries.length === 0 ? (
            <p className="text-sm text-[#78847D]">No enquiries sent yet.</p>
          ) : (
            <div className="divide-y divide-[#E6EAE6]">
              {enquiries.map((eq) => (
                <div key={eq.id} className="py-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-semibold text-sm text-[#202820]">{eq.subject}</div>
                    <span className="text-xs font-medium capitalize text-[#145C43]">
                      {eq.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#78847D]">
                    To: {eq.providerName} {eq.opportunityTitle ? `· ${eq.opportunityTitle}` : ''}
                  </div>
                  <p className="text-xs text-[#202820]">{eq.message}</p>
                  {eq.replyNote && (
                    <div className="mt-2 p-3 rounded-lg bg-[#F8F8F2] border border-[#E6EAE6] text-xs">
                      <strong className="text-[#145C43]">Provider Reply: </strong>
                      {eq.replyNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-[#202820]">Notifications</h1>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6EAE6] text-xs font-semibold hover:bg-[#F8F8F2]"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-[#78847D]">You are all caught up.</p>
          ) : (
            <div className="divide-y divide-[#E6EAE6]">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-3.5 flex items-start justify-between gap-4 ${
                    !n.isRead ? 'bg-[#145C43]/4 -mx-3 px-3 rounded-lg' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-[#202820]">{n.title}</div>
                    <p className="text-xs text-[#78847D] mt-0.5">{n.message}</p>
                    {n.linkUrl && (
                      <Link
                        to={n.linkUrl}
                        className="inline-block text-xs font-semibold text-[#145C43] mt-1 hover:underline"
                      >
                        Open →
                      </Link>
                    )}
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      className="text-xs text-[#145C43] font-medium whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <form
          onSubmit={saveProfile}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-2xl space-y-4"
        >
          <h1 className="font-display text-xl font-bold text-[#202820]">My Profile</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Profile Type</label>
              <select
                value={profileForm.profileType}
                onChange={(e) => setProfileForm({ ...profileForm, profileType: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                {['Student', 'Job Seeker', 'Homemaker', 'Professional', 'Parent', 'Trainer'].map(
                  (pt) => (
                    <option key={pt}>{pt}</option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Location</label>
              <select
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              >
                <option value="Raichur, Karnataka">Raichur, Karnataka</option>
                {RAICHUR_LOCALITIES.map((l) => (
                  <option key={l} value={`${l}, Raichur`}>
                    {l}, Raichur
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Qualification</label>
              <input
                type="text"
                value={profileForm.qualification}
                onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Experience</label>
              <input
                type="text"
                value={profileForm.experience}
                onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">About Me</label>
            <textarea
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            Save Profile
          </button>
        </form>
      )}

      {tab === 'settings' && (
        <form
          onSubmit={savePreferences}
          className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-2xl space-y-5"
        >
          <div>
            <h1 className="font-display text-xl font-bold text-[#202820]">
              Notification & Language Settings
            </h1>
            <p className="text-xs text-[#78847D] mt-1">
              Opt in only to the alerts you want to receive.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F8F8F2] rounded-xl border border-[#E6EAE6]">
            <span className="text-xs font-semibold text-[#202820]">Interface Language</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  language === 'en' ? 'bg-[#145C43] text-[#FFFFFF]' : 'bg-[#FFFFFF]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('kn')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  language === 'kn' ? 'bg-[#145C43] text-[#FFFFFF]' : 'bg-[#FFFFFF]'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {[
              { key: 'jobAlerts', label: 'New Job Alerts' },
              { key: 'internshipAlerts', label: 'Internship Alerts' },
              { key: 'courseAlerts', label: 'New Courses' },
              { key: 'freeTrainingAlerts', label: 'Free Training Programmes' },
              { key: 'apprenticeshipAlerts', label: 'Apprenticeships' },
              { key: 'sportsAlerts', label: 'Sports Admissions' },
              { key: 'flexibleWorkAlerts', label: 'Flexible / WFH Work' },
              { key: 'savedCategoryAlerts', label: 'Saved Category Updates' },
              { key: 'emailOptIn', label: 'Email Notifications (Consented)' },
              { key: 'whatsappOptIn', label: 'WhatsApp Alerts (When Enabled)' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E6EAE6] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean((prefForm as any)[item.key])}
                  onChange={(e) =>
                    setPrefForm({ ...prefForm, [item.key]: e.target.checked })
                  }
                  className="rounded text-[#145C43]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            Save Preferences
          </button>
        </form>
      )}
    </div>
  );
}
