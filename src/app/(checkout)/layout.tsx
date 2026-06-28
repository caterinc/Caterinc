import { prisma } from "@/lib/prisma";

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.siteSetting.findMany();
  const sm = Object.fromEntries(settings.map((s) => {
    try { return [s.key, JSON.parse(s.value)]; } catch { return [s.key, s.value]; }
  }));

  const ck = (sm.ve_checkout || {}) as Record<string, string>;

  const css = [
    `--vep-checkout-step-active-bg:${ck.stepActiveBg || "#16c789"}`,
    `--vep-checkout-step-active-text:${ck.stepActiveText || "#ffffff"}`,
    `--vep-checkout-step-done-bg:${ck.stepDoneBg || "#16c789"}`,
    `--vep-checkout-continue-bg:${ck.continueBg || "#16c789"}`,
    `--vep-checkout-continue-text:${ck.continueText || "#ffffff"}`,
    `--vep-checkout-cta-bg:${ck.ctaBg || "#16c789"}`,
    `--vep-checkout-cta-text:${ck.ctaText || "#ffffff"}`,
    `--vep-checkout-header-bg:${ck.headerBg || "#ffffff"}`,
    `--vep-checkout-page-bg:${ck.pageBg || "#F5F5F5"}`,
  ].join(";");

  return (
    <>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `:root{${css}}` }} />
      {children}
    </>
  );
}
