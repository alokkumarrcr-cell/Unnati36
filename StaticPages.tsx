import React, { useState } from 'react';
import { CheckCircle2, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto space-y-10">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl overflow-hidden">
        <div className="aspect-[16/7] w-full bg-[#F8F8F2]">
          <img
            src="/src/assets/images/about_raichur_hub_1795627678445.jpg"
            alt="Modern community learning centre in Raichur, Karnataka"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 sm:p-8 space-y-4">
          <div className="text-xs font-semibold text-[#145C43]">About UNNATI</div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
            Local Talent Deserves Local Opportunity
          </h1>
          <p className="text-sm text-[#78847D] leading-relaxed">
            In cities and towns across Karnataka, capable students, homemakers, and job seekers often miss nearby courses, apprenticeships, part-time roles, and sports academies simply because local providers rely on word-of-mouth or scattered posters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-2">
          <h2 className="font-display text-lg font-bold text-[#202820]">The Problem</h2>
          <p className="text-xs text-[#78847D] leading-relaxed">
            Mainstream job boards focus on metro corporate roles, leaving hyperlocal ITI courses, tailoring batches, neighborhood retail jobs, and district sports coaching unindexed and hard to verify.
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-2">
          <h2 className="font-display text-lg font-bold text-[#202820]">The UNNATI Solution</h2>
          <p className="text-xs text-[#78847D] leading-relaxed">
            A structured hyperlocal ecosystem built around four practical pillars—Learn, Earn, Grow, and Connect—with manual provider verification, locality filtering, and free access for every seeker.
          </p>
        </div>
      </div>

      <div className="bg-[#145C43] text-[#FFFFFF] rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="text-xs font-semibold text-[#EABF59]">Raichur Pilot & Future Expansion</div>
        <h2 className="font-display text-xl font-bold">
          Starting in Raichur, Built to Scale Across Karnataka
        </h2>
        <p className="text-sm text-[#FFFFFF]/85 leading-relaxed">
          UNNATI launches with Raichur localities—Station Road, Lingasugur Road, Jawahar Nagar, Nijalingappa Colony, and District Stadium Road—with multi-city architecture and Kannada/English language support ready for neighboring districts.
        </p>
        <p className="text-xs text-[#EABF59] pt-2 font-medium">
          &ldquo;Opportunities shouldn&apos;t remain hidden just because people don&apos;t know where to find them. UNNATI brings opportunities closer to everyone.&rdquo;
        </p>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'Partnership Enquiry',
    message: '',
  });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSent(true);
      setForm({ name: '', email: '', phone: '', topic: 'Partnership Enquiry', message: '' });
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-3">
          <h1 className="font-display text-2xl font-bold text-[#202820]">Contact UNNATI</h1>
          <p className="text-xs text-[#78847D] leading-relaxed">
            Reach out for Raichur institutional partnerships, NGO training collaborations, CSR sponsorships, or provider onboarding support.
          </p>
          <div className="pt-2 space-y-2 text-xs text-[#202820]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#145C43]" />
              <span>Raichur, Karnataka 584101</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#145C43]" />
              <span className="font-mono-num">Pilot Desk · Raichur Coordination</span>
            </div>
          </div>
          <div className="pt-3 border-t border-[#E6EAE6]">
            <Link
              to="/provider/register"
              className="inline-block px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              Join as a Provider →
            </Link>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 space-y-4"
      >
        <h2 className="font-display text-lg font-bold text-[#202820]">Send a Message</h2>
        {sent && (
          <div className="p-3 rounded-lg bg-[#145C43]/10 text-[#145C43] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Message recorded in our Raichur coordination queue.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            type="tel"
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
          >
            <option>Partnership Enquiry</option>
            <option>Institutional / CSR Collaboration</option>
            <option>Provider Support</option>
            <option>General Feedback</option>
          </select>
        </div>
        <textarea
          required
          rows={4}
          placeholder="How can we collaborate in Raichur?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-[#E6EAE6] rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}

export function PricingPage() {
  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto space-y-6">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
          Transparent Pilot Pricing
        </h1>
        <p className="text-sm text-[#78847D] mt-2">
          Essential discovery, applications, and alerts are 100% free for all learners and job seekers. Paid provider plans are optional visibility tiers—and never buy verification.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            name: 'Community Free',
            price: '₹0',
            audience: 'For Tutors, Coaches & NGOs',
            points: [
              'Up to 3 active verified listings',
              'Direct user enquiry inbox',
              'Standard search visibility in Raichur',
            ],
          },
          {
            name: 'Growth Visibility',
            price: '₹499 / mo',
            audience: 'For Academies & Local Employers',
            points: [
              'Up to 15 active listings',
              'Clearly labelled Sponsored Category Top slot',
              'Listing views & enquiry conversion insights',
            ],
          },
          {
            name: 'Institutional Partner',
            price: '₹1,499 / mo',
            audience: 'For Colleges, Training Networks & CSR',
            points: [
              'Unlimited batch & recruitment listings',
              'Featured placement & multi-locality reach',
              'Dedicated Raichur pilot onboarding support',
            ],
          },
        ].map((tier) => (
          <div
            key={tier.name}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 flex flex-col justify-between gap-5"
          >
            <div>
              <div className="text-xs font-medium text-[#145C43]">{tier.audience}</div>
              <h2 className="font-display text-lg font-bold text-[#202820] mt-1">{tier.name}</h2>
              <div className="font-mono-num text-2xl font-bold text-[#145C43] mt-2">
                {tier.price}
              </div>
              <ul className="mt-4 space-y-2 text-xs text-[#78847D]">
                {tier.points.map((pt) => (
                  <li key={pt}>· {pt}</li>
                ))}
              </ul>
            </div>
            <Link
              to="/provider/subscription"
              className="block text-center py-2.5 rounded-xl bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
            >
              Manage in Provider Portal
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LegalPage({ doc }: { doc: 'privacy' | 'terms' | 'guidelines' | 'grievance' }) {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      body: 'UNNATI collects only the contact, profile, and preference details voluntarily provided by learners, job seekers, and providers to connect local opportunities in Raichur. Notification channels such as email or WhatsApp are opt-in only.',
    },
    terms: {
      title: 'Terms and Conditions',
      body: 'UNNATI acts as a hyperlocal discovery and verification platform. While we manually review provider submissions and flag sponsored placements transparently, UNNATI does not guarantee employment, income, or admission outcomes.',
    },
    guidelines: {
      title: 'Listing & Verification Guidelines',
      body: 'All provider listings must state accurate fees or compensation, locality, eligibility, and timings. Misleading claims, hidden charges, or unverified guarantees result in immediate listing removal and provider suspension.',
    },
    grievance: {
      title: 'Grievance Redressal',
      body: 'If you encounter inaccurate listing details, unfair practices, or verification concerns in Raichur, use the Report Listing button on any opportunity page or write via our Contact page. Moderators review open complaints promptly.',
    },
  }[doc];

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl mx-auto">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8 space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#202820]">{content.title}</h1>
        <p className="text-sm text-[#78847D] leading-relaxed">{content.body}</p>
        <div className="pt-2">
          <Link to="/contact" className="text-xs font-semibold text-[#145C43] hover:underline">
            Contact Moderation Desk →
          </Link>
        </div>
      </div>
    </div>
  );
}
