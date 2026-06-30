import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true },
  });

  console.log(`Fixing order for ${products.length} products...`);

  for (const product of products) {
    // Group variants by color in the order they appear (insertion order)
    const colorOrder = new Map<string, number>();
    let colorIdx = 0;
    for (const v of product.variants) {
      const key = v.color || "__none__";
      if (!colorOrder.has(key)) { colorOrder.set(key, colorIdx++); }
    }

    // Assign order: colorGroupIndex * 1000 + sizeIndex within color
    const sizeCounters = new Map<string, number>();
    const updates: { id: string; order: number }[] = product.variants.map((v) => {
      const key = v.color || "__none__";
      const ci = colorOrder.get(key)!;
      const si = sizeCounters.get(key) ?? 0;
      sizeCounters.set(key, si + 1);
      return { id: v.id, order: ci * 1000 + si };
    });

    for (const u of updates) {
      await prisma.productVariant.update({ where: { id: u.id }, data: { order: u.order } });
    }
    console.log(`  ✓ ${product.name} (${product.variants.length} variants)`);
  }

  console.log("Done!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
