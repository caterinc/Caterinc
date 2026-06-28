import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  where: { isActive: true },
  include: { variants: true },
  orderBy: { order: 'asc' },
});

let updated = 0;
let skipped = 0;

for (const product of products) {
  // Get unique colors in the order they first appear in variants
  const seen = new Set();
  const uniqueColors = [];
  for (const v of product.variants) {
    if (v.color && !seen.has(v.color)) {
      seen.add(v.color);
      uniqueColors.push(v.color);
    }
  }

  // Skip products with no colors or no images
  if (uniqueColors.length === 0 || product.images.length === 0) {
    skipped++;
    continue;
  }

  // Skip products that already have variant images set
  const hasImages = product.variants.some(v => v.color && v.image);
  if (hasImages) {
    console.log(`[SKIP] ${product.name} — já tem imagens de variante`);
    skipped++;
    continue;
  }

  const numColors = uniqueColors.length;
  const numImages = product.images.length;

  // Calculate how many images per color (distribute evenly)
  // Each color gets floor(numImages/numColors) images
  // The first image of each color group = images[i * imagesPerColor]
  const imagesPerColor = Math.max(1, Math.floor(numImages / numColors));

  console.log(`\n[PRODUTO] ${product.name}`);
  console.log(`  Cores: ${uniqueColors.join(', ')}`);
  console.log(`  Imagens: ${numImages} | Imagens por cor: ~${imagesPerColor}`);

  for (let i = 0; i < uniqueColors.length; i++) {
    const color = uniqueColors[i];
    const imageIndex = Math.min(i * imagesPerColor, numImages - 1);
    const image = product.images[imageIndex];

    console.log(`  ${color} → imagem[${imageIndex}]: ${image}`);

    // Update all variants of this color
    await prisma.productVariant.updateMany({
      where: {
        productId: product.id,
        color: color,
        image: null, // only set if not already set
      },
      data: { image },
    });
    updated++;
  }
}

console.log(`\n✓ ${updated} grupos de cores atualizados, ${skipped} produtos pulados`);
await prisma.$disconnect();
