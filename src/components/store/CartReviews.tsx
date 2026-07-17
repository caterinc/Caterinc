"use client";

import { useCart } from "@/lib/cart-context";
import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
}

interface ProductReviewData {
  productId: string;
  productName: string;
  reviews: Review[];
}

function Stars({ value }: { value: number }) {
  return (
    <span style={{ color: "#FFCD11", fontSize: 13, letterSpacing: 1 }}>
      {"★".repeat(value)}
      <span style={{ color: "#E5E7EB" }}>{"★".repeat(5 - value)}</span>
    </span>
  );
}

export function CartReviews() {
  const { state } = useCart();
  const [data, setData] = useState<ProductReviewData[]>([]);

  useEffect(() => {
    const uniqueItems = state.items.filter(
      (item, idx, arr) => arr.findIndex((i) => i.productId === item.productId) === idx
    );
    if (uniqueItems.length === 0) { setData([]); return; }

    Promise.all(
      uniqueItems.map(async (item) => {
        try {
          const r = await fetch(`/api/reviews?productId=${item.productId}`);
          const reviews: Review[] = r.ok ? await r.json() : [];
          return { productId: item.productId, productName: item.name, reviews: reviews.slice(0, 4) };
        } catch {
          return { productId: item.productId, productName: item.name, reviews: [] };
        }
      })
    ).then((results) => setData(results.filter((r) => r.reviews.length > 0)));
  }, [state.items]);

  if (data.length === 0) return null;

  return (
    <div className="mt-8 space-y-6">
      {data.map(({ productId, productName, reviews }) => {
        const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
        return (
          <div key={productId}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-black text-sm text-gray-900 line-clamp-1 flex-1">{productName}</h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Stars value={Math.round(avg)} />
                <span className="text-xs text-gray-500">{avg.toFixed(1)}</span>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-56 bg-white rounded-2xl border p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-800 truncate">{review.reviewerName}</span>
                    {review.verifiedPurchase && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <Stars value={review.rating} />
                  {review.comment && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
