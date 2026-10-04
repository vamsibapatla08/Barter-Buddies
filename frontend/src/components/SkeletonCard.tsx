export default function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col gap-3 border border-[#d7c8ab] border-t-[3px] border-t-[#d4c6ac] bg-[#fbf8f2] p-5"
    >
      <div className="flex items-start gap-3">
        <span className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#e6d9bd]" />
        <div className="flex-1 space-y-2">
          <span className="block h-[10px] w-1/2 animate-pulse bg-[#e6d9bd]" />
          <span className="block h-[14px] w-20 animate-pulse bg-[#eee4cf]" />
        </div>
      </div>
      <span className="block h-[18px] w-4/5 animate-pulse bg-[#e6d9bd]" />
      <span className="block h-[12px] w-full animate-pulse bg-[#eee4cf]" />
      <span className="block h-[12px] w-2/3 animate-pulse bg-[#eee4cf]" />
      <div className="mt-auto border-t border-[#d8d0c4] pt-3">
        <span className="block h-[12px] w-1/2 animate-pulse bg-[#eee4cf]" />
      </div>
    </div>
  )
}
