import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Phone, Mail, MapPin, ShieldCheck, Lock } from "lucide-react";
import { groupMenuItems } from "@/lib/menu";

interface MenuItem {
  id: string;
  label: string;
  url: string;
}

export interface TrustSeal {
  id: string;
  label: string;
  type: "image" | "site-seguro";
  imageUrl?: string;
  enabled: boolean;
}

export interface FooterProps {
  menuItems?: MenuItem[];
  storeName?: string;
  bgColor?: string;
  textColor?: string;
  headingColor?: string;
  // Description / brand block
  logoImage?: string;
  description?: string;
  showDescription?: boolean;
  // Social links
  instagram?: string;
  facebook?: string;
  showSocial?: boolean;
  // Contact
  phone?: string;
  email?: string;
  address?: string;
  showContact?: boolean;
  // Links menu
  menuTitle?: string;
  showMenu?: boolean;
  // Legal info (CNPJ, empresa, etc.)
  legalText?: string;
  showLegalText?: boolean;
  // Trust seals
  trustSeals?: TrustSeal[];
  showTrustSeals?: boolean;
  // Copyright bar
  showCopyright?: boolean;
  copyrightText?: string;
}

function SiteSeguroBadge() {
  return (
    <div className="flex items-center gap-2 border border-green-500 rounded-lg px-4 py-2 bg-green-500/10">
      <ShieldCheck className="w-6 h-6 text-green-400" />
      <div>
        <p className="text-green-400 font-bold text-sm leading-none">Site Seguro</p>
        <p className="text-green-500/70 text-[10px] leading-none mt-0.5">Compra 100% protegida</p>
      </div>
      <Lock className="w-4 h-4 text-green-400" />
    </div>
  );
}

const DEFAULT_SEALS: TrustSeal[] = [
  { id: "cat", label: "CAT Licensed", type: "image", imageUrl: "/selo-cat.png", enabled: true },
  { id: "site-seguro", label: "Site Seguro", type: "site-seguro", enabled: true },
  { id: "reclameaqui", label: "ReclameAQUI", type: "image", imageUrl: "", enabled: false },
];

export function Footer({
  menuItems = [],
  storeName = "CAT Store",
  bgColor = "#000000",
  textColor = "#9CA3AF",
  headingColor = "#FFFFFF",
  logoImage,
  description,
  showDescription = true,
  instagram,
  facebook,
  showSocial = true,
  phone,
  email,
  address,
  showContact = true,
  menuTitle = "Informações",
  showMenu = true,
  legalText,
  showLegalText = false,
  trustSeals = DEFAULT_SEALS,
  showTrustSeals = true,
  showCopyright = true,
  copyrightText,
}: FooterProps) {
  const hasContact = !!(phone || email || address);
  const hasSocial = !!(instagram || facebook);
  const hasMenu = menuItems.length > 0;
  const menuGroups = groupMenuItems(menuItems);
  const activeSeals = (trustSeals || DEFAULT_SEALS).filter((s) => s.enabled);

  const cols = [
    showDescription,
    showMenu && hasMenu,
    showContact && hasContact,
  ].filter(Boolean).length;

  const colClass =
    cols === 1 ? "grid-cols-1" :
    cols === 2 ? "grid-cols-1 md:grid-cols-2" :
    "grid-cols-1 md:grid-cols-4";

  return (
    <footer
      data-ve-section="footer"
      data-ve-label="Rodapé"
      suppressHydrationWarning
      className="mt-16"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {/* Main content */}
      <div className={`max-w-7xl mx-auto px-4 py-12 grid ${colClass} gap-8`}>
        {/* Brand / description */}
        {showDescription && (
          <div className={cols >= 3 ? "col-span-1 md:col-span-2" : ""}>
            {logoImage ? (
              <div className="relative h-10 w-32 mb-4">
                <Image src={logoImage} alt={storeName} fill className="object-contain object-left" />
              </div>
            ) : (
              <div className="bg-cat-yellow text-cat-black font-black text-2xl px-3 py-1 tracking-widest inline-block mb-4">
                CAT
              </div>
            )}
            <p className="text-sm leading-relaxed mb-4">
              {description || "Calçados robustos e duráveis para quem não para. Qualidade industrial para o seu dia a dia."}
            </p>
            {showSocial && hasSocial && (
              <div className="flex gap-3">
                {instagram && (
                  <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-cat-yellow transition-colors" aria-label="Instagram">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {facebook && (
                  <a href={facebook} target="_blank" rel="noopener noreferrer" className="hover:text-cat-yellow transition-colors" aria-label="Facebook">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Links menu */}
        {showMenu && hasMenu && (
          <div className="space-y-6">
            {menuGroups.map((group, gi) => (
              <div key={gi}>
                <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm" style={{ color: headingColor }}>
                  {group.header?.label || menuTitle}
                </h4>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <Link href={item.url} className="text-sm hover:text-cat-yellow transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {showContact && hasContact && (
          <div>
            <h4 className="font-semibold mb-4 uppercase tracking-wider text-sm" style={{ color: headingColor }}>Contato</h4>
            <ul className="space-y-3">
              {phone && (
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-cat-yellow flex-shrink-0" />
                  {phone}
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-cat-yellow flex-shrink-0" />
                  {email}
                </li>
              )}
              {address && (
                <li className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-cat-yellow flex-shrink-0 mt-0.5" />
                  {address}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Legal info (CNPJ, empresa) */}
      {showLegalText && legalText && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs leading-relaxed" style={{ color: textColor }}>
            {legalText}
          </div>
        </div>
      )}

      {/* Trust seals */}
      {showTrustSeals && activeSeals.length > 0 && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap justify-center items-center gap-8">
            {activeSeals.map((seal) => {
              if (seal.type === "site-seguro") return <SiteSeguroBadge key={seal.id} />;
              if (seal.imageUrl) {
                return (
                  <div key={seal.id} className="overflow-hidden flex-shrink-0" style={{ maxHeight: 72 }}>
                    <img
                      src={seal.imageUrl}
                      alt={seal.label}
                      className="h-16 w-auto object-top object-cover"
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Copyright */}
      {showCopyright && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
            <p>{copyrightText || `© ${new Date().getFullYear()} ${storeName}. Todos os direitos reservados.`}</p>
          </div>
        </div>
      )}
    </footer>
  );
}
