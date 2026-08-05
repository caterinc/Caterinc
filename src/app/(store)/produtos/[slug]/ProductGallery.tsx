"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  discountPct: number;
  activeIndex: number;
  onIndexChange: (i: number) => void;
}

export function ProductGallery({
  images, productName, discountPct, activeIndex, onIndexChange,
}: ProductGalleryProps) {
  const allImages = images.length > 0 ? images : ["/placeholder-product.jpg"];
  const total = allImages.length;
  const thumbsRef = useRef<HTMLDivElement>(null);
  const slideDir = useRef<"left" | "right">("left");

  const prev = () => { slideDir.current = "right"; onIndexChange((activeIndex - 1 + total) % total); };
  const next = () => { slideDir.current = "left";  onIndexChange((activeIndex + 1) % total); };
  const goTo = (i: number) => { slideDir.current = i >= activeIndex ? "left" : "right"; onIndexChange(i); };

  // Scroll active thumbnail into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const el = container.children[activeIndex] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  const src = allImages[activeIndex] || "/placeholder-product.jpg";

  return (
    <div className="space-y-3 lg:sticky lg:top-24 min-w-0 overflow-hidden w-full" style={{ contain: "layout" }}>
      {/* Main image — tap the arrows to change photo (no drag gesture: that
          conflicted with Android's own swipe/overscroll navigation and was
          visually kicking the whole page off-screen) */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border select-none">
        <Image
          key={src}
          src={src}
          alt={`${productName} - foto ${activeIndex + 1}`}
          fill
          className={`object-contain ${slideDir.current === "left" ? "slide-from-right" : "slide-from-left"}`}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {discountPct > 0 && (
          <div
            className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full z-10"
            style={{ backgroundColor: "var(--vep-badge-bg, #EF4444)", color: "var(--vep-badge-text, #FFFFFF)" }}
          >
            -{discountPct}% OFF
          </div>
        )}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border shadow-sm flex items-center justify-center text-gray-700 hover:bg-white z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima foto"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border shadow-sm flex items-center justify-center text-gray-700 hover:bg-white z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
              {activeIndex + 1}/{total}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails — horizontal scrollable carousel */}
      {total > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-white ${
                i === activeIndex
                  ? "border-cat-black ring-1 ring-cat-black"
                  : "border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${productName} ${i + 1}`} fill className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
