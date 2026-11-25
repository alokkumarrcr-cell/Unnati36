import React, { useCallback, useEffect, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OpportunityCard } from '../components/OpportunityCard.tsx';
import { SkeletonCard } from '../components/SkeletonCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { type OpportunityRecord, RAICHUR_LOCALITIES } from '../types.ts';

const PAGE_SIZE = 9;

export function ExplorePage() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [locality, setLocality] = useState('all');
  const [feeType, setFeeType] = useState('all');
  const [mode, setMode] = useState('all');
  const [opportunityType, setOpportunityType] = useState('all');
  const [qualification, setQualification] = useState('all');
  const [experience, setExperience] = useState('all');
  const [ageGroup, setAgeGroup] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [items, setItems] = useState<OpportunityRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'all') params.set('category', category);
      if (locality !== 'all') params.set('locality', locality);
      if (feeType !== 'all') params.set('feeType', feeType);
      if (mode !== 'all') params.set('mode', mode);
      if (opportunityType !== 'all') params.set('opportunityType', opportunityType);
      if (qualification !== 'all') params.set('qualification', qualification);
      if (experience !== 'all') params.set('experience', experience);
      if (ageGroup !== 'all') params.set('ageGroup', ageGroup);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      params.set('sort', sort);
      params.set('limit', String(limit));

      const res = await authFetch(`/api/opportunities?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [
    authFetch,
    q,
    category,
    locality,
    feeType,
    mode,
    opportunityType,
    qualification,
    experience,
    ageGroup,
    verifiedOnly,
    sort,
    limit,
  ]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

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

  const resetFilters = () => {
    setQ('');
    setCategory('all');
    setLocality('all');
    setFeeType('all');
    setMode('all');
    setOpportunityType('all');
    setQualification('all');
    setExperience('all');
    setAgeGroup('all');
    setVerifiedOnly(false);
    setSort('newest');
    setLimit(PAGE_SIZE);
    setSearchParams({});
  };

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">
      {/* Header & Search */}
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#202820]">
          Explore Local Opportunities
        </h1>
        <p className="text-sm text-[#78847D] mt-1">
          Filter Raichur skills, jobs, sports, and community providers in real time from PostgreSQL.
        </p>

        <div className="mt-5 flex flex-col lg:flex-row gap-3">
          <div className="flex-1 flex items-center bg-[#FFFFFF] border border-[#E6EAE6] focus-within:border-[#145C43] rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-[#78847D] mr-2.5 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Python, Tally, Electrician, Badminton, Work From Home..."
              className="flex-1 bg-transparent text-sm text-[#202820] focus:outline-none min-w-0"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="text-[#78847D] hover:text-[#202820] p-1"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <select
            aria-label="Select locality"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl px-3.5 py-2.5 text-sm text-[#202820] focus:border-[#145C43] focus:outline-none"
          >
            <option value="all">All Raichur Localities</option>
            {RAICHUR_LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort opportunities"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl px-3.5 py-2.5 text-sm text-[#202820] focus:border-[#145C43] focus:outline-none"
          >
            <option value="newest">Sort: Newly Added</option>
            <option value="featured">Sort: Featured First</option>
            <option value="views">Sort: Most Viewed</option>
          </select>
        </div>

        {/* Category Tabs + View Mode */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl">
            {[
              { slug: 'all', label: 'All Categories' },
              { slug: 'learn', label: 'Learn' },
              { slug: 'earn', label: 'Earn' },
              { slug: 'grow', label: 'Grow' },
            ].map((tab) => (
              <button
                key={tab.slug}
                type="button"
                onClick={() => setCategory(tab.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  category === tab.slug
                    ? 'bg-[#145C43] text-[#FFFFFF]'
                    : 'text-[#78847D] hover:text-[#202820]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6EAE6] bg-[#FFFFFF] text-xs font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
            <span className="text-xs text-[#78847D] font-mono-num">
              {total} result{total === 1 ? '' : 's'}
            </span>
            <div className="flex items-center p-1 bg-[#FFFFFF] border border-[#E6EAE6] rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded ${
                  viewMode === 'grid' ? 'bg-[#145C43] text-[#FFFFFF]' : 'text-[#78847D]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded ${
                  viewMode === 'list' ? 'bg-[#145C43] text-[#FFFFFF]' : 'text-[#78847D]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Filter Sidebar */}
        <aside
          className={`lg:col-span-3 bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-5 space-y-4 ${
            mobileFiltersOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#202820]">Refine Results</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-[#145C43] hover:underline"
            >
              Reset all
            </button>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium text-[#202820] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-[#E6EAE6] text-[#145C43] focus:ring-[#145C43]"
            />
            Verified Providers Only
          </label>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">
              Fees / Compensation
            </label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">Any Fee / Salary</option>
              <option value="Free">Free / Govt-Supported</option>
              <option value="Paid">Paid Course / Batch</option>
              <option value="Salary">Monthly Salary</option>
              <option value="Stipend">Stipend</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">
              Opportunity Type
            </label>
            <select
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">All Types</option>
              <option value="Course">Course</option>
              <option value="Workshop">Workshop</option>
              <option value="Job">Job</option>
              <option value="Internship">Internship</option>
              <option value="Apprenticeship">Apprenticeship</option>
              <option value="Sports">Sports</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">Any Mode</option>
              <option value="In-person">In-person</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Online">Online / Work From Home</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">
              Qualification
            </label>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">Any Qualification</option>
              <option value="10th">10th Pass / Any</option>
              <option value="12th">12th / PUC</option>
              <option value="ITI">ITI / Diploma</option>
              <option value="Graduate">Graduate / Degree</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">Any Experience</option>
              <option value="Beginner">Beginner / Fresher</option>
              <option value="0">0–2 years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#78847D] mb-1">Age Group</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className="w-full bg-[#F8F8F2] border border-[#E6EAE6] rounded-lg px-3 py-2 text-xs"
            >
              <option value="all">All Ages</option>
              <option value="8">Youth (8–19)</option>
              <option value="18">Adults (18+)</option>
            </select>
          </div>
        </aside>

        {/* Results Grid / List */}
        <div className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-10 text-center">
              <h3 className="font-display text-lg font-semibold text-[#202820]">
                No matching opportunities found
              </h3>
              <p className="text-sm text-[#78847D] mt-1 mb-4">
                Try clearing a filter or broadening your Raichur locality selection.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'flex flex-col gap-3'
                }
              >
                {items.map((item, idx) => (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    layout={viewMode}
                    index={idx}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {items.length < total && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setLimit((l) => l + PAGE_SIZE)}
                    className="px-5 py-2.5 rounded-xl border border-[#E6EAE6] bg-[#FFFFFF] text-xs font-semibold text-[#202820] hover:border-[#145C43] hover:text-[#145C43]"
                  >
                    Load More ({total - items.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
