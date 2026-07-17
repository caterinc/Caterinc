import Link from "next/link";
import Image from "next/image";
import { Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";
import { groupMenuItems } from "@/lib/menu";

interface MenuItem {
  id: string;
  label: string;
  url: string;
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
  // Seal/logo above copyright (centered)
  sealAbove?: string;
  // Copyright bar
  showCopyright?: boolean;
  copyrightText?: string;
  // Seals below copyright (left and right)
  sealBottomLeft?: string;
  sealBottomRight?: string;
}

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
  sealAbove,
  showCopyright = true,
  copyrightText,
  sealBottomLeft,
  sealBottomRight,
}: FooterProps) {
  const hasContact = !!(phone || email || address);
  const hasSocial = !!(instagram || facebook);
  const hasMenu = menuItems.length > 0;
  const menuGroups = groupMenuItems(menuItems);
  const hasBottomSeals = !!(sealBottomLeft || sealBottomRight);

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

      {/* CNPJ + Seal above copyright */}
      {((showLegalText && legalText) || sealAbove) && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col items-center gap-4 text-center">
            {showLegalText && legalText && (
              <p className="text-xs leading-relaxed" style={{ color: textColor }}>{legalText}</p>
            )}
            {sealAbove && (
              <img src={sealAbove} alt="Selo" className="h-20 w-auto object-contain mx-auto" />
            )}
          </div>
        </div>
      )}

      {/* Copyright */}
      {showCopyright && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs leading-relaxed" style={{ color: textColor }}>
            {copyrightText || `© ${new Date().getFullYear()} ${storeName}. Todos os direitos reservados.`}
          </div>
        </div>
      )}

      {/* Seals below copyright — left and right, same size */}
      {hasBottomSeals && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
            <div className="w-1/3 flex justify-start">
              {sealBottomLeft && (
                <img src={sealBottomLeft} alt="Selo esquerdo" className="h-14 w-auto object-contain" />
              )}
            </div>
            <div className="w-1/3" />
            <div className="w-1/3 flex justify-end">
              {sealBottomRight && (
                <img src={sealBottomRight} alt="Selo direito" className="h-14 w-auto object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
