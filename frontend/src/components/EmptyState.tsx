import type { ReactNode } from 'react'

export default function EmptyState({
  title = 'Nothing on the board yet',
  message = 'Be the first to pin something up. Offer what you know, ask for what you need.',
  action,
}: {
  title?: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="border border-dashed border-[#d7c8ab] bg-[#fbf8f2]/80 p-8 text-center text-[#302c25]">
      <p className="m-0 font-serif text-[20px] font-normal tracking-[-.02em]">{title}</p>
      <p className="mx-auto mt-3 mb-0 max-w-[42ch] text-[13px] leading-relaxed text-[#6d6860]">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
