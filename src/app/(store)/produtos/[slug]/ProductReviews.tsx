"use client";

import { useState, FormEvent } from "react";
import { CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

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
  productId: string;
}

const PAGE_SIZE = 5;

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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
          style={{ fontSize: 28, color: s <= value ? "#FFCD11" : "#E5E7EB", lineHeight: 1 }}
        >
          ★
        </button>
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

function WriteReviewModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || rating === 0) return;
    setSubmitting(true);
    try {
      await fetch("/api/reviews/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, reviewerName, rating, comment }),
      });
    } catch {
      // ignore — feedback is shown regardless
    }
    setSubmitting(false);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-cat-black transition-colors">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-cat-black text-lg mb-1">Avaliação enviada!</h3>
            <p className="text-sm text-gray-500">Obrigado pelo seu feedback.</p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2.5 bg-cat-yellow text-cat-black font-bold rounded-xl text-sm"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-black text-cat-black text-lg">Escrever avaliação</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sua nota</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Seu nome</label>
              <input
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                required
                maxLength={100}
                placeholder="Como você quer aparecer"
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Comentário (opcional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Conte sua experiência com o produto"
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cat-yellow resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || rating === 0 || !reviewerName.trim()}
              className="w-full py-3 bg-cat-yellow text-cat-black font-bold rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ProductReviews({ reviews, productName, productId }: ProductReviewsProps) {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const pageReviews = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    document.getElementById("avaliacoes")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (reviews.length === 0) {
    return (
      <div id="avaliacoes" className="py-12 border-t">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <h2 className="text-2xl font-black text-cat-black">Avaliações</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 border-2 border-cat-black text-cat-black font-bold text-sm rounded-xl hover:bg-cat-black hover:text-white transition-colors"
          >
            Escrever avaliação
          </button>
        </div>
        <p className="text-gray-500 text-sm">Este produto ainda não tem avaliações.</p>
        {showForm && <WriteReviewModal productId={productId} onClose={() => setShowForm(false)} />}
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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h2 className="text-2xl font-black text-cat-black">Avaliações de clientes</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 border-2 border-cat-black text-cat-black font-bold text-sm rounded-xl hover:bg-cat-black hover:text-white transition-colors"
        >
          Escrever avaliação
        </button>
      </div>

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
        {pageReviews.map((review) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg border disabled:opacity-40 hover:border-cat-black transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                p === page ? "bg-cat-black text-white" : "border hover:border-cat-black text-gray-700"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-lg border disabled:opacity-40 hover:border-cat-black transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && <WriteReviewModal productId={productId} onClose={() => setShowForm(false)} />}
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
