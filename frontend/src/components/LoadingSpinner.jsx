function Skeleton({ className = '' }) {
  return <div className={'animate-pulse rounded-lg bg-ink-200/70 ' + className} aria-hidden="true" />
}

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-ink-200 border-t-oweru-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink-500">Inapakia…</p>
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-ink-200 border-t-oweru-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink-500">Inapakia…</p>
      </div>
    </div>
  )
}

export function ButtonLoader() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current opacity-70 border-t-transparent" aria-hidden="true" />
  )
}

export function SkeletonCard() {
  return (
    <div className="card-base overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  )
}

export function AdminGridSkeleton({ cards = 6, message = '' }) {
  return (
    <div className="py-6">
      {message && <p className="mb-6 text-sm font-semibold text-ink-500">{message}</p>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

export function SimplePageSkeleton({ message = '' }) {
  return (
    <div aria-busy="true">
      <Skeleton className="h-64 w-full rounded-none sm:h-80" />
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        {message && <p className="mb-6 text-sm font-semibold text-ink-500">{message}</p>}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="card-base space-y-4 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="card-base space-y-4 p-6">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}