import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { OpportunityRecord, ProviderRecord } from '../types.ts';

export function ProviderProfilePage() {
  const { id } = useParams();
  const { authFetch, user } = useAuth();
  const [provider, setProvider] = useState<ProviderRecord | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageSent, setMessageSent] = useState('');
  const [form, setForm] = useState({
    senderName: user?.name || '',
    senderEmail: user?.email || '',
    senderPhone: '',
    subject: 'General Enquiry',
    message: '',
  });

  useEffect(() => {
    fetch(`/api/providers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProvider(data.provider || null);
        setOpportunities(data.opportunities || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const sendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    const res = await authFetch('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify({ providerId: provider.id, ...form }),
    });
    if (res.ok) {
      setMessageSent('Your enquiry has been sent to this provider.');
      setForm({ ...form, message: '' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-48 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="font-display text-xl font-bold mb-2">Provider Not Found</h1>
        <Link to="/connect" className="text-sm text-[#145C43] underline">
          Back to Connect Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <Link to="/connect" className="inline-flex items-center gap-1.5 text-xs text-[#78847D] hover:text-[#145C43]">
        <ArrowLeft className="w-4 h-4" />
        Back to Connect Directory
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#78847D] mb-2">
              <span className="font-semibold text-[#145C43]">{provider.category}</span>
              <span aria-hidden="true">·</span>
              <span>{provider.providerType}</span>
              {provider.isSample && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Sample Pilot Provider</span>
                </>
              )}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
              {provider.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
              {provider.verificationStatus === 'Verified' ? (
                <span className="inline-flex items-center gap-1 text-[#145C43] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Provider
                </span>
              ) : (
                <span className="text-[#78847D] font-medium">{provider.verificationStatus}</span>
              )}
              <span className="inline-flex items-center gap-1 text-[#78847D]">
                <MapPin className="w-3.5 h-3.5 text-[#42A875]" />
                {provider.address}
              </span>
            </div>

            <p className="text-sm text-[#202820]/90 leading-relaxed mt-5">
              {provider.description}
            </p>

            <div className="mt-5 pt-4 border-t border-[#E6EAE6] flex flex-wrap gap-6 text-xs text-[#78847D]">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#145C43]" />
                {provider.contactPhone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#145C43]" />
                {provider.contactEmail}
              </span>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-[#202820] mb-4">
              Active Opportunities ({opportunities.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp, idx) => (
                <OpportunityCard key={opp.id} item={opp} index={idx} />
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={sendEnquiry}
          className="lg:col-span-4 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-3"
        >
          <h3 className="font-display text-base font-bold text-[#202820]">
            Message This Provider
          </h3>
          {messageSent && (
            <div className="p-3 rounded-lg bg-[#145C43]/10 text-[#145C43] text-xs font-medium">
              {messageSent}
            </div>
          )}
          <input
            required
            type="text"
            placeholder="Your Name"
            value={form.senderName}
            onChange={(e) => setForm({ ...form, senderName: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
          />
          <input
            required
            type="email"
            placeholder="Your Email"
            value={form.senderEmail}
            onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
          />
          <input
            required
            type="tel"
            placeholder="Your Phone"
            value={form.senderPhone}
            onChange={(e) => setForm({ ...form, senderPhone: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
          />
          <textarea
            required
            rows={4}
            placeholder="Write your question about timings, fees, or services..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934]"
          >
            Send Enquiry
          </button>
        </form>
      </div>
    </div>
  );
}
