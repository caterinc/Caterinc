"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaViewContent({ productId, name, price }: { productId: string; name: string; price: number }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_ids: [productId],
        content_name: name,
        content_type: "product",
        value: price,
        currency: "BRL",
      });
    }
  }, [productId, name, price]);
  return null;
}

export function MetaAddToCart({ productId, name, price }: { productId: string; name: string; price: number }) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "AddToCart", {
        content_ids: [productId],
        content_name: name,
        content_type: "product",
        value: price,
        currency: "BRL",
      });
    }
  }, [productId, name, price]);
  return null;
}
