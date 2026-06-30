import { Header } from "@/components/store/Header";
import { Footer } from "@/components/store/Footer";
import { prisma } from "@/lib/prisma";
import Script from "next/script";

export const revalidate = 60;

function bool(v: unknown, def = true): boolean {
  if (v === undefined || v === null) return def;
  return v === true || v === "true";
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [headerMenu, footerMenu, settings] = await Promise.all([
    prisma.menu.findUnique({
      where: { location: "header" },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.menu.findUnique({
      where: { location: "footer" },
      include: { items: { orderBy: { order: "asc" } } },
    }),
    prisma.siteSetting.findMany(),
  ]);

  const sm = Object.fromEntries(settings.map((s) => {
    try { return [s.key, JSON.parse(s.value)]; } catch { return [s.key, s.value]; }
  }));

  const vh = (sm.ve_header || {}) as Record<string, unknown>;
  const va = (sm.ve_announcement || {}) as Record<string, unknown>;
  const vf = (sm.ve_footer || {}) as Record<string, unknown>;
  const vpp = (sm.ve_product_page || {}) as Record<string, string>;
  const vc = (sm.ve_cart || {}) as Record<string, string>;

  const globalCss = [
    `--vep-badge-bg:${vpp.badgeBg || "#EF4444"}`,
    `--vep-badge-text:${vpp.badgeText || "#FFFFFF"}`,
    `--vep-drawer-header-bg:${vc.headerBg || "#000000"}`,
    `--vep-drawer-header-text:${vc.headerText || "#ffffff"}`,
    `--vep-drawer-btn-bg:${vc.btnBg || "#FFCD11"}`,
    `--vep-drawer-btn-text:${vc.btnText || "#000000"}`,
    `--vep-drawer-bg:${vc.drawerBg || "#ffffff"}`,
    `--vep-quickadd-bg:${vc.quickaddBg || "#16c789"}`,
    `--vep-quickadd-text:${vc.quickaddText || "#ffffff"}`,
    `--vep-quickadd-ring:${vc.quickaddRing || "transparent"}`,
    `--vep-cart-page-btn-bg:${vc.cartPageBtnBg || "#FFCD11"}`,
    `--vep-cart-page-btn-text:${vc.cartPageBtnText || "#000000"}`,
  ].join(";");

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
      {/* suppressHydrationWarning: CSS vars from DB can differ between SSR and client, that's expected */}
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `:root{${globalCss}}` }} />
      {/* UTMify: capture UTM parameters from URL and persist in localStorage */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){try{var p=new URLSearchParams(window.location.search);var keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck'];var found=false;keys.forEach(function(k){if(p.get(k)){localStorage.setItem('_utm_'+k,p.get(k));found=true;}});if(found)localStorage.setItem('_utm_ts',Date.now().toString());}catch(e){}})();` }} />
      {/* Meta Pixel */}
      <Script id="meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1821164748580849');fbq('track','PageView');` }} />
      <noscript><img height="1" width="1" style={{display:"none"}} src="https://www.facebook.com/tr?id=1821164748580849&ev=PageView&noscript=1" alt="" /></noscript>
      <Header
        menuItems={headerMenu?.items || []}
        storeName={sm.storeName as string}
        logoImage={(vh.logoImage as string) || undefined}
        logoDesktopHeight={Number(vh.logoDesktopHeight) || 40}
        logoMobileHeight={Number(vh.logoMobileHeight) || 32}
        headerBgColor={(vh.bgColor as string) || undefined}
        headerLinkColor={(vh.linkColor as string) || undefined}
        announcementText={(va.text as string) || (sm.announcementText as string) || undefined}
        announcementBgColor={(va.bgColor as string) || undefined}
        announcementTextColor={(va.textColor as string) || undefined}
      />
      <main className="flex-1">{children}</main>
      <Footer
        menuItems={footerMenu?.items || []}
        storeName={sm.storeName as string}
        bgColor={(vf.bgColor as string) || undefined}
        textColor={(vf.textColor as string) || undefined}
        description={(vf.description as string) || undefined}
        showDescription={bool(vf.showDescription)}
        instagram={(vf.instagram as string) || undefined}
        facebook={(vf.facebook as string) || undefined}
        showSocial={bool(vf.showSocial)}
        phone={(vf.phone as string) || (sm.phone as string) || undefined}
        email={(vf.email as string) || (sm.email as string) || undefined}
        address={(vf.address as string) || (sm.address as string) || undefined}
        showContact={bool(vf.showContact)}
        menuTitle={(vf.menuTitle as string) || "Informações"}
        showMenu={bool(vf.showMenu)}
        showCopyright={bool(vf.showCopyright)}
        copyrightText={(vf.copyrightText as string) || undefined}
      />
    </div>
  );
}
