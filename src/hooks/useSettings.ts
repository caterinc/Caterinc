"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/types";

const defaultSettings: SiteSettings = {
  primaryColor: "#FFCD11",
  secondaryColor: "#000000",
  accentColor: "#333333",
  storeName: "CAT Store",
  storeDescription: "Calçados robustos e duráveis para quem não para.",
  logo: "/uploads/logo.svg",
  favicon: "/favicon.ico",
  phone: "(11) 3000-0000",
  email: "contato@catstore.com.br",
  address: "Av. Paulista, 1000 - São Paulo, SP",
  shippingFee: "29.90",
  freeShippingThreshold: "299.00",
  socialLinks: {},
};

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({ ...defaultSettings, ...data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
