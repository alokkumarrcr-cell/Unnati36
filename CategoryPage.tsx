import { useEffect, useState } from 'react';
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { SkeletonCard } from '../components/SkeletonCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  type OpportunityRecord,
  type ProviderRecord,
  RAICHUR_LOCALITIES,
} from '../types.ts';

interface CategoryConfig {
  slug: 'learn' | 'earn' | 'grow' | 'connect';
  title: string;
  subtitle: string;
  subcategories: string[];
}

const CONFIG: Record<'learn' | 'earn' | 'grow' | 'connect', CategoryConfig> = {
  learn: {
    slug: 'learn',
    title: 'Learn — Local Courses, Skills & Training',
    subtitle:
      'Coding, computer courses, ITI training, tailoring, embroidery, beauty & wellness, digital marketing, graphic design, government-supported training, and NGO programmes.',
    subcategories: [
      'All',
      'Coding',
      'Computer Courses',
      'Engineering Training',
      'ITI Training',
      'Tailoring',
      'Embroidery',
      'Beauty & Wellness',
      'Digital Marketing',
      'Graphic Design',
      'Government-Supported Training',
      'NGO Programmes',
    ],
  },
  earn: {
    slug: 'earn',
    title: 'Earn — Jobs, Internships & Flexible Income',
    subtitle:
      'Full-time jobs, part-time jobs, internships, apprenticeships, freelancing, fieldwork, work from home, and entry-level roles in Raichur.',
    subcategories: [
      'All',
      'Full-time Jobs',
      'Part-time Jobs',
      'Internships',
      'Apprenticeships',
      'Freelancing',
      'Fieldwork',
      'Work From Home',
      'Entry-Level Jobs',
    ],
  },
  grow: {
    slug: 'grow',
    title: 'Grow — Sports, Arts, Music & Extracurriculars',
    subtitle:
      'Chess, cricket, football, badminton, athletics, dance, music, drawing, yoga, and martial arts batches across Raichur.',
    subcategories: [
      'All',
      'Chess',
      'Cricket',
      'Football',
      'Badminton',
      'Athletics',
      'Dance',
      'Music',
      'Drawing',
      'Yoga',
      'Martial Arts',
    ],
  },
  connect: {
    slug: 'connect',
    title: 'Connect — Verified Local Providers & Institutions',
    subtitle:
      'Directory of Raichur tutors, trainers, coaches, academies, local businesses, employers, NGOs, and educational institutions.',
    subcategories: [
      'All',
      'Tutor',
      'Trainer',
      'Coach',
      'Academy',
      'Local Business',
      'Employer',
      'NGO',
      'Institution',
    ],
  },
};

export function CategoryPage({ category }: { category: 'learn' | 'earn' | 'grow' | 'connect' }) {
  const cfg = CONFIG[category];
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();

  const [selectedSub, setSelectedSub] = useState('All');
  const [locality, setLocality] = useState('all');
  const [feeType, setFeeType] = useState('all');
  const [mode, setMode] = useState('all');
  const [items, setItems] = useState<OpportunityRecord[]>([]);
  const [providersList, setProvidersList] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedSub('All');
    setLocality('all');
    setFeeType('all');
    setMode('all');
  }, [category]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (category === 'connect') {
      const p = new URLSearchParams();
      if (selectedSub !== 'All') p.set('category', selectedSub);
      if (locality !== 'all') p.set('locality', locality);
      fetch(`/api/providers?${p.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (active) setProvidersList(Array.isArray(data) ? data : []);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      const p = new URLSearchParams();
      p.set('category', category);
      if (selectedSub !== 'All') p.set('subcategory', selectedSub);
      if (locality !== 'all') p.set('locality', locality);
      if (feeType !== 'all') p.set('feeType', feeType);
      if (mode !== 'all') p.set('mode', mode);

      authFetch(`/api/opportunities?${p.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (active) setItems(data.items || []);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [category, selectedSub, locality, feeType, mode, authFetch]);

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
      setItems((prev) => prev.map((o) => (o.id === oppId ? { ...o, isSaved: saved } : o)));
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-12 py-8 max-w-6xl mx-auto space-y-6">
      <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-2xl p-6 sm:p-8">
        <div className="text-xs font-semibold text-[#145C43] uppercase tracking-wide mb-2">
          {cfg.slug} Pillar · Raichur, Karnataka
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820] mb-2">
          {cfg.title}
        </h1>
        <p className="text-sm text-[#78847D] max-w-3xl leading-relaxed">{cfg.subtitle}</p>

        {/* Subcategory Segmented Filter Buttons */}
        <div className="flex flex-wrap gap-1.5 mt-5">
          {cfg.subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSub(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                selectedSub === sub
                  ? 'bg-[#145C43] text-[#FFFFFF] border-[#145C43]'
                  : 'bg-[#F8F8F2] text-[#202820] border-[#E6EAE6] hover:border-[#145C43]/40'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Category-Specific Filter Bar */}
        <div className="mt-5 pt-4 border-t border-[#E6EAE6] flex flex-wrap items-center gap-3">
          <select
            aria-label="Filter by Raichur locality"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs text-[#202820]"
          >
            <option value="all">All Raichur Localities</option>
            {RAICHUR_LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {category !== 'connect' && (
            <>
              <select
                aria-label="Filter by fee or salary"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs text-[#202820]"
              >
                <option value="all">Any Fee / Compensation</option>
                <option value="Free">Free / Govt-Supported</option>
                <option value="Paid">Paid</option>
                <option value="Salary">Monthly Salary</option>
                <option value="Stipend">Stipend</option>
              </select>

              <select
                aria-label="Filter by mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs text-[#202820]"
              >
                <option value="all">Any Mode</option>
                <option value="In-person">In-person</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Online">Online</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Results Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((k) => (
            <SkeletonCard key={k} />
          ))}
        </div>
      ) : category === 'connect' ? (
        providersList.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-10 text-center text-sm text-[#78847D]">
            No local providers match this filter yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providersList.map((prov) => (
              <div
                key={prov.id}
                className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-[#42A875]/60 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#78847D] mb-2">
                    <span className="font-semibold text-[#145C43]">{prov.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{prov.providerType}</span>
                    {prov.isSample && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Sample Pilot</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display text-base font-bold text-[#202820] mb-1">
                    {prov.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs mb-2.5">
                    {prov.verificationStatus === 'Verified' ? (
                      <span className="inline-flex items-center gap-1 text-[#145C43] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified Provider
                      </span>
                    ) : (
                      <span className="text-[#78847D]">{prov.verificationStatus}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#78847D] leading-relaxed line-clamp-3">
                    {prov.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E6EAE6] flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-[#78847D] truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#42A875] shrink-0" />
                    {prov.locality}
                  </span>
                  <Link
                    to={`/provider/${prov.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934] whitespace-nowrap"
                  >
                    View Profile
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : items.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-10 text-center">
          <p className="text-sm text-[#78847D] mb-3">
            No listings found in {selectedSub} for the selected filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSub('All');
              setLocality('all');
              setFeeType('all');
              setMode('all');
            }}
            className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
          >
            Show All {category.toUpperCase()} Listings
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <OpportunityCard
              key={item.id}
              item={item}
              index={idx}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
