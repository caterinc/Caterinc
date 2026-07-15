import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const NEW_PRICE = 157.90;

const product = await prisma.product.findFirst({
  where: { name: { contains: 'Force One', mode: 'insensitive' } },
  include: { variants: true },
});

if (!product) {
  console.log('Produto Force One não encontrado');
  process.exit(1);
}

console.log('Produto:', product.name, product.id);
console.log('Preço atual:', product.price, '-> novo:', NEW_PRICE);
console.log('Variantes a atualizar:', product.variants.length);

await prisma.$transaction([
  prisma.product.update({ where: { id: product.id }, data: { price: NEW_PRICE } }),
  prisma.productVariant.updateMany({ where: { productId: product.id }, data: { price: NEW_PRICE } }),
]);

console.log('OK — preço do produto e de todas as variantes atualizado para', NEW_PRICE);

await prisma.$disconnect();
