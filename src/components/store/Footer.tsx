import Link from "next/link";
import { Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";

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
  // Description / brand block
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
  // Copyright bar
  showCopyright?: boolean;
  copyrightText?: string;
}

export function Footer({
  menuItems = [],
  storeName = "CAT Store",
  bgColor = "#000000",
  textColor = "#9CA3AF",
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
  showCopyright = true,
  copyrightText,
}: FooterProps) {
  const hasContact = !!(phone || email || address);
  const hasSocial = !!(instagram || facebook);
  const hasMenu = menuItems.length > 0;

  // Count active columns to set grid width
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
      <div className={`max-w-7xl mx-auto px-4 py-12 grid ${colClass} gap-8`}>
        {/* Brand / description */}
        {showDescription && (
          <div className={cols >= 3 ? "col-span-1 md:col-span-2" : ""}>
            <div className="bg-cat-yellow text-cat-black font-black text-2xl px-3 py-1 tracking-widest inline-block mb-4">
              CAT
            </div>
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
          <div>
            {menuTitle && (
              <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">{menuTitle}</h4>
            )}
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <Link href={item.url} className="text-sm hover:text-cat-yellow transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact */}
        {showContact && hasContact && (
          <div>
            <h4 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Contato</h4>
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

      {showCopyright && (
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
            <p>{copyrightText || `© ${new Date().getFullYear()} ${storeName}. Todos os direitos reservados.`}</p>
          </div>
        </div>
      )}
    </footer>
  );
}
