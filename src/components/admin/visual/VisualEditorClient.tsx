"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import {
  Monitor, Smartphone, RefreshCw, ChevronLeft, ChevronRight as ChevronR,
  Plus, Trash2, Eye, EyeOff, Upload, Save, ExternalLink,
  Home, Package, Settings, Image as ImageIcon, GripVertical,
  AlignJustify, Zap, Star, FolderOpen, LayoutTemplate, Megaphone,
  ShoppingBag, Link2, Shirt, CreditCard, Copy,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Banner { id: string; title: string; subtitle: string | null; image: string; link: string | null; order: number; isActive: boolean; }
interface MenuItem { id?: string; label: string; url: string; order: number; }
interface Category { id: string; name: string; slug: string; image: string | null; order: number; }

export type PageSectionType = "hero" | "features-bar" | "collection" | "cta-banner";

export interface PageSection {
  id: string;
  type: PageSectionType;
  label: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface VisualEditorClientProps {
  initialBanners: Banner[];
  initialHeaderItems: MenuItem[];
  initialFooterItems: MenuItem[];
  initialSettings: Record<string, unknown>;
  initialCategories: Category[];
  initialPageSections: PageSection[];
}

// Store pages
const STORE_PAGES = [
  { path: "/",          label: "Início",   icon: Home },
  { path: "/produtos",  label: "Produtos", icon: Package },
  { path: "/carrinho",  label: "Carrinho", icon: ShoppingBag },
  { path: "/checkout",  label: "Checkout", icon: CreditCard },
  { path: "/conta",     label: "Conta",    icon: Settings },
];

const SECTION_TYPE_META: Record<PageSectionType, { label: string; icon: typeof Home }> = {
  "hero":         { label: "Banner Principal",    icon: ImageIcon },
  "features-bar": { label: "Barra de Benefícios", icon: Star },
  "collection":   { label: "Vitrine de Coleção",  icon: FolderOpen },
  "cta-banner":   { label: "Banner CTA",          icon: Zap },
};

const FIXED_SECTION_KEYS: Record<string, string> = {
  announcement:  "ve_announcement",
  header:        "ve_header",
  footer:        "ve_footer",
  product_page:  "ve_product_page",
  cart:          "ve_cart",
  checkout:      "ve_checkout",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getS<T>(settings: Record<string, unknown>, key: string, def: T): T {
  const v = settings[key];
  if (!v) return def;
  if (typeof v === "object") return v as T;
  return def;
}

function buildPreviewCSS(
  fixed: Record<string, Record<string, unknown>>,
  sections: PageSection[]
): string {
  const css: string[] = [];
  const c = (v: unknown) => (typeof v === "string" && v ? v : null);

  // Fixed sections
  const h = fixed.header || {};
  if (c(h.bgColor)) css.push(`[data-ve-section="header"]{background-color:${h.bgColor}!important}`);
  if (c(h.linkColor)) css.push(`[data-ve-section="header"] a,[data-ve-section="header"] button{color:${h.linkColor}!important}`);

  const a = fixed.announcement || {};
  if (c(a.bgColor)) css.push(`[data-ve-section="announcement"]{background-color:${a.bgColor}!important}`);
  if (c(a.textColor)) css.push(`[data-ve-section="announcement"]{color:${a.textColor}!important}`);

  const ft = fixed.footer || {};
  if (c(ft.bgColor)) css.push(`[data-ve-section="footer"]{background-color:${ft.bgColor}!important}`);
  if (c(ft.textColor)) css.push(`[data-ve-section="footer"]{color:${ft.textColor}!important}`);

  const pp = fixed.product_page || {};
  const ppVars: string[] = [];
  if (c(pp.pageBgColor))  ppVars.push(`--vep-page-bg:${pp.pageBgColor}`);
  if (c(pp.cartBg))       ppVars.push(`--vep-cart-bg:${pp.cartBg}`);
  if (c(pp.cartText))     ppVars.push(`--vep-cart-text:${pp.cartText}`);
  if (c(pp.buyNowBg))     ppVars.push(`--vep-buynow-bg:${pp.buyNowBg}`);
  if (c(pp.buyNowText))   ppVars.push(`--vep-buynow-text:${pp.buyNowText}`);
  if (c(pp.priceColor))   ppVars.push(`--vep-price-color:${pp.priceColor}`);
  if (c(pp.shippingBg))   ppVars.push(`--vep-shipping-bg:${pp.shippingBg}`);
  if (c(pp.reviewsBg))    ppVars.push(`--vep-reviews-bg:${pp.reviewsBg}`);
  if (ppVars.length) css.push(`[data-ve-page="produto"]{${ppVars.join(";")}}`);
  if (c(pp.pageBgColor))  css.push(`[data-ve-page="produto"]{background-color:${pp.pageBgColor}!important}`);
  // Badge applies globally (product cards + product page)
  if (c(pp.badgeBg))      css.push(`:root{--vep-badge-bg:${pp.badgeBg}}`);
  if (c(pp.badgeText))    css.push(`:root{--vep-badge-text:${pp.badgeText}}`);
  if (c(pp.badgeBg))      ppVars.push(`--vep-badge-bg:${pp.badgeBg}`);
  if (c(pp.badgeText))    ppVars.push(`--vep-badge-text:${pp.badgeText}`);

  // Cart drawer + cart page + quick-add CSS vars (global)
  const ct = fixed.cart || {};
  const cartVars: string[] = [];
  if (c(ct.headerBg))        cartVars.push(`--vep-drawer-header-bg:${ct.headerBg}`);
  if (c(ct.headerText))      cartVars.push(`--vep-drawer-header-text:${ct.headerText}`);
  if (c(ct.btnBg))           cartVars.push(`--vep-drawer-btn-bg:${ct.btnBg}`);
  if (c(ct.btnText))         cartVars.push(`--vep-drawer-btn-text:${ct.btnText}`);
  if (c(ct.drawerBg))        cartVars.push(`--vep-drawer-bg:${ct.drawerBg}`);
  if (c(ct.quickaddBg))      cartVars.push(`--vep-quickadd-bg:${ct.quickaddBg}`);
  if (c(ct.quickaddText))    cartVars.push(`--vep-quickadd-text:${ct.quickaddText}`);
  if (c(ct.quickaddRing))    cartVars.push(`--vep-quickadd-ring:${ct.quickaddRing}`);
  if (c(ct.cartPageBtnBg))   cartVars.push(`--vep-cart-page-btn-bg:${ct.cartPageBtnBg}`);
  if (c(ct.cartPageBtnText)) cartVars.push(`--vep-cart-page-btn-text:${ct.cartPageBtnText}`);
  if (cartVars.length)  css.push(`:root{${cartVars.join(";")}}`)

  // Checkout CSS vars (global — also read by (checkout)/layout.tsx on the server)
  const ck = fixed.checkout || {};
  const ckVars: string[] = [];
  if (c(ck.stepActiveBg))    ckVars.push(`--vep-checkout-step-active-bg:${ck.stepActiveBg}`);
  if (c(ck.stepActiveText))  ckVars.push(`--vep-checkout-step-active-text:${ck.stepActiveText}`);
  if (c(ck.stepDoneBg))      ckVars.push(`--vep-checkout-step-done-bg:${ck.stepDoneBg}`);
  if (c(ck.continueBg))      ckVars.push(`--vep-checkout-continue-bg:${ck.continueBg}`);
  if (c(ck.continueText))    ckVars.push(`--vep-checkout-continue-text:${ck.continueText}`);
  if (c(ck.ctaBg))           ckVars.push(`--vep-checkout-cta-bg:${ck.ctaBg}`);
  if (c(ck.ctaText))         ckVars.push(`--vep-checkout-cta-text:${ck.ctaText}`);
  if (c(ck.headerBg))        ckVars.push(`--vep-checkout-header-bg:${ck.headerBg}`);
  if (c(ck.pageBg))          ckVars.push(`--vep-checkout-page-bg:${ck.pageBg}`);
  if (ckVars.length) css.push(`:root{${ckVars.join(";")}}`)

  // Dynamic sections
  for (const sec of sections) {
    if (!sec.enabled) continue;
    const s = sec.settings;
    const id = sec.id;

    if (sec.type === "hero") {
      const op = s.overlayOpacity !== undefined ? Number(s.overlayOpacity) : 50;
      const col = c(s.overlayColor) || "#000000";
      css.push(`[data-ve-section="${id}"] [data-ve-overlay]{background-color:${col}!important;opacity:${op / 100}!important}`);
    }
    if (sec.type === "features-bar") {
      if (c(s.bgColor)) css.push(`[data-ve-section="${id}"]{background-color:${s.bgColor}!important}`);
      if (c(s.textColor)) css.push(`[data-ve-section="${id}"] p{color:${s.textColor}!important}`);
      if (c(s.iconColor)) css.push(`[data-ve-section="${id}"] svg{color:${s.iconColor}!important}`);
    }
    if (sec.type === "cta-banner") {
      if (c(s.bgColor)) css.push(`[data-ve-section="${id}"]{background-color:${s.bgColor}!important}`);
      if (c(s.textColor)) css.push(`[data-ve-section="${id}"] h2,[data-ve-section="${id}"] p{color:${s.textColor}!important}`);
    }
    if (sec.type === "collection") {
      const collVars: string[] = [];
      if (c(s.bgColor)) css.push(`[data-ve-section="${id}"]{background-color:${s.bgColor}!important}`);
      if (c(s.quickaddBg))    collVars.push(`--vep-quickadd-bg:${s.quickaddBg}`);
      if (c(s.quickaddText))  collVars.push(`--vep-quickadd-text:${s.quickaddText}`);
      if (c(s.quickaddRing))  collVars.push(`--vep-quickadd-ring:${s.quickaddRing}`);
      if (collVars.length) css.push(`[data-ve-section="${id}"]{${collVars.join(";")}}`)
    }
  }

  return css.join("\n");
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const cls = "w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white";
  return multiline
    ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls} />
    : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />;
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border-2 border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1.5 border rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cat-yellow"
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}

function SliderInput({ value, onChange, min = 0, max = 100, unit = "%" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-cat-yellow"
      />
      <span className="text-xs font-mono w-12 text-right">{value}{unit}</span>
    </div>
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ImageUpload({ value, onChange }: {
  value: string; onChange: (v: string) => void; onUpload?: (f: File) => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande. Use uma imagem menor que 2MB.");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="URL da imagem"
          className="flex-1 px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
        />
        <button
          type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="px-2.5 py-1.5 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
          title="Upload"
        >
          <Upload className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      {uploading && <p className="text-xs text-gray-400">Enviando...</p>}
      {value && (
        <div className="h-16 rounded overflow-hidden border bg-gray-100">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function SaveBtn({ saving, onClick, label = "Salvar" }: { saving: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className="w-full py-2.5 bg-cat-black text-white text-xs font-bold rounded hover:bg-gray-800 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors mt-4"
    >
      <Save className="w-3.5 h-3.5" />
      {saving ? "Salvando..." : label}
    </button>
  );
}

// ─── Section editors ──────────────────────────────────────────────────────────

function AnnouncementEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, string>; onChange: (k: string, v: string) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label="Texto">
        <TextInput value={settings.text || ""} onChange={(v) => onChange("text", v)} placeholder="Frete grátis acima de R$ 299..." />
      </Field>
      <Field label="Cor de Fundo">
        <ColorInput value={settings.bgColor || "#FFCD11"} onChange={(v) => onChange("bgColor", v)} />
      </Field>
      <Field label="Cor do Texto">
        <ColorInput value={settings.textColor || "#000000"} onChange={(v) => onChange("textColor", v)} />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function HeaderEditor({ settings, onChange, onSave, saving, onUpload, headerItems, onHeaderItemsChange, onMenuSave }: {
  settings: Record<string, string>;
  onChange: (k: string, v: string | number) => void;
  onSave: () => void;
  saving: boolean;
  onUpload: (f: File) => Promise<string>;
  headerItems: MenuItem[];
  onHeaderItemsChange: (items: MenuItem[]) => void;
  onMenuSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Logo (imagem)">
        <ImageUpload value={settings.logoImage || ""} onChange={(v) => onChange("logoImage", v)} onUpload={onUpload} />
      </Field>
      <Field label={`Altura logo Desktop: ${settings.logoDesktopHeight || 40}px`}>
        <SliderInput
          value={Number(settings.logoDesktopHeight) || 40}
          onChange={(v) => onChange("logoDesktopHeight", v)}
          min={20} max={100} unit="px"
        />
      </Field>
      <Field label={`Altura logo Mobile: ${settings.logoMobileHeight || 32}px`}>
        <SliderInput
          value={Number(settings.logoMobileHeight) || 32}
          onChange={(v) => onChange("logoMobileHeight", v)}
          min={16} max={80} unit="px"
        />
      </Field>
      <Field label="Cor de Fundo">
        <ColorInput value={settings.bgColor || "#000000"} onChange={(v) => onChange("bgColor", v)} />
      </Field>
      <Field label="Cor dos Ícones/Links">
        <ColorInput value={settings.linkColor || "#9CA3AF"} onChange={(v) => onChange("linkColor", v)} />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} label="Salvar Cabeçalho" />

      <div className="border-t pt-3 mt-4">
        <p className="text-xs font-bold text-gray-700 mb-2">Itens do Menu</p>
        {headerItems.map((item, i) => (
          <div key={i} className="border rounded p-2 mb-1.5 space-y-1 bg-gray-50">
            <input
              type="text" value={item.label} placeholder="Rótulo"
              onChange={(e) => onHeaderItemsChange(headerItems.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
              className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
            />
            <div className="flex gap-1">
              <input
                type="text" value={item.url} placeholder="/url"
                onChange={(e) => onHeaderItemsChange(headerItems.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))}
                className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
              />
              <button onClick={() => onHeaderItemsChange(headerItems.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={() => onHeaderItemsChange([...headerItems, { label: "", url: "", order: headerItems.length }])}
            className="flex-1 py-1.5 border-2 border-dashed rounded text-xs text-gray-500 hover:border-cat-yellow hover:text-cat-black flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
          <button onClick={onMenuSave} className="flex-1 py-1.5 bg-cat-black text-white text-xs font-bold rounded hover:bg-gray-800 flex items-center justify-center gap-1">
            <Save className="w-3 h-3" /> Salvar Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroBannerEditor({ settings, onChange, onSave, saving, banners, onToggle, onBannerSave, onBannerDelete, onUpload }: {
  settings: Record<string, unknown>;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  saving: boolean;
  banners: Banner[];
  onToggle: (b: Banner) => void;
  onBannerSave: (data: Partial<Banner> & { id?: string }) => Promise<void>;
  onBannerDelete: (id: string) => void;
  onUpload: (f: File) => Promise<string>;
}) {
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const opacity = settings.overlayOpacity !== undefined ? Number(settings.overlayOpacity) : 50;

  return (
    <div className="space-y-3">
      <Field label={`Opacidade do Overlay: ${opacity}%`}>
        <SliderInput value={opacity} onChange={(v) => onChange("overlayOpacity", v)} />
      </Field>
      <Field label="Cor do Overlay">
        <ColorInput value={(settings.overlayColor as string) || "#000000"} onChange={(v) => onChange("overlayColor", v)} />
      </Field>
      <Field label="Texto do Botão CTA">
        <TextInput value={(settings.buttonText as string) || "Comprar Agora"} onChange={(v) => onChange("buttonText", v)} />
      </Field>
      <SaveBtn saving={saving} onClick={onSave} label="Salvar Configurações" />

      <div className="border-t pt-3">
        <p className="text-xs font-bold text-gray-700 mb-2">Banners ({banners.filter(b => b.isActive).length} ativos)</p>
        {banners.map((b) => (
          <div key={b.id} className={`border rounded-lg overflow-hidden mb-1.5 ${!b.isActive ? "opacity-50" : ""}`}>
            {b.image && <div className="h-12 bg-gray-100"><img src={b.image} alt={b.title} className="w-full h-full object-cover" /></div>}
            <div className="p-2 flex items-center gap-1">
              <p className="flex-1 text-xs font-medium truncate">{b.title || "(sem título)"}</p>
              <button onClick={() => onToggle(b)} className={`p-1 rounded ${b.isActive ? "text-green-500" : "text-gray-400"}`}>
                {b.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setEditing({ ...b })} className="p-1 text-xs text-gray-400 hover:text-blue-500">✏️</button>
              <button onClick={() => { if (confirm("Excluir?")) onBannerDelete(b.id); }} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {editing && (
          <div className="border-2 border-cat-yellow rounded-lg p-3 space-y-2 bg-yellow-50 mt-2">
            <p className="text-xs font-bold">{editing.id ? "✏️ Editar" : "➕ Novo"} Banner</p>
            {(["title", "subtitle", "link"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs text-gray-600">{field === "title" ? "Título" : field === "subtitle" ? "Subtítulo" : "Link"}</label>
                <input
                  type="text" value={(editing[field] as string) || ""} placeholder={field === "link" ? "/produtos" : ""}
                  onChange={(e) => setEditing((p) => (p ? { ...p, [field]: e.target.value } : p))}
                  className="w-full mt-0.5 px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-600">Imagem</label>
              <ImageUpload
                value={editing.image || ""} onUpload={onUpload}
                onChange={(v) => setEditing((p) => (p ? { ...p, image: v } : p))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={async () => { await onBannerSave(editing); setEditing(null); }} className="flex-1 py-2 bg-cat-black text-white text-xs font-bold rounded hover:bg-gray-800 flex items-center justify-center gap-1">
                <Save className="w-3 h-3" /> Salvar
              </button>
              <button onClick={() => setEditing(null)} className="px-3 py-2 border rounded text-xs hover:bg-gray-100">Cancelar</button>
            </div>
          </div>
        )}
        {!editing && (
          <button
            onClick={() => setEditing({ title: "", subtitle: "", image: "", link: "", isActive: true, order: banners.length })}
            className="w-full py-2.5 border-2 border-dashed rounded-lg text-xs text-gray-500 hover:border-cat-yellow hover:text-cat-black flex items-center justify-center gap-1 transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Banner
          </button>
        )}
      </div>
    </div>
  );
}

function FeaturesBarEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, unknown>; onChange: (k: string, v: unknown) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label="Cor de Fundo"><ColorInput value={(settings.bgColor as string) || "#000000"} onChange={(v) => onChange("bgColor", v)} /></Field>
      <Field label="Cor dos Ícones"><ColorInput value={(settings.iconColor as string) || "#FFCD11"} onChange={(v) => onChange("iconColor", v)} /></Field>
      <Field label="Cor do Texto"><ColorInput value={(settings.textColor as string) || "#FFFFFF"} onChange={(v) => onChange("textColor", v)} /></Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function CollectionEditor({ settings, onChange, onSave, saving, categories }: {
  settings: Record<string, unknown>;
  onChange: (k: string, v: unknown) => void;
  onSave: () => void;
  saving: boolean;
  categories: Category[];
}) {
  return (
    <div className="space-y-3">
      <Field label="Modo de Exibição">
        <div className="grid grid-cols-2 gap-2">
          {(["carrossel", "grade"] as const).map((mode) => {
            const active = (settings.displayMode as string || "carrossel") === mode;
            return (
              <button
                key={mode}
                onClick={() => onChange("displayMode", mode)}
                className={`py-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                  active ? "border-cat-yellow bg-yellow-50 text-cat-black" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {mode === "carrossel" ? "🛍️ Vitrine" : "⊞ Grade"}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {(settings.displayMode as string || "carrossel") === "carrossel"
            ? "Cards ricos com badge de desconto, preço parcelado e botão de carrinho"
            : "Grade simples no estilo catálogo"}
        </p>
      </Field>
      <Field label="Título da Vitrine">
        <TextInput value={(settings.title as string) || ""} onChange={(v) => onChange("title", v)} placeholder="Ex: Tênis" />
      </Field>
      <Field label="Coleção (categoria)">
        <SelectInput
          value={(settings.categorySlug as string) || ""}
          onChange={(v) => onChange("categorySlug", v)}
          options={[
            { value: "", label: "— Selecione —" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />
      </Field>
      <Field label="Produtos a mostrar">
        <SelectInput
          value={String(settings.productCount || "8")}
          onChange={(v) => onChange("productCount", Number(v))}
          options={[
            { value: "4", label: "4 produtos" },
            { value: "8", label: "8 produtos" },
            { value: "12", label: "12 produtos" },
            { value: "16", label: "16 produtos" },
          ]}
        />
      </Field>
      <Field label="Colunas Desktop">
        <SelectInput
          value={String(settings.desktopColumns || "4")}
          onChange={(v) => onChange("desktopColumns", Number(v))}
          options={[
            { value: "2", label: "2 colunas" },
            { value: "3", label: "3 colunas" },
            { value: "4", label: "4 colunas" },
            { value: "5", label: "5 colunas" },
          ]}
        />
      </Field>
      <Field label="Colunas Mobile">
        <SelectInput
          value={String(settings.mobileColumns || "2")}
          onChange={(v) => onChange("mobileColumns", Number(v))}
          options={[
            { value: "1", label: "1 coluna" },
            { value: "2", label: "2 colunas" },
            { value: "3", label: "3 colunas" },
          ]}
        />
      </Field>
      <Field label="Texto 'Ver mais'">
        <TextInput value={(settings.viewMoreText as string) || "Ver Mais"} onChange={(v) => onChange("viewMoreText", v)} />
      </Field>
      <Field label="URL 'Ver mais'">
        <TextInput value={(settings.viewMoreUrl as string) || "/produtos"} onChange={(v) => onChange("viewMoreUrl", v)} placeholder="/produtos?categoria=tenis" />
      </Field>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Botão Adicionar Rápido</p>
      <p className="text-xs text-gray-400">Botão circular nos cards desta vitrine (sobrescreve global)</p>
      <div className="space-y-3">
        <Field label="Cor de Fundo">
          <ColorInput value={(settings.quickaddBg as string) || "#16c789"} onChange={(v) => onChange("quickaddBg", v)} />
        </Field>
        <Field label="Cor do Ícone">
          <ColorInput value={(settings.quickaddText as string) || "#ffffff"} onChange={(v) => onChange("quickaddText", v)} />
        </Field>
        <Field label="Cor da Borda/Anel">
          <ColorInput value={(settings.quickaddRing as string) || "transparent"} onChange={(v) => onChange("quickaddRing", v)} />
        </Field>
      </div>

      <SaveBtn saving={saving} onClick={onSave} label="Salvar Vitrine" />
      {categories.length === 0 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          Nenhuma categoria encontrada. <a href="/admin/categorias" target="_blank" className="underline">Criar categorias</a>
        </p>
      )}
    </div>
  );
}

function CTAEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, unknown>; onChange: (k: string, v: unknown) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field label="Título"><TextInput value={(settings.heading as string) || "Pronto para ir longe?"} onChange={(v) => onChange("heading", v)} /></Field>
      <Field label="Subtítulo"><TextInput value={(settings.subtitle as string) || ""} onChange={(v) => onChange("subtitle", v)} multiline /></Field>
      <Field label="Cor de Fundo"><ColorInput value={(settings.bgColor as string) || "#FFCD11"} onChange={(v) => onChange("bgColor", v)} /></Field>
      <Field label="Cor do Texto"><ColorInput value={(settings.textColor as string) || "#000000"} onChange={(v) => onChange("textColor", v)} /></Field>
      <Field label="Texto do Botão"><TextInput value={(settings.buttonText as string) || "Ver Toda a Coleção"} onChange={(v) => onChange("buttonText", v)} /></Field>
      <Field label="URL do Botão"><TextInput value={(settings.buttonUrl as string) || "/produtos"} onChange={(v) => onChange("buttonUrl", v)} /></Field>
      <SaveBtn saving={saving} onClick={onSave} />
    </div>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-colors text-left ${
        value ? "border-cat-yellow bg-yellow-50 text-cat-black" : "border-gray-200 text-gray-400 bg-gray-50"
      }`}
    >
      <span className={`w-8 h-4 rounded-full transition-colors flex items-center flex-shrink-0 ${value ? "bg-cat-yellow" : "bg-gray-300"}`}>
        <span className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? "translate-x-4" : "translate-x-0"}`} />
      </span>
      {label}
    </button>
  );
}

function FooterEditor({ settings, onChange, onSave, saving, footerItems, onFooterItemsChange, onMenuSave }: {
  settings: Record<string, unknown>; onChange: (k: string, v: unknown) => void; onSave: () => void; saving: boolean;
  footerItems: MenuItem[]; onFooterItemsChange: (items: MenuItem[]) => void; onMenuSave: () => void;
}) {
  const b = (k: string, def = true) => settings[k] !== undefined ? settings[k] === true : def;

  return (
    <div className="space-y-3">
      {/* Style */}
      <Field label="Cor de Fundo"><ColorInput value={(settings.bgColor as string) || "#000000"} onChange={(v) => onChange("bgColor", v)} /></Field>
      <Field label="Cor do Texto"><ColorInput value={(settings.textColor as string) || "#9CA3AF"} onChange={(v) => onChange("textColor", v)} /></Field>

      {/* Description block */}
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <Toggle value={b("showDescription")} onChange={(v) => onChange("showDescription", v)} label="Mostrar bloco de descrição" />
        {b("showDescription") && (
          <Field label="Texto de descrição">
            <TextInput value={(settings.description as string) || ""} onChange={(v) => onChange("description", v)} multiline placeholder="Calçados robustos e duráveis..." />
          </Field>
        )}
      </div>

      {/* Social */}
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <Toggle value={b("showSocial")} onChange={(v) => onChange("showSocial", v)} label="Mostrar redes sociais" />
        {b("showSocial") && (
          <>
            <Field label="Instagram (URL)">
              <TextInput value={(settings.instagram as string) || ""} onChange={(v) => onChange("instagram", v)} placeholder="https://instagram.com/suamarca" />
            </Field>
            <Field label="Facebook (URL)">
              <TextInput value={(settings.facebook as string) || ""} onChange={(v) => onChange("facebook", v)} placeholder="https://facebook.com/suamarca" />
            </Field>
          </>
        )}
      </div>

      {/* Contact */}
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <Toggle value={b("showContact")} onChange={(v) => onChange("showContact", v)} label="Mostrar bloco de contato" />
        {b("showContact") && (
          <>
            <Field label="Telefone/WhatsApp">
              <TextInput value={(settings.phone as string) || ""} onChange={(v) => onChange("phone", v)} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="E-mail">
              <TextInput value={(settings.email as string) || ""} onChange={(v) => onChange("email", v)} placeholder="contato@loja.com" />
            </Field>
            <Field label="Endereço">
              <TextInput value={(settings.address as string) || ""} onChange={(v) => onChange("address", v)} multiline placeholder="Rua Exemplo, 123 — SP" />
            </Field>
          </>
        )}
      </div>

      {/* Menu links */}
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <Toggle value={b("showMenu")} onChange={(v) => onChange("showMenu", v)} label="Mostrar links do menu" />
        {b("showMenu") && (
          <>
            <Field label="Título da seção de links">
              <TextInput value={(settings.menuTitle as string) || "Informações"} onChange={(v) => onChange("menuTitle", v)} />
            </Field>
            {footerItems.map((item, i) => (
              <div key={i} className="border rounded-lg p-2 space-y-1 bg-white">
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-gray-400 font-semibold w-8 flex-shrink-0">Texto</span>
                  <input type="text" value={item.label} placeholder="Ex: Política de Privacidade"
                    onChange={(e) => onFooterItemsChange(footerItems.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))}
                    className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white"
                  />
                  <button onClick={() => onFooterItemsChange(footerItems.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-1 items-center">
                  <span className="text-xs text-gray-400 font-semibold w-8 flex-shrink-0">Link</span>
                  <input type="text" value={item.url} placeholder="/url-da-pagina"
                    onChange={(e) => onFooterItemsChange(footerItems.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x))}
                    className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-cat-yellow bg-white font-mono"
                  />
                </div>
              </div>
            ))}
            <button onClick={() => onFooterItemsChange([...footerItems, { label: "", url: "", order: footerItems.length }])}
              className="w-full py-2 border-2 border-dashed rounded-lg text-xs text-gray-500 hover:border-cat-yellow hover:text-cat-black flex items-center justify-center gap-1 bg-white">
              <Plus className="w-3 h-3" /> Adicionar link
            </button>
          </>
        )}
      </div>

      {/* Copyright */}
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <Toggle value={b("showCopyright")} onChange={(v) => onChange("showCopyright", v)} label="Mostrar barra de copyright" />
        {b("showCopyright") && (
          <Field label="Texto do copyright">
            <TextInput value={(settings.copyrightText as string) || ""} onChange={(v) => onChange("copyrightText", v)} placeholder="© 2025 Minha Loja. Todos os direitos reservados." />
          </Field>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <SaveBtn saving={saving} onClick={onSave} label="Salvar Rodapé" />
      </div>
      <button onClick={onMenuSave} className="w-full py-2 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-700 flex items-center justify-center gap-1.5 transition-colors">
        <Save className="w-3.5 h-3.5" /> Salvar Links do Menu
      </button>
    </div>
  );
}

function ProductPageEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, string>; onChange: (k: string, v: string) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Personalize as cores da página do produto. As mudanças aparecem em todos os produtos da loja.
      </p>
      <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Página</p>
        <Field label="Cor de Fundo">
          <ColorInput value={settings.pageBgColor || "#F5F5F5"} onChange={(v) => onChange("pageBgColor", v)} />
        </Field>
        <Field label="Cor do Preço">
          <ColorInput value={settings.priceColor || "#000000"} onChange={(v) => onChange("priceColor", v)} />
        </Field>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Badge de Desconto</p>
        <Field label="Fundo do Badge">
          <ColorInput value={settings.badgeBg || "#EF4444"} onChange={(v) => onChange("badgeBg", v)} />
        </Field>
        <Field label="Texto do Badge">
          <ColorInput value={settings.badgeText || "#FFFFFF"} onChange={(v) => onChange("badgeText", v)} />
        </Field>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Botão Adicionar ao Carrinho</p>
        <Field label="Cor de Fundo">
          <ColorInput value={settings.cartBg || "#FFCD11"} onChange={(v) => onChange("cartBg", v)} />
        </Field>
        <Field label="Cor do Texto">
          <ColorInput value={settings.cartText || "#000000"} onChange={(v) => onChange("cartText", v)} />
        </Field>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Botão Comprar Agora</p>
        <Field label="Cor de Fundo">
          <ColorInput value={settings.buyNowBg || "#000000"} onChange={(v) => onChange("buyNowBg", v)} />
        </Field>
        <Field label="Cor do Texto">
          <ColorInput value={settings.buyNowText || "#FFFFFF"} onChange={(v) => onChange("buyNowText", v)} />
        </Field>
      </div>
      <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Seções</p>
        <Field label="Fundo da Entrega">
          <ColorInput value={settings.shippingBg || "#F0FDF4"} onChange={(v) => onChange("shippingBg", v)} />
        </Field>
        <Field label="Fundo das Avaliações">
          <ColorInput value={settings.reviewsBg || "#F9FAFB"} onChange={(v) => onChange("reviewsBg", v)} />
        </Field>
      </div>
      <SaveBtn saving={saving} onClick={onSave} label="Salvar Página do Produto" />
    </div>
  );
}

function CartEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, string>; onChange: (k: string, v: string) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Personalize as cores do pop-up, da página do carrinho e do botão de adicionar rápido.
      </p>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pop-up do Carrinho</p>
      <div className="space-y-3">
        <Field label="Fundo do Cabeçalho">
          <ColorInput value={settings.headerBg || "#000000"} onChange={(v) => onChange("headerBg", v)} />
        </Field>
        <Field label="Texto do Cabeçalho">
          <ColorInput value={settings.headerText || "#ffffff"} onChange={(v) => onChange("headerText", v)} />
        </Field>
        <Field label="Fundo do Drawer">
          <ColorInput value={settings.drawerBg || "#ffffff"} onChange={(v) => onChange("drawerBg", v)} />
        </Field>
        <Field label="Botão Finalizar — Fundo">
          <ColorInput value={settings.btnBg || "#FFCD11"} onChange={(v) => onChange("btnBg", v)} />
        </Field>
        <Field label="Botão Finalizar — Texto">
          <ColorInput value={settings.btnText || "#000000"} onChange={(v) => onChange("btnText", v)} />
        </Field>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Página do Carrinho</p>
      <div className="space-y-3">
        <Field label="Botão Finalizar Pedido — Fundo">
          <ColorInput value={settings.cartPageBtnBg || "#FFCD11"} onChange={(v) => onChange("cartPageBtnBg", v)} />
        </Field>
        <Field label="Botão Finalizar Pedido — Texto">
          <ColorInput value={settings.cartPageBtnText || "#000000"} onChange={(v) => onChange("cartPageBtnText", v)} />
        </Field>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Botão Adicionar Rápido (Global)</p>
      <p className="text-xs text-gray-400">Padrão para todos os cards. A seção Vitrine pode sobrescrever.</p>
      <div className="space-y-3">
        <Field label="Fundo do Botão">
          <ColorInput value={settings.quickaddBg || "#16c789"} onChange={(v) => onChange("quickaddBg", v)} />
        </Field>
        <Field label="Cor do Ícone">
          <ColorInput value={settings.quickaddText || "#ffffff"} onChange={(v) => onChange("quickaddText", v)} />
        </Field>
        <Field label="Cor da Borda/Anel">
          <ColorInput value={settings.quickaddRing || "transparent"} onChange={(v) => onChange("quickaddRing", v)} />
        </Field>
      </div>

      <SaveBtn saving={saving} onClick={onSave} label="Salvar Carrinho" />
    </div>
  );
}

function CheckoutEditor({ settings, onChange, onSave, saving }: {
  settings: Record<string, string>; onChange: (k: string, v: string) => void; onSave: () => void; saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 leading-relaxed">
        Personalize as cores da página de checkout (passos, botões, fundo).
      </p>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Indicador de Passos</p>
      <div className="space-y-3">
        <Field label="Passo Ativo — Fundo">
          <ColorInput value={settings.stepActiveBg || "#16c789"} onChange={(v) => onChange("stepActiveBg", v)} />
        </Field>
        <Field label="Passo Ativo — Texto">
          <ColorInput value={settings.stepActiveText || "#000000"} onChange={(v) => onChange("stepActiveText", v)} />
        </Field>
        <Field label="Passo Concluído — Fundo">
          <ColorInput value={settings.stepDoneBg || "#16c789"} onChange={(v) => onChange("stepDoneBg", v)} />
        </Field>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Botão Continuar</p>
      <p className="text-xs text-gray-400">Botão preto "Continuar para..."</p>
      <div className="space-y-3">
        <Field label="Fundo">
          <ColorInput value={settings.continueBg || "#16c789"} onChange={(v) => onChange("continueBg", v)} />
        </Field>
        <Field label="Texto">
          <ColorInput value={settings.continueText || "#ffffff"} onChange={(v) => onChange("continueText", v)} />
        </Field>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Botão Finalizar Pedido</p>
      <p className="text-xs text-gray-400">Botão amarelo de pagamento final</p>
      <div className="space-y-3">
        <Field label="Fundo">
          <ColorInput value={settings.ctaBg || "#16c789"} onChange={(v) => onChange("ctaBg", v)} />
        </Field>
        <Field label="Texto">
          <ColorInput value={settings.ctaText || "#000000"} onChange={(v) => onChange("ctaText", v)} />
        </Field>
      </div>

      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-1">Layout</p>
      <div className="space-y-3">
        <Field label="Fundo do Header">
          <ColorInput value={settings.headerBg || "#ffffff"} onChange={(v) => onChange("headerBg", v)} />
        </Field>
        <Field label="Fundo da Página">
          <ColorInput value={settings.pageBg || "#F5F5F5"} onChange={(v) => onChange("pageBg", v)} />
        </Field>
      </div>

      <SaveBtn saving={saving} onClick={onSave} label="Salvar Checkout" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VisualEditorClient({
  initialBanners, initialHeaderItems, initialFooterItems,
  initialSettings, initialCategories, initialPageSections,
}: VisualEditorClientProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [currentPath, setCurrentPath] = useState("/");

  const [view, setView] = useState<"sections" | "editor">("sections");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  // Data
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [headerItems, setHeaderItems] = useState<MenuItem[]>(initialHeaderItems);
  const [footerItems, setFooterItems] = useState<MenuItem[]>(initialFooterItems);

  // Fixed settings: announcement, header, footer
  type FixedMap = Record<string, Record<string, unknown>>;
  const [fixedSettings, setFixedSettings] = useState<FixedMap>({
    announcement: getS(initialSettings, "ve_announcement", { text: "Frete grátis acima de R$ 299 | Entrega em todo o Brasil", bgColor: "#FFCD11", textColor: "#000000" }),
    header:       getS(initialSettings, "ve_header",       { logoImage: "", logoDesktopHeight: 40, logoMobileHeight: 32, bgColor: "#000000", linkColor: "#9CA3AF" }),
    footer:       getS(initialSettings, "ve_footer",       { bgColor: "#000000", textColor: "#9CA3AF", description: "" }),
    product_page: getS(initialSettings, "ve_product_page", { pageBgColor: "#F5F5F5", cartBg: "#FFCD11", cartText: "#000000", buyNowBg: "#000000", buyNowText: "#FFFFFF", priceColor: "#000000", badgeBg: "#EF4444", badgeText: "#FFFFFF", shippingBg: "#F0FDF4", reviewsBg: "#F9FAFB" }),
    cart:         getS(initialSettings, "ve_cart",         { headerBg: "#000000", headerText: "#ffffff", btnBg: "#FFCD11", btnText: "#000000", drawerBg: "#ffffff", quickaddBg: "#16c789", quickaddText: "#ffffff", cartPageBtnBg: "#FFCD11", cartPageBtnText: "#000000" }),
    checkout:     getS(initialSettings, "ve_checkout",     { stepActiveBg: "#16c789", stepActiveText: "#ffffff", stepDoneBg: "#16c789", continueBg: "#16c789", continueText: "#ffffff", ctaBg: "#16c789", ctaText: "#ffffff", headerBg: "#ffffff", pageBg: "#F5F5F5" }),
  });

  // Dynamic page sections
  const [pageSections, setPageSections] = useState<PageSection[]>(initialPageSections);

  // Drag-drop
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Save state
  const [savingFixed, setSavingFixed] = useState<string | null>(null);
  const [savingPages, setSavingPages] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── CSS injection ────────────────────────────────────────────────────────────

  const fixedRef = useRef(fixedSettings);
  const sectionsRef = useRef(pageSections);
  useEffect(() => { fixedRef.current = fixedSettings; }, [fixedSettings]);
  useEffect(() => { sectionsRef.current = pageSections; }, [pageSections]);

  const sendLiveCSS = useCallback((fixed: FixedMap, sections: PageSection[]) => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc?.head) return;
      let el = doc.getElementById("_ve_live") as HTMLStyleElement | null;
      if (!el) {
        el = doc.createElement("style") as HTMLStyleElement;
        el.id = "_ve_live";
        doc.head.appendChild(el);
      }
      el.textContent = buildPreviewCSS(fixed, sections);
    } catch {}
  }, []);

  useEffect(() => {
    sendLiveCSS(fixedSettings, pageSections);
  }, [fixedSettings, pageSections, sendLiveCSS]);

  // ── Editor button injection ──────────────────────────────────────────────────

  const injectEditor = useCallback(() => {
    try {
      const iframeWin = iframeRef.current?.contentWindow;
      const doc = iframeRef.current?.contentDocument;
      if (!doc?.head || !doc?.body || !iframeWin) return;

      let st = doc.getElementById("_ve_style") as HTMLStyleElement | null;
      if (!st) {
        st = doc.createElement("style") as HTMLStyleElement;
        st.id = "_ve_style";
        doc.head.appendChild(st);
      }
      st.textContent =
        "[data-ve-section]{position:relative!important;}" +
        "._ve_btn{position:absolute;top:6px;right:6px;background:#FFCD11;color:#000;" +
        "font-size:11px;font-weight:700;padding:3px 10px;border-radius:4px;cursor:pointer;" +
        "z-index:9999;opacity:0;transition:opacity .2s;font-family:system-ui,sans-serif;" +
        "white-space:nowrap;border:none;pointer-events:all;}" +
        "[data-ve-section]:hover>._ve_btn{opacity:1!important;}" +
        "[data-ve-section]:hover{outline:2px solid #FFCD11!important;outline-offset:-2px!important;}" +
        "[data-ve-section]._ve_active{outline:2px solid #FFCD11!important;outline-offset:-2px!important;}";

      doc.querySelectorAll<HTMLElement>("[data-ve-section]").forEach((el) => {
        // Check only DIRECT children (not nested sections) so nested sections don't block parents
        if (el.querySelector(":scope > ._ve_btn")) return;
        const sid = el.getAttribute("data-ve-section") || "";
        const lbl = el.getAttribute("data-ve-label") || sid;
        if (iframeWin.getComputedStyle(el).position === "static") el.style.position = "relative";

        const btn = doc.createElement("button");
        btn.className = "_ve_btn";
        btn.textContent = "✏️ " + lbl;
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          doc.querySelectorAll<HTMLElement>("[data-ve-section]").forEach((x) => x.classList.remove("_ve_active"));
          el.classList.add("_ve_active");
          setActiveSection(sid);
          setView("editor");
        });
        el.appendChild(btn);
        el.addEventListener("mouseenter", () => setHoveredSection(sid));
        el.addEventListener("mouseleave", (e) => {
          if (!el.contains((e as MouseEvent).relatedTarget as Node)) setHoveredSection(null);
        });
      });
    } catch (err) {
      console.warn("VE injectEditor failed:", err);
    }
  }, []);

  // ── iframe load ──────────────────────────────────────────────────────────────

  const handleIframeLoad = useCallback(() => {
    try {
      const path = iframeRef.current?.contentWindow?.location.pathname;
      if (path) setCurrentPath(path);
    } catch {}
    // Apply live CSS immediately
    sendLiveCSS(fixedRef.current, sectionsRef.current);
    // Delay injection so React hydration in the iframe finishes first
    setTimeout(() => {
      injectEditor();
    }, 1200);
  }, [injectEditor, sendLiveCSS]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => handleIframeLoad();
    iframe.addEventListener("load", onLoad);
    try {
      if (iframe.contentDocument?.readyState === "complete") handleIframeLoad();
    } catch {}
    return () => iframe.removeEventListener("load", onLoad);
  }, [handleIframeLoad]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const refreshIframe = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.location.reload();
    } catch {
      setIframeKey((k) => k + 1);
    }
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (iframeRef.current) iframeRef.current.src = path;
  };

  // ── API ──────────────────────────────────────────────────────────────────────

  const apiPut = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
  };

  const saveFixed = async (id: string) => {
    const dbKey = FIXED_SECTION_KEYS[id];
    if (!dbKey) return;
    setSavingFixed(id);
    setSaveError(null);
    try {
      await apiPut({ [dbKey]: fixedSettings[id] });
      refreshIframe();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingFixed(null);
    }
  };

  const savePageSections = async () => {
    setSavingPages(true);
    setSaveError(null);
    try {
      await apiPut({ ve_sections: pageSections });
      refreshIframe();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingPages(false);
    }
  };

  const updateFixed = (id: string, key: string, value: unknown) => {
    setFixedSettings((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const updatePageSection = (sectionId: string, key: string, value: unknown) => {
    setPageSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, settings: { ...s.settings, [key]: value } } : s)
    );
  };

  const togglePageSection = (sectionId: string) => {
    setPageSections((prev) =>
      prev.map((s) => s.id === sectionId ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const deletePageSection = (sectionId: string) => {
    setPageSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const duplicateSection = (sectionId: string) => {
    const src = pageSections.find((s) => s.id === sectionId);
    if (!src) return;
    const copy: PageSection = {
      ...src,
      id: `${src.type}-${Date.now()}`,
      label: `${src.label} (Cópia)`,
      settings: { ...src.settings },
    };
    setPageSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const addSection = (type: PageSectionType) => {
    const id = `${type}-${Date.now()}`;
    const meta = SECTION_TYPE_META[type];
    let settings: Record<string, unknown> = {};
    if (type === "collection") settings = { title: "Nova Coleção", categorySlug: "", desktopColumns: 4, mobileColumns: 2, productCount: 8, viewMoreText: "Ver Mais", viewMoreUrl: "/produtos" };
    if (type === "cta-banner") settings = { heading: "Promoção Especial", subtitle: "Aproveite!", bgColor: "#FFCD11", textColor: "#000000", buttonText: "Comprar", buttonUrl: "/produtos" };
    if (type === "hero") settings = { overlayOpacity: 50, overlayColor: "#000000", buttonText: "Comprar Agora" };
    if (type === "features-bar") settings = { bgColor: "#000000", iconColor: "#FFCD11", textColor: "#FFFFFF" };
    const newSection: PageSection = { id, type, label: meta.label, enabled: true, settings };
    setPageSections((prev) => [...prev, newSection]);
    setShowAddSection(false);
    setActiveSection(id);
    setView("editor");
  };

  // ── Drag-drop ─────────────────────────────────────────────────────────────────

  const onDragStart = (i: number) => setDragSrc(i);
  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOver(i);
  };
  const onDrop = (targetIdx: number) => {
    if (dragSrc === null || dragSrc === targetIdx) { setDragSrc(null); setDragOver(null); return; }
    setPageSections((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragSrc, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
    setDragSrc(null);
    setDragOver(null);
  };

  // ── Banner ops ───────────────────────────────────────────────────────────────

  const toggleBanner = async (b: Banner) => {
    await fetch(`/api/banners/${b.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !b.isActive }) });
    setBanners((prev) => prev.map((x) => x.id === b.id ? { ...x, isActive: !x.isActive } : x));
    refreshIframe();
  };

  const saveBanner = async (data: Partial<Banner> & { id?: string }) => {
    if (data.id) {
      const bannerId = data.id;
      const { id: _id, ...rest } = data;
      const res = await fetch(`/api/banners/${bannerId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rest) });
      const saved = await res.json();
      setBanners((prev) => prev.map((x) => x.id === bannerId ? saved : x));
    } else {
      const res = await fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, order: banners.length }) });
      const saved = await res.json();
      setBanners((prev) => [...prev, saved]);
    }
    refreshIframe();
  };

  const deleteBanner = (id: string) => {
    fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((x) => x.id !== id));
    refreshIframe();
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("files", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    return data.urls?.[0] || "";
  };

  const saveMenu = async (location: string, items: MenuItem[]) => {
    await fetch(`/api/menus/${location}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    refreshIframe();
  };

  // ── Render editor for active section ─────────────────────────────────────────

  const renderEditor = () => {
    if (!activeSection) return null;

    // Fixed sections
    if (activeSection in fixedSettings) {
      const sec = fixedSettings[activeSection] as Record<string, string>;
      const isSaving = savingFixed === activeSection;
      if (activeSection === "announcement")
        return <AnnouncementEditor settings={sec} onChange={(k, v) => updateFixed("announcement", k, v)} onSave={() => saveFixed("announcement")} saving={isSaving} />;
      if (activeSection === "header")
        return (
          <HeaderEditor
            settings={sec}
            onChange={(k, v) => updateFixed("header", k, v)}
            onSave={() => saveFixed("header")}
            saving={isSaving}
            onUpload={uploadImage}
            headerItems={headerItems}
            onHeaderItemsChange={setHeaderItems}
            onMenuSave={() => saveMenu("header", headerItems)}
          />
        );
      if (activeSection === "footer")
        return (
          <FooterEditor
            settings={sec}
            onChange={(k, v) => updateFixed("footer", k, v)}
            onSave={() => saveFixed("footer")}
            saving={isSaving}
            footerItems={footerItems}
            onFooterItemsChange={setFooterItems}
            onMenuSave={() => saveMenu("footer", footerItems)}
          />
        );
      if (activeSection === "product_page")
        return <ProductPageEditor settings={sec} onChange={(k, v) => updateFixed("product_page", k, v)} onSave={() => saveFixed("product_page")} saving={isSaving} />;
      if (activeSection === "cart")
        return <CartEditor settings={sec} onChange={(k, v) => updateFixed("cart", k, v)} onSave={() => saveFixed("cart")} saving={isSaving} />;
      if (activeSection === "checkout")
        return <CheckoutEditor settings={sec} onChange={(k, v) => updateFixed("checkout", k, v)} onSave={() => saveFixed("checkout")} saving={isSaving} />;
    }

    // Dynamic page sections
    const section = pageSections.find((s) => s.id === activeSection);
    if (!section) return <p className="text-xs text-gray-400">Seção não encontrada.</p>;

    const updateFn = (k: string, v: unknown) => updatePageSection(activeSection, k, v);

    if (section.type === "hero")
      return <HeroBannerEditor settings={section.settings} onChange={updateFn} onSave={savePageSections} saving={savingPages} banners={banners} onToggle={toggleBanner} onBannerSave={saveBanner} onBannerDelete={deleteBanner} onUpload={uploadImage} />;
    if (section.type === "features-bar")
      return <FeaturesBarEditor settings={section.settings} onChange={updateFn} onSave={savePageSections} saving={savingPages} />;
    if (section.type === "collection")
      return <CollectionEditor settings={section.settings} onChange={updateFn} onSave={savePageSections} saving={savingPages} categories={initialCategories} />;
    if (section.type === "cta-banner")
      return <CTAEditor settings={section.settings} onChange={updateFn} onSave={savePageSections} saving={savingPages} />;

    return <p className="text-xs text-gray-400">Editor não disponível.</p>;
  };

  // ── Active section label ──────────────────────────────────────────────────────

  const getActiveSectionLabel = () => {
    if (!activeSection) return "Seção";
    if (activeSection === "announcement") return "Barra de Anúncio";
    if (activeSection === "header") return "Cabeçalho";
    if (activeSection === "footer") return "Rodapé";
    if (activeSection === "product_page") return "Página do Produto";
    if (activeSection === "cart")     return "Carrinho";
    if (activeSection === "checkout") return "Checkout";
    const sec = pageSections.find((s) => s.id === activeSection);
    return sec?.label || SECTION_TYPE_META[sec?.type || "hero"]?.label || "Seção";
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="-m-6 flex" style={{ height: "calc(100vh - 57px)", overflow: "hidden" }}>
      {/* ─── SIDEBAR ─── */}
      <aside className="w-72 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-cat-black text-white flex-shrink-0 flex items-center justify-between">
          {view === "editor" ? (
            <>
              <button
                onClick={() => setView("sections")}
                className="flex items-center gap-1 text-sm font-bold hover:text-cat-yellow transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {getActiveSectionLabel()}
              </button>
              <a href="/admin/visual" className="text-xs text-gray-400 hover:text-white">Sair</a>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Editor Visual</p>
                <p className="text-sm font-bold truncate max-w-[180px]">
                  {currentPath === "/" ? "Página Inicial" : currentPath}
                </p>
              </div>
              <a href="/admin/visual" className="text-xs text-gray-400 hover:text-white">← Sair</a>
            </>
          )}
        </div>

        {/* Page navigation */}
        <div className="px-3 py-2.5 border-b bg-gray-50 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Páginas</p>
          <div className="flex flex-wrap gap-1">
            {[...STORE_PAGES, ...initialCategories.slice(0, 3).map((c) => ({
              path: `/produtos?categoria=${c.slug}`, label: c.name, icon: FolderOpen,
            }))].map(({ path, label, icon: Icon }) => {
              const active = path === "/" ? currentPath === "/" : currentPath.startsWith(path.split("?")[0]);
              return (
                <button
                  key={path}
                  onClick={() => navigateTo(path)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    active ? "bg-cat-yellow text-cat-black" : "bg-white border text-gray-600 hover:border-cat-yellow hover:text-cat-black"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {view === "sections" ? (
            <div>
              {/* Fixed top: Announcement */}
              <div className="border-b">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 bg-gray-50">Global</p>
                {(["announcement", "header", "footer", "product_page", "cart", "checkout"] as string[]).map((id) => {
                  const labels: Record<string, string> = { announcement: "Barra de Anúncio", header: "Cabeçalho", footer: "Rodapé", product_page: "Página do Produto", cart: "Carrinho", checkout: "Checkout" };
                  const icons: Record<string, typeof Megaphone> = { announcement: Megaphone, header: LayoutTemplate, footer: Link2, product_page: Shirt, cart: ShoppingBag, checkout: CreditCard };
                  const Icon = icons[id];
                  const isH = hoveredSection === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveSection(id);
                        setView("editor");
                        if (id === "product_page" && !currentPath.startsWith("/produtos/")) navigateTo("/produtos");
                        if (id === "checkout" && currentPath !== "/checkout") navigateTo("/checkout");
                        if (id === "cart" && currentPath !== "/carrinho") navigateTo("/carrinho");
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b hover:bg-yellow-50 transition-colors text-left group ${isH ? "bg-yellow-50 border-l-2 border-l-cat-yellow" : ""}`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isH ? "bg-cat-yellow text-cat-black" : "bg-gray-100 text-gray-500 group-hover:bg-cat-yellow group-hover:text-cat-black"}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="flex-1 text-sm font-semibold text-gray-800">{labels[id]}</p>
                      <ChevronR className="w-4 h-4 text-gray-400 group-hover:text-cat-black" />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic page sections */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-2 bg-gray-50">Estrutura da Página</p>
                {pageSections.map((section, idx) => {
                  const meta = SECTION_TYPE_META[section.type];
                  const Icon = meta?.icon || ImageIcon;
                  const isH = hoveredSection === section.id;
                  const isActive = activeSection === section.id;
                  const isDragTarget = dragOver === idx;
                  return (
                    <div
                      key={section.id}
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onDrop={() => onDrop(idx)}
                      onDragEnd={() => { setDragSrc(null); setDragOver(null); }}
                      className={`flex items-center gap-2 px-2 py-2.5 border-b transition-colors ${
                        isDragTarget ? "bg-yellow-100 border-l-2 border-l-cat-yellow" :
                        isH || isActive ? "bg-yellow-50" : "hover:bg-gray-50"
                      } ${dragSrc === idx ? "opacity-40" : ""}`}
                    >
                      {/* Drag handle */}
                      <div className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      {/* Section icon + label (click to edit) */}
                      <button
                        onClick={() => { setActiveSection(section.id); setView("editor"); }}
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isH || isActive ? "bg-cat-yellow text-cat-black" : "bg-gray-100 text-gray-500"}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">{section.label}</p>
                          {section.type === "collection" && !!section.settings.categorySlug && (
                            <p className="text-xs text-gray-400 truncate">{section.settings.categorySlug as string}</p>
                          )}
                        </div>
                      </button>
                      {/* Toggle visibility */}
                      <button
                        onClick={() => togglePageSection(section.id)}
                        className={`p-1 flex-shrink-0 ${section.enabled ? "text-gray-400 hover:text-gray-600" : "text-gray-300"}`}
                        title={section.enabled ? "Ocultar" : "Mostrar"}
                      >
                        {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      {/* Duplicate */}
                      <button
                        onClick={() => duplicateSection(section.id)}
                        className="p-1 flex-shrink-0 text-gray-300 hover:text-blue-500"
                        title="Duplicar seção"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => { if (confirm(`Remover "${section.label}"?`)) deletePageSection(section.id); }}
                        className="p-1 flex-shrink-0 text-gray-300 hover:text-red-500"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add section */}
                {!showAddSection ? (
                  <button
                    onClick={() => setShowAddSection(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-gray-500 hover:text-cat-black hover:bg-yellow-50 border-b transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Seção
                  </button>
                ) : (
                  <div className="p-3 border-b bg-yellow-50 space-y-2">
                    <p className="text-xs font-bold text-gray-700">Escolha o tipo:</p>
                    {(["collection", "cta-banner", "hero", "features-bar"] as PageSectionType[]).map((type) => {
                      const meta = SECTION_TYPE_META[type];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={type}
                          onClick={() => addSection(type)}
                          className="w-full flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:border-cat-yellow hover:bg-yellow-50 transition-colors text-left"
                        >
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={() => setShowAddSection(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">Cancelar</button>
                  </div>
                )}

                {/* Save structure button */}
                {pageSections.length > 0 && (
                  <div className="p-3 border-b">
                    <button
                      onClick={savePageSections}
                      disabled={savingPages}
                      className="w-full py-2 bg-cat-yellow text-cat-black text-xs font-bold rounded hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingPages ? "Salvando..." : "Salvar Estrutura"}
                    </button>
                  </div>
                )}
              </div>

              {/* Fixed bottom: Footer */}
              <div>
                <button
                  onClick={() => { setActiveSection("footer"); setView("editor"); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b hover:bg-yellow-50 transition-colors text-left group ${hoveredSection === "footer" ? "bg-yellow-50 border-l-2 border-l-cat-yellow" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${hoveredSection === "footer" ? "bg-cat-yellow text-cat-black" : "bg-gray-100 text-gray-500 group-hover:bg-cat-yellow group-hover:text-cat-black"}`}>
                    <AlignJustify className="w-3.5 h-3.5" />
                  </div>
                  <p className="flex-1 text-sm font-semibold text-gray-800">Rodapé</p>
                  <ChevronR className="w-4 h-4 text-gray-400 group-hover:text-cat-black" />
                </button>
              </div>

              <div className="p-4">
                <p className="text-xs text-gray-400 mb-2">Passe o mouse nas seções do preview ou clique em ✏️ para editar diretamente.</p>
                <a href="/" target="_blank" className="flex items-center gap-1 text-xs text-gray-500 hover:text-cat-black">
                  <ExternalLink className="w-3 h-3" /> Ver loja
                </a>
              </div>
            </div>
          ) : (
            /* Section editor */
            <div className="p-4">
              {saveError && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  ⚠️ {saveError}
                </div>
              )}
              {renderEditor()}
            </div>
          )}
        </div>
      </aside>

      {/* ─── PREVIEW ─── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-200">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b flex items-center gap-2 px-3 flex-shrink-0">
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("desktop")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "desktop" ? "bg-cat-black text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "mobile" ? "bg-cat-black text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5 min-w-0">
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">localhost:3000</span>
            <span className="text-xs text-gray-700 font-mono font-semibold truncate">{currentPath}</span>
          </div>

          <button onClick={refreshIframe} title="Recarregar" className="p-2 text-gray-500 hover:text-cat-black hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <a href={currentPath} target="_blank" title="Abrir em nova aba" className="p-2 text-gray-500 hover:text-cat-black hover:bg-gray-100 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* iframe */}
        <div className={`flex-1 overflow-auto flex ${viewMode === "mobile" ? "justify-center items-start pt-6 pb-6" : "items-stretch"}`}>
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={currentPath}
            onLoad={handleIframeLoad}
            title="Preview"
            style={{
              width: viewMode === "mobile" ? "390px" : "100%",
              height: viewMode === "mobile" ? "844px" : "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
