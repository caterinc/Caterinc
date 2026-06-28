import { CheckCircle } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  createdAt: Date;
}

interface ProductReviewsProps {
  reviews: Review[];
  productName: string;
}

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          style={{ fontSize: size, color: s <= value ? "#FFCD11" : "#E5E7EB", lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ProductReviews({ reviews, productName }: ProductReviewsProps) {
  if (reviews.length === 0) {
    return (
      <div id="avaliacoes" className="py-12 border-t">
        <h2 className="text-2xl font-black text-cat-black mb-2">Avaliações</h2>
        <p className="text-gray-500 text-sm">Este produto ainda não tem avaliações.</p>
      </div>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const countByStar = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <div id="avaliacoes" className="vep-reviews-section py-12 border-t" style={{ backgroundColor: "var(--vep-reviews-bg, transparent)" }}>
      <h2 className="text-2xl font-black text-cat-black mb-8">
        Avaliações de clientes
      </h2>

      {/* Summary */}
      <div className="flex flex-col sm:flex-row gap-8 mb-10 p-6 bg-gray-50 rounded-2xl">
        {/* Big number */}
        <div className="flex flex-col items-center justify-center text-center flex-shrink-0">
          <span className="text-6xl font-black text-cat-black">{avg.toFixed(1)}</span>
          <Stars value={Math.round(avg)} size={20} />
          <p className="text-sm text-gray-500 mt-1">{reviews.length} avaliação{reviews.length !== 1 ? "ões" : ""}</p>
        </div>
        {/* Distribution bars */}
        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {countByStar.map(({ star, count }) => {
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-4 text-gray-600">{star}</span>
                <span style={{ color: "#FFCD11", fontSize: 14 }}>★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-cat-yellow h-2.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-xl p-5 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-cat-black">{review.reviewerName}</span>
                  {review.verifiedPurchase && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Compra verificada
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Stars value={review.rating} size={14} />
                  <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>
            {review.comment && (
              <p className="mt-3 text-gray-700 text-sm leading-relaxed">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewsSummaryBadge({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <a href="#avaliacoes" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
      <Stars value={Math.round(avg)} size={14} />
      <span className="text-sm text-gray-500">
        {avg.toFixed(1)} ({reviews.length})
      </span>
    </a>
  );
}
