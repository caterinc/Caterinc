import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 1. Remove "escassez" tag from all products
const productsWithTag = await prisma.product.findMany({ where: { tags: { has: 'escassez' } }, select: { id: true, name: true, tags: true } });
for (const p of productsWithTag) {
  const newTags = p.tags.filter(t => t !== 'escassez');
  await prisma.product.update({ where: { id: p.id }, data: { tags: newTags } });
  console.log(`Removed "escassez" from: ${p.name}`);
}

// 2. Set stock=15 for all variants with stock=0
const updatedStock = await prisma.productVariant.updateMany({ where: { stock: 0 }, data: { stock: 15 } });
console.log(`Updated stock for ${updatedStock.count} variants (set to 15)`);

// 3. Generate SKUs for variants without SKU
const variantsNoSKU = await prisma.productVariant.findMany({
  where: { sku: null },
  include: { product: { select: { sku: true, name: true } } },
  orderBy: { id: 'asc' },
});

let skuCount = 0;
for (const v of variantsNoSKU) {
  const base = (v.product.sku || v.product.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)) || 'CAT';
  const sizeCode = v.size.replace(/[^0-9A-Z]/gi, '').toUpperCase().slice(0, 4);
  const colorCode = (v.color || 'UN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  const sku = `${base}-${sizeCode}-${colorCode}-${skuCount.toString().padStart(3, '0')}`;
  try {
    await prisma.productVariant.update({ where: { id: v.id }, data: { sku } });
    skuCount++;
  } catch {
    // If sku conflict, add extra suffix
    await prisma.productVariant.update({ where: { id: v.id }, data: { sku: `${sku}-${v.id.slice(-3)}` } });
    skuCount++;
  }
}
console.log(`Generated SKUs for ${skuCount} variants`);

await prisma.$disconnect();
console.log('Done!');
