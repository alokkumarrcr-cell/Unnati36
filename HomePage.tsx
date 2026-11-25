import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Compass,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { SkeletonCard } from '../components/SkeletonCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import type { OpportunityRecord } from '../types.ts';

const QUICK_SUGGESTIONS = [
  'Python Bootcamp',
  'Solar Technician',
  'Part-Time Work From Home',
  'Badminton Coaching',
  'Tailoring Batch',
  'Tally Prime GST',
];

export function HomePage() {
  const { t, authFetch, user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [stats, setStats] = useState({
    activeOpportunities: 0,
    verifiedProviders: 0,
    categoriesCount: 4,
    citiesCount: 1,
  });
  const [featured, setFeatured] = useState<OpportunityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/stats/public').then((r) => r.json()),
      authFetch('/api/opportunities?featuredOnly=true&limit=3').then((r) => r.json()),
    ])
      .then(([sData, oppData]) => {
        if (!active) return;
        if (sData && typeof sData.activeOpportunities === 'number') {
          setStats(sData);
        }
        if (oppData?.items) {
          setFeatured(oppData.items);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authFetch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore');
  };

  const handleToggleSave = async (oppId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const res = await authFetch('/api/user/save', {
      method: 'POST',
      body: JSON.stringify({ opportunityId: oppId }),
    });
    if (res.ok) {
      const { saved } = await res.json();
      setFeatured((prev) => prev.map((o) => (o.id === oppId ? { ...o, isSaved: saved } : o)));
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto space-y-14">
      {/* HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#145C43] mb-4">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('locationBadge')} · Hyperlocal Pilot</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#202820] leading-[1.12] text-balance mb-4">
              {t('heroHeadline')}
            </h1>

            <p className="text-base sm:text-lg text-[#78847D] leading-relaxed max-w-xl">
              {t('heroSubtext')}
            </p>
          </div>

          {/* Animated Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
            <div
              className={`flex items-center bg-[#FFFFFF] rounded-xl border transition-all duration-150 px-3.5 py-2 ${
                searchFocused
                  ? 'border-[#145C43] ring-2 ring-[#145C43]/15'
                  : 'border-[#E6EAE6]'
              }`}
            >
              <Search className="w-4 h-4 text-[#78847D] mr-2.5 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, jobs, badminton, tailoring in Raichur..."
                className="flex-1 bg-transparent text-sm text-[#202820] placeholder:text-[#78847D] focus:outline-none min-w-0"
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934] transition-colors whitespace-nowrap shrink-0"
              >
                Search
              </button>
            </div>

            {searchFocused && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl shadow-md p-2 z-20">
                <div className="px-2.5 py-1 text-[11px] font-medium text-[#78847D]">
                  Popular Raichur searches
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {QUICK_SUGGESTIONS.filter(
                    (s) => !query.trim() || s.toLowerCase().includes(query.toLowerCase())
                  ).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={() => navigate(`/explore?q=${encodeURIComponent(item)}`)}
                      className="text-left px-2.5 py-1.5 rounded-lg text-xs text-[#202820] hover:bg-[#F8F8F2] hover:text-[#145C43] transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#145C43] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0F4934] active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
            >
              <span>{t('exploreCta')}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/provider/register"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FFFFFF] border border-[#E6EAE6] text-[#202820] text-sm font-semibold hover:border-[#145C43]/40 hover:text-[#145C43] transition-all whitespace-nowrap shrink-0"
            >
              <span>{t('joinProviderCta')}</span>
            </Link>
            <Link
              to="/guide"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#78847D] hover:text-[#145C43] whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Section Guide</span>
            </Link>
          </div>
        </div>

        {/* Hero Visual + Floating Preview Cards */}
        <div className="lg:col-span-5 relative flex flex-col">
          <div className="relative rounded-2xl overflow-hidden border border-[#E6EAE6] bg-[#FFFFFF] flex-1 min-h-[280px]">
            <img
              src="/src/assets/images/hero_raichur_workshop_1795627676854.jpg"
              alt="Young adults learning digital and vocational skills together in a Raichur training centre"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover min-h-[280px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#202820]/75 via-[#202820]/20 to-transparent" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="absolute bottom-4 left-4 right-4 bg-[#FFFFFF]/95 backdrop-blur border border-[#E6EAE6] rounded-xl p-4"
            >
              <div className="flex items-center justify-between text-xs text-[#78847D] mb-1">
                <span>Raichur Pilot Showcase · Sample</span>
                <span className="inline-flex items-center gap-1 text-[#145C43] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Verified Workflow
                </span>
              </div>
              <div className="font-display font-semibold text-sm text-[#202820]">
                Discover Skills. Find Opportunities. Build Income.
              </div>
              <div className="text-xs text-[#78847D] mt-0.5">
                Station Road · Lingasugur Road · Jawahar Nagar · District Stadium
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REAL-DATA TRUST KPI STRIP (Full-width row below hero split) */}
      <section
        aria-label="Live Raichur platform statistics"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-5"
      >
        <div className="px-2">
          <div className="font-mono-num text-2xl font-bold text-[#145C43]">
            {stats.activeOpportunities}
          </div>
          <div className="text-xs text-[#78847D] mt-0.5">Active Pilot Listings</div>
        </div>
        <div className="px-2 border-l border-[#E6EAE6]">
          <div className="font-mono-num text-2xl font-bold text-[#145C43]">
            {stats.verifiedProviders}
          </div>
          <div className="text-xs text-[#78847D] mt-0.5">Verified Local Providers</div>
        </div>
        <div className="px-2 lg:border-l border-[#E6EAE6]">
          <div className="font-mono-num text-2xl font-bold text-[#145C43]">
            {stats.categoriesCount}
          </div>
          <div className="text-xs text-[#78847D] mt-0.5">Core Opportunity Pillars</div>
        </div>
        <div className="px-2 border-l border-[#E6EAE6]">
          <div className="font-mono-num text-2xl font-bold text-[#145C43]">
            Raichur
          </div>
          <div className="text-xs text-[#78847D] mt-0.5">Karnataka Launch District</div>
        </div>
      </section>

      {/* 4 DEDICATED CATEGORY PREVIEW CARDS */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#202820]">
              Four Pathways Across Your Neighbourhood
            </h2>
            <p className="text-sm text-[#78847D] mt-1">
              Each pillar opens an independent discovery workspace with tailored filters.
            </p>
          </div>
          <Link
            to="/explore"
            className="text-xs font-semibold text-[#145C43] hover:underline whitespace-nowrap"
          >
            View unified Explore directory →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              to: '/learn',
              title: 'Learn',
              subtitle: 'Courses, ITI, Tailoring & NGOs',
              desc: 'Coding, computer courses, tailoring, beauty wellness, and zero-fee government programmes.',
              icon: BookOpen,
              img: '/src/assets/images/category_learn_coding_1795627677129.jpg',
            },
            {
              to: '/earn',
              title: 'Earn',
              subtitle: 'Jobs, Internships & Freelance',
              desc: 'Local full-time roles, apprenticeships, fieldwork, and flexible work-from-home income.',
              icon: Briefcase,
              img: '/src/assets/images/category_earn_work_1795627677474.jpg',
            },
            {
              to: '/grow',
              title: 'Grow',
              subtitle: 'Sports, Arts, Music & Yoga',
              desc: 'Badminton, cricket, chess, classical music, dance, drawing, and martial arts batches.',
              icon: Award,
              img: '/src/assets/images/category_grow_sports_1795627678661.jpg',
            },
            {
              to: '/connect',
              title: 'Connect',
              subtitle: 'Local Providers & Institutions',
              desc: 'Verified tutors, coaches, academies, employers, and community NGOs in Raichur.',
              icon: Users,
              img: '/src/assets/images/about_raichur_hub_1795627678445.jpg',
            },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.to}
                to={cat.to}
                className="group bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl overflow-hidden hover:border-[#42A875]/60 hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-[#F8F8F2] overflow-hidden">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-display text-lg font-bold text-[#202820] group-hover:text-[#145C43]">
                        {cat.title}
                      </span>
                      <Icon className="w-4 h-4 text-[#42A875]" aria-hidden="true" />
                    </div>
                    <div className="text-xs font-medium text-[#145C43] mb-1.5">
                      {cat.subtitle}
                    </div>
                    <p className="text-xs text-[#78847D] leading-relaxed">{cat.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#145C43] inline-flex items-center gap-1">
                    Open {cat.title} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED PILOT OPPORTUNITIES */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#202820]">
              Featured Raichur Pilot Opportunities
            </h2>
            <p className="text-sm text-[#78847D] mt-1">
              Clearly labelled sample listings illustrating verified local programmes for the pilot.
            </p>
          </div>
          <Link
            to="/explore"
            className="px-4 py-2 rounded-lg border border-[#E6EAE6] bg-[#FFFFFF] text-xs font-semibold text-[#202820] hover:border-[#145C43] hover:text-[#145C43] whitespace-nowrap"
          >
            Browse All Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {loading
            ? [1, 2, 3].map((k) => <SkeletonCard key={k} />)
            : featured.map((opp, idx) => (
                <OpportunityCard
                  key={opp.id}
                  item={opp}
                  index={idx}
                  onToggleSave={handleToggleSave}
                />
              ))}
        </div>
      </section>

      {/* PROVIDER CTA & ABOUT SPLIT */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#145C43] text-[#FFFFFF] rounded-2xl p-7 flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs font-medium text-[#EABF59] mb-2">
              For Academies, Coaches, Employers & NGOs
            </div>
            <h3 className="font-display text-2xl font-bold leading-snug mb-3">
              Reach Local Talent in Raichur Without Noise
            </h3>
            <p className="text-sm text-[#FFFFFF]/85 leading-relaxed">
              Publish courses, local jobs, apprenticeships, or sports batches through a verified provider portal. Every listing undergoes manual review to protect community trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/provider/register"
              className="px-4 py-2.5 rounded-lg bg-[#EABF59] text-[#202820] text-xs font-bold hover:bg-[#e1b346] transition-colors whitespace-nowrap"
            >
              Register as a Provider
            </Link>
            <Link
              to="/pricing"
              className="px-4 py-2.5 rounded-lg border border-[#FFFFFF]/25 text-[#FFFFFF] text-xs font-semibold hover:bg-[#FFFFFF]/10 transition-colors whitespace-nowrap"
            >
              View Visibility Plans
            </Link>
          </div>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-7 flex flex-col justify-between gap-5">
          <div>
            <div className="text-xs font-medium text-[#145C43] mb-2">
              About UNNATI · Local Talent Deserves Local Opportunity
            </div>
            <h3 className="font-display text-2xl font-bold text-[#202820] leading-snug mb-3">
              Built in Raichur, Ready Across Karnataka
            </h3>
            <p className="text-sm text-[#78847D] leading-relaxed">
              Valuable local training centres, small business jobs, and sports academies often stay invisible online. UNNATI organizes them by locality, fee structure, eligibility, and verification status—with free essential access for every learner and job seeker.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/about"
              className="text-xs font-semibold text-[#145C43] hover:underline whitespace-nowrap"
            >
              Read our Raichur Pilot story →
            </Link>
            <Link
              to="/guide"
              className="text-xs font-semibold text-[#202820] hover:text-[#145C43] whitespace-nowrap"
            >
              Open Section-by-Section Guide →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
