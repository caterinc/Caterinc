import { prisma } from "@/lib/prisma";
import { HeroBanner } from "@/components/store/HeroBanner";
import { CollectionShowcase } from "@/components/store/CollectionShowcase";
import { Shield, Truck, RotateCcw, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Product, Category, ProductVariant } from "@prisma/client";

type ProductWithRelations = Product & {
  category: Category | null;
  variants: ProductVariant[];
};

interface PageSection {
  id: string;
  type: "hero" | "features-bar" | "collection" | "cta-banner";
  label: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

function buildDefaultSections(sm: Record<string, unknown>): PageSection[] {
  const vh = (sm.ve_hero || {}) as Record<string, unknown>;
  const vf = (sm.ve_features_bar || {}) as Record<string, unknown>;
  const vct = (sm.ve_cta || {}) as Record<string, unknown>;
  return [
    { id: "hero", type: "hero", label: "Banner Principal", enabled: true, settings: { overlayOpacity: 50, overlayColor: "#000000", buttonText: "Comprar Agora", ...vh } },
    { id: "feats", type: "features-bar", label: "Barra de Benefícios", enabled: true, settings: { bgColor: "#000000", iconColor: "#FFCD11", textColor: "#FFFFFF", ...vf } },
    { id: "cta", type: "cta-banner", label: "Banner CTA", enabled: true, settings: { heading: "Pronto para ir longe?", subtitle: "Descubra nossa coleção completa de calçados para cada terreno.", bgColor: "#FFCD11", textColor: "#000000", buttonText: "Ver Toda a Coleção", buttonUrl: "/produtos", ...vct } },
  ];
}

export default async function HomePage() {
  const settings = await prisma.siteSetting.findMany();

  const sm = Object.fromEntries(settings.map((s) => {
    try { return [s.key, JSON.parse(s.value)]; } catch { return [s.key, s.value]; }
  }));

  const pageSections: PageSection[] = Array.isArray(sm.ve_sections)
    ? (sm.ve_sections as PageSection[])
    : buildDefaultSections(sm);

  const enabledSections = pageSections.filter((s) => s.enabled !== false);

  // Collect what to fetch
  const needsBanners = enabledSections.some((s) => s.type === "hero");
  const collectionSections = enabledSections.filter((s) => s.type === "collection" && s.settings.categorySlug);
  const slugs = Array.from(new Set(collectionSections.map((s) => s.settings.categorySlug as string)));
  const maxProducts = collectionSections.length > 0
    ? Math.max(...collectionSections.map((s) => Number(s.settings.productCount) || 8))
    : 0;

  const [banners, categoryRows] = await Promise.all([
    needsBanners
      ? prisma.banner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } })
      : Promise.resolve([]),
    slugs.length > 0
      ? prisma.category.findMany({
          where: { slug: { in: slugs }, isActive: true },
          include: {
            products: {
              where: { isActive: true },
              include: { variants: true, category: true },
              orderBy: { order: "asc" },
              take: maxProducts,
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map<string, ProductWithRelations[]>();
  for (const cat of categoryRows) {
    productMap.set(cat.slug, cat.products as ProductWithRelations[]);
  }

  return (
    <>
      {enabledSections.map((section) => {
        const s = section.settings;

        if (section.type === "hero") {
          return (
            <HeroBanner
              key={section.id}
              sectionId={section.id}
              banners={banners}
              overlayOpacity={s.overlayOpacity !== undefined ? Number(s.overlayOpacity) : 50}
              overlayColor={(s.overlayColor as string) || "#000000"}
              buttonText={(s.buttonText as string) || "Comprar Agora"}
            />
          );
        }

        if (section.type === "features-bar") {
          const bgColor = (s.bgColor as string) || "#000000";
          const iconColor = (s.iconColor as string) || "#FFCD11";
          const textColor = (s.textColor as string) || "#FFFFFF";
          return (
            <div
              key={section.id}
              data-ve-section={section.id}
              data-ve-label="Barra de Benefícios"
              suppressHydrationWarning
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Truck,     text: "Frete Grátis", sub: "Acima de R$ 299" },
                  { icon: Shield,    text: "Garantia",     sub: "12 meses" },
                  { icon: RotateCcw, text: "Trocas",       sub: "Até 30 dias" },
                  { icon: Star,      text: "Qualidade",    sub: "Certificada" },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-3">
                    <f.icon className="w-8 h-8 flex-shrink-0" style={{ color: iconColor }} />
                    <div>
                      <p className="font-semibold text-sm">{f.text}</p>
                      <p className="text-xs opacity-60">{f.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (section.type === "collection") {
          const slug = s.categorySlug as string;
          const products = (productMap.get(slug) || []).slice(0, Number(s.productCount) || 8);
          return (
            <CollectionShowcase
              key={section.id}
              sectionId={section.id}
              title={(s.title as string) || "Coleção"}
              products={products}
              displayMode={((s.displayMode as string) || "carrossel") as "carrossel" | "grade"}
              desktopColumns={Number(s.desktopColumns) || 4}
              mobileColumns={Number(s.mobileColumns) || 2}
              viewMoreUrl={(s.viewMoreUrl as string) || (slug ? `/produtos?categoria=${slug}` : "/produtos")}
              viewMoreText={(s.viewMoreText as string) || "Ver Mais"}
            />
          );
        }

        if (section.type === "cta-banner") {
          const bgColor = (s.bgColor as string) || "#FFCD11";
          const textColor = (s.textColor as string) || "#000000";
          return (
            <section
              key={section.id}
              data-ve-section={section.id}
              data-ve-label="Banner CTA"
              suppressHydrationWarning
              style={{ backgroundColor: bgColor }}
            >
              <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: textColor }}>
                    {(s.heading as string) || "Pronto para ir longe?"}
                  </h2>
                  <p className="mt-2 text-lg opacity-80" style={{ color: textColor }}>
                    {(s.subtitle as string) || ""}
                  </p>
                </div>
                <Button variant="secondary" size="xl" asChild>
                  <Link href={(s.buttonUrl as string) || "/produtos"}>
                    {(s.buttonText as string) || "Ver Toda a Coleção"}
                  </Link>
                </Button>
              </div>
            </section>
          );
        }

        return null;
      })}
    </>
  );
}
