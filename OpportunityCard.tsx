import { Bookmark, MapPin, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { OpportunityRecord } from '../types.ts';

interface OpportunityCardProps {
  item: OpportunityRecord;
  onToggleSave?: (id: number) => void;
  layout?: 'grid' | 'list';
  index?: number;
}

export function OpportunityCard({
  item,
  onToggleSave,
  layout = 'grid',
  index = 0,
}: OpportunityCardProps) {
  const updatedLabel = new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const isVerified = item.verificationStatus === 'Verified';

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.24) }}
      className={`group bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl transition-all duration-150 hover:-translate-y-0.5 hover:border-[#42A875]/60 hover:shadow-sm ${
        layout === 'list'
          ? 'p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5'
          : 'p-5 flex flex-col justify-between gap-4'
      }`}
    >
      <div className={layout === 'list' ? 'flex-1 min-w-0' : ''}>
        {/* Quiet inline metadata row — zero static pill enclosures */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78847D] mb-2">
          <span className="font-semibold text-[#145C43] capitalize">{item.categorySlug}</span>
          <span aria-hidden="true">·</span>
          <span>{item.subcategory}</span>
          <span aria-hidden="true">·</span>
          <span>{item.opportunityType}</span>
          {item.isSponsored && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[#9A6E12]">Sponsored</span>
            </>
          )}
          {item.isSample && (
            <>
              <span aria-hidden="true">·</span>
              <span>Sample Pilot</span>
            </>
          )}
        </div>

        <Link
          to={`/opportunity/${item.id}`}
          className="block font-display text-base font-semibold text-[#202820] group-hover:text-[#145C43] transition-colors leading-snug mb-1.5"
        >
          {item.title}
        </Link>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78847D] mb-2.5">
          <span className="font-medium text-[#202820]">{item.providerName || 'Local Provider'}</span>
          {isVerified && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-[#145C43] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                Verified
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-[#78847D] line-clamp-2 leading-relaxed">{item.description}</p>
      </div>

      <div
        className={
          layout === 'list'
            ? 'flex flex-row md:flex-col items-center md:items-end justify-between gap-3 shrink-0 md:min-w-[200px] border-t md:border-t-0 md:border-l border-[#E6EAE6] pt-3 md:pt-0 md:pl-5'
            : 'pt-3 border-t border-[#E6EAE6] flex flex-col gap-3'
        }
      >
        <div className="flex items-center justify-between gap-3 w-full">
          <span className="inline-flex items-center gap-1 text-xs text-[#78847D] truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-[#42A875]" aria-hidden="true" />
            <span className="truncate">{item.locality}</span>
          </span>
          <span className="font-mono-num text-xs font-semibold text-[#202820] whitespace-nowrap">
            {item.feeOrSalary}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 w-full">
          <span className="text-xs text-[#78847D] tabular-nums">Updated {updatedLabel}</span>
          <div className="flex items-center gap-2 shrink-0">
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(item.id)}
                aria-label={item.isSaved ? 'Remove from saved' : 'Save opportunity'}
                className={`p-2 rounded-lg border transition-colors ${
                  item.isSaved
                    ? 'bg-[#145C43]/10 border-[#145C43]/30 text-[#145C43]'
                    : 'bg-[#FFFFFF] border-[#E6EAE6] text-[#78847D] hover:text-[#202820] hover:border-[#78847D]/40'
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}
            <Link
              to={`/opportunity/${item.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#145C43] text-[#FFFFFF] text-xs font-semibold hover:bg-[#0F4934] transition-colors whitespace-nowrap shrink-0"
            >
              View Details
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
