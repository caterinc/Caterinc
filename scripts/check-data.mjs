import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const products = await prisma.product.findMany({
  select: { id: true, name: true, tags: true, variants: { select: { id: true, size: true, color: true, stock: true, sku: true } } }
});
console.log('Total products:', products.length);
const withEscassez = products.filter(p => p.tags.includes('escassez'));
console.log('With escassez tag:', withEscassez.length, withEscassez.map(p => p.name));
const allVariants = products.flatMap(p => p.variants);
const variantsNoStock = allVariants.filter(v => v.stock === 0);
const variantsNoSKU = allVariants.filter(v => !v.sku);
console.log('Total variants:', allVariants.length);
console.log('Variants stock=0:', variantsNoStock.length);
console.log('Variants no SKU:', variantsNoSKU.length);
// Sample a few variants
console.log('Sample variants:', allVariants.slice(0,3).map(v => ({ id: v.id, size: v.size, color: v.color, stock: v.stock, sku: v.sku })));

await prisma.$disconnect();
