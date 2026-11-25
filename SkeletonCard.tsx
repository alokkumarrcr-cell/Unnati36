export function SkeletonCard() {
  return (
    <div className="bg-[#FFFFFF] border border-[#E6EAE6] rounded-xl p-5 flex flex-col justify-between gap-4 animate-pulse">
      <div>
        <div className="h-3 w-32 bg-[#E6EAE6] rounded mb-3" />
        <div className="h-5 w-4/5 bg-[#E6EAE6] rounded mb-2" />
        <div className="h-3.5 w-1/2 bg-[#E6EAE6] rounded mb-3" />
        <div className="h-3 w-full bg-[#E6EAE6] rounded mb-1.5" />
        <div className="h-3 w-2/3 bg-[#E6EAE6] rounded" />
      </div>
      <div className="pt-3 border-t border-[#E6EAE6] flex items-center justify-between">
        <div className="h-3 w-24 bg-[#E6EAE6] rounded" />
        <div className="h-7 w-24 bg-[#E6EAE6] rounded-lg" />
      </div>
    </div>
  );
}
