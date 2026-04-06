export function PageLoadingSkeleton() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="h-8 w-32 bg-accent-beige/30 rounded animate-pulse mb-1" />
        <div className="h-4 w-64 bg-accent-beige/20 rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-accent-beige/20 rounded-xl animate-pulse" />
          <div className="w-40 h-10 bg-accent-beige/20 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent-beige/30 rounded-full animate-pulse" />
              <div className="flex-1 h-4 bg-accent-beige/20 rounded animate-pulse" />
              <div className="w-24 h-4 bg-accent-beige/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="w-20 h-20 relative">
        <img
          src="/Dog_Heart_Tail.png"
          alt="Loading"
          className="w-full h-full object-contain animate-pulse"
        />
      </div>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-primary-orange rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
        <div className="w-2 h-2 bg-primary-orange rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 bg-primary-orange rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  )
}
