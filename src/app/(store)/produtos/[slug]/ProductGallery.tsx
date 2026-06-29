"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

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
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
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

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchEnd.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStart.current === null || touchEnd.current === null) return;
    const delta = touchStart.current - touchEnd.current;
    if (Math.abs(delta) > 40) delta > 0 ? next() : prev();
    touchStart.current = null;
    touchEnd.current = null;
  };

  const src = allImages[activeIndex] || "/placeholder-product.jpg";

  return (
    <div className="space-y-3 lg:sticky lg:top-24 min-w-0 overflow-hidden">
      {/* Main image — swipeable, white bg */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-white border select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
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
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full pointer-events-none">
            {activeIndex + 1}/{total}
          </div>
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
