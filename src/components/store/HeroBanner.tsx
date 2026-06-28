"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/types";

interface HeroBannerProps {
  banners: Banner[];
  overlayOpacity?: number;  // 0–100, default 50
  overlayColor?: string;    // hex color, default #000000
  buttonText?: string;
  sectionId?: string;
}

export function HeroBanner({
  banners,
  overlayOpacity = 50,
  overlayColor = "#000000",
  buttonText = "Comprar Agora",
  sectionId = "hero",
}: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const activeBanners = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => setCurrent((p) => (p + 1) % activeBanners.length), 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <div
        data-ve-section="hero-banner"
        data-ve-label="Banner Principal"
        className="relative bg-cat-black h-[480px] md:h-[600px] flex items-center justify-center"
      >
        <div className="text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase">Built for the Tough</h1>
          <p className="text-gray-300 text-lg mb-8">Calçados que resistem a tudo.</p>
          <Button size="xl" asChild>
            <Link href="/produtos">Ver Produtos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const banner = activeBanners[current];

  return (
    <div
      data-ve-section={sectionId}
      data-ve-label="Banner Principal"
      suppressHydrationWarning
      className="relative bg-cat-black h-[480px] md:h-[600px] overflow-hidden"
    >
      {/* Background image — no children, z below overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${banner.image})` }}
      />

      {/* Configurable overlay — separate from content so text stays fully visible */}
      <div
        data-ve-overlay
        className="absolute inset-0"
        style={{ backgroundColor: overlayColor, opacity: overlayOpacity / 100 }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight mb-4">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="text-gray-300 text-lg mb-8">{banner.subtitle}</p>
            )}
            {banner.link && (
              <Button size="xl" asChild>
                <Link href={banner.link}>{buttonText}</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Carousel controls */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((current - 1 + activeBanners.length) % activeBanners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-cat-yellow hover:text-cat-black text-white p-2 rounded-full transition-colors z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setCurrent((current + 1) % activeBanners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-cat-yellow hover:text-cat-black text-white p-2 rounded-full transition-colors z-20"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {activeBanners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "bg-cat-yellow w-8" : "bg-white/50 w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
