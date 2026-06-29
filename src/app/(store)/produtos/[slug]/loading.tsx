export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />

          {/* Info skeleton */}
          <div className="space-y-4 py-2">
            <div className="h-7 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-5 w-1/2 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-1/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-px bg-gray-100 my-4" />
            <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="flex gap-2 flex-wrap">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="h-10 w-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-14 w-full bg-gray-100 rounded-xl animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
