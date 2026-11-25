import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  Flag,
  Mail,
  MapPin,
  Phone,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import type { OpportunityRecord } from '../types.ts';

export function OpportunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();

  const [item, setItem] = useState<OpportunityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal States
  const [applyOpen, setApplyOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Forms
  const [appForm, setAppForm] = useState({
    applicantName: '',
    applicantPhone: '',
    qualification: '',
    coverNote: '',
    resumeLabel: '',
  });
  const [enqForm, setEnqForm] = useState({
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    subject: '',
    message: '',
  });
  const [reportForm, setReportForm] = useState({ reason: 'Incorrect fee or salary', details: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    authFetch(`/api/opportunities/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Not found');
        if (active) {
          setItem(data);
          setEnqForm((f) => ({
            ...f,
            subject: `Enquiry regarding: ${data.title}`,
            senderName: user?.name || '',
            senderEmail: user?.email || '',
          }));
          setAppForm((f) => ({
            ...f,
            applicantName: user?.name || '',
          }));
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, authFetch, user]);

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!item) return;
    const res = await authFetch('/api/user/save', {
      method: 'POST',
      body: JSON.stringify({ opportunityId: item.id }),
    });
    if (res.ok) {
      const { saved } = await res.json();
      setItem({ ...item, isSaved: saved });
      setFeedback(saved ? 'Saved to your Saved Opportunities.' : 'Removed from Saved Opportunities.');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback('Opportunity link copied to clipboard.');
    } catch {
      setFeedback('Share URL: ' + window.location.href);
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/user/applications', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: item.id,
          ...appForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not apply');
      setItem({ ...item, hasApplied: true });
      setApplyOpen(false);
      setFeedback('Application submitted successfully. Track it in My Applications.');
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: item.id,
          providerId: item.providerId,
          ...enqForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send enquiry');
      setEnquiryOpen(false);
      setFeedback('Enquiry sent directly to the provider.');
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setSubmitting(true);
    try {
      const res = await authFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          opportunityId: item.id,
          ...reportForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');
      setReportOpen(false);
      setFeedback('Report submitted to UNNATI moderation queue.');
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        <div className="h-64 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display text-xl font-bold text-[#202820] mb-2">
          Opportunity Not Found
        </h1>
        <p className="text-sm text-[#78847D] mb-4">{error}</p>
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const isJob = item.categorySlug === 'earn';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78847D] hover:text-[#145C43]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </button>

      {feedback && (
        <div className="bg-[#145C43]/10 border border-[#145C43]/30 text-[#145C43] rounded-xl px-4 py-3 text-xs font-medium flex items-center justify-between">
          <span>{feedback}</span>
          <button type="button" onClick={() => setFeedback('')} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Opportunity Details */}
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#78847D] mb-2">
              <span className="font-semibold text-[#145C43] capitalize">{item.categorySlug}</span>
              <span aria-hidden="true">·</span>
              <span>{item.subcategory}</span>
              <span aria-hidden="true">·</span>
              <span>{item.opportunityType}</span>
              {item.isSponsored && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#9A6E12]">Sponsored Placement</span>
                </>
              )}
              {item.isSample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Sample Pilot Listing</span>
                </>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820] leading-tight">
              {item.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-[#78847D]">
              <Link
                to={`/provider/${item.providerId}`}
                className="font-semibold text-[#202820] hover:text-[#145C43] underline-offset-2 hover:underline"
              >
                {item.provider?.name}
              </Link>
              {item.verificationStatus === 'Verified' && (
                <span className="inline-flex items-center gap-1 text-[#145C43] font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Listing
                </span>
              )}
              {item.lastVerifiedAt && (
                <span>
                  Last verified {new Date(item.lastVerifiedAt).toLocaleDateString('en-IN')}
                </span>
              )}
              <span className="font-mono-num">{item.viewsCount} views</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[#E6EAE6]">
            <div>
              <div className="text-[11px] text-[#78847D]">Fees / Compensation</div>
              <div className="font-mono-num text-sm font-semibold text-[#202820] mt-0.5">
                {item.feeOrSalary}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#78847D]">Locality</div>
              <div className="text-sm font-medium text-[#202820] mt-0.5">{item.locality}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#78847D]">Duration / Type</div>
              <div className="text-sm font-medium text-[#202820] mt-0.5">{item.duration}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#78847D]">Mode</div>
              <div className="text-sm font-medium text-[#202820] mt-0.5">{item.mode}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#202820] mb-1.5">Overview</h2>
              <p className="text-sm text-[#202820]/90 leading-relaxed">{item.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-xl p-4">
                <div className="text-xs font-semibold text-[#202820] mb-1">Eligibility</div>
                <p className="text-xs text-[#78847D] leading-relaxed">{item.eligibility}</p>
              </div>
              <div className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-xl p-4">
                <div className="text-xs font-semibold text-[#202820] mb-1">Requirements</div>
                <p className="text-xs text-[#78847D] leading-relaxed">
                  {item.requirements || 'Contact provider for admission checklist.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#42A875] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#202820]">Timings</div>
                  <div className="text-[#78847D]">{item.timings}</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#202820]">Qualification & Experience</div>
                <div className="text-[#78847D]">
                  {item.qualification} · {item.experience}
                </div>
              </div>
              <div>
                <div className="font-semibold text-[#202820]">Age Group / Lead</div>
                <div className="text-[#78847D]">
                  {item.ageGroup}
                  {item.instructorOrCoach ? ` · ${item.instructorOrCoach}` : ''}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E6EAE6] text-xs text-[#78847D]">
            Transparency notice: UNNATI verifies provider identity where indicated, without claiming guaranteed employment or income outcomes.
          </div>
        </div>

        {/* Right Action & Provider Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-5 space-y-3">
            {isJob ? (
              <button
                type="button"
                disabled={item.hasApplied}
                onClick={() => (user ? setApplyOpen(true) : navigate('/login'))}
                className="w-full py-2.5 px-4 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934] disabled:opacity-60 transition-colors"
              >
                {item.hasApplied ? 'Application Submitted' : 'Apply Now'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEnquiryOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934] transition-colors"
              >
                Send Admission Enquiry
              </button>
            )}

            <button
              type="button"
              onClick={() => setEnquiryOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E6EAE6] bg-[#FFFFFF] text-[#202820] text-xs font-semibold hover:border-[#145C43]"
            >
              Contact Provider Directly
            </button>

            {!isJob && (
              <button
                type="button"
                disabled={item.hasApplied}
                onClick={() => (user ? setApplyOpen(true) : navigate('/login'))}
                className="w-full py-2 px-4 rounded-xl border border-[#E6EAE6] bg-[#F8F8F2] text-[#202820] text-xs font-medium hover:border-[#145C43] disabled:opacity-60"
              >
                {item.hasApplied ? 'Enrollment Requested' : 'Submit Seat / Batch Application'}
              </button>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={handleToggleSave}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-[#E6EAE6] text-xs font-medium text-[#202820] hover:bg-[#F8F8F2]"
              >
                <Bookmark className={`w-3.5 h-3.5 ${item.isSaved ? 'fill-current text-[#145C43]' : ''}`} />
                {item.isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-[#E6EAE6] text-xs font-medium text-[#202820] hover:bg-[#F8F8F2]"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-[#E6EAE6] text-xs font-medium text-[#78847D] hover:text-[#202820] hover:bg-[#F8F8F2]"
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>
          </div>

          {item.provider && (
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-medium text-[#78847D]">Listed By Provider</div>
              <Link
                to={`/provider/${item.provider.id}`}
                className="block font-display text-base font-bold text-[#202820] hover:text-[#145C43]"
              >
                {item.provider.name}
              </Link>
              <div className="text-xs text-[#78847D] space-y-1.5">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#42A875] shrink-0 mt-0.5" />
                  <span>{item.provider.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#42A875] shrink-0" />
                  <span className="font-mono-num">{item.contactPhone || item.provider.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#42A875] shrink-0" />
                  <span className="truncate">{item.contactEmail || item.provider.contactEmail}</span>
                </div>
              </div>
              <Link
                to={`/provider/${item.provider.id}`}
                className="block text-center py-2 rounded-lg border border-[#E6EAE6] text-xs font-semibold text-[#145C43] hover:bg-[#F8F8F2]"
              >
                View Provider Profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 bg-[#202820]/40 flex items-center justify-center p-4">
          <form
            onSubmit={submitApplication}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-[#202820]">
              Apply to {item.title}
            </h3>
            <input
              required
              type="text"
              placeholder="Full Name"
              value={appForm.applicantName}
              onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <input
              required
              type="tel"
              placeholder="Phone Number (e.g. +91 98450...)"
              value={appForm.applicantPhone}
              onChange={(e) => setAppForm({ ...appForm, applicantPhone: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Highest Qualification (e.g. B.Com, ITI, PUC)"
              value={appForm.qualification}
              onChange={(e) => setAppForm({ ...appForm, qualification: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Resume / Portfolio note or link (optional)"
              value={appForm.resumeLabel}
              onChange={(e) => setAppForm({ ...appForm, resumeLabel: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              required
              rows={3}
              placeholder="Briefly share your interest or availability..."
              value={appForm.coverNote}
              onChange={(e) => setAppForm({ ...appForm, coverNote: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E6EAE6] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 bg-[#202820]/40 flex items-center justify-center p-4">
          <form
            onSubmit={submitEnquiry}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-[#202820]">
              Send Enquiry to Provider
            </h3>
            <input
              required
              type="text"
              placeholder="Your Name"
              value={enqForm.senderName}
              onChange={(e) => setEnqForm({ ...enqForm, senderName: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                type="email"
                placeholder="Email"
                value={enqForm.senderEmail}
                onChange={(e) => setEnqForm({ ...enqForm, senderEmail: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                type="tel"
                placeholder="Phone"
                value={enqForm.senderPhone}
                onChange={(e) => setEnqForm({ ...enqForm, senderPhone: e.target.value })}
                className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <input
              required
              type="text"
              placeholder="Subject"
              value={enqForm.subject}
              onChange={(e) => setEnqForm({ ...enqForm, subject: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              required
              rows={3}
              placeholder="Ask about batch timings, admission dates, fees, or interview steps..."
              value={enqForm.message}
              onChange={(e) => setEnqForm({ ...enqForm, message: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEnquiryOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E6EAE6] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
              >
                {submitting ? 'Sending...' : 'Send Enquiry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-[#202820]/40 flex items-center justify-center p-4">
          <form
            onSubmit={submitReport}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-[#202820]">Report Listing</h3>
            <select
              value={reportForm.reason}
              onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            >
              <option>Incorrect fee or salary</option>
              <option>Expired or closed batch</option>
              <option>Misleading or suspicious claim</option>
              <option>Wrong contact or address</option>
            </select>
            <textarea
              required
              rows={3}
              placeholder="Describe what needs review by the UNNATI moderation team..."
              value={reportForm.details}
              onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
              className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E6EAE6] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
