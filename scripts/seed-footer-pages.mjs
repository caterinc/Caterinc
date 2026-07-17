import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const GROUPS = [
  {
    header: 'Institucional',
    items: [
      { title: 'Quem Somos', slug: 'quem-somos' },
    ],
  },
  {
    header: 'Atendimento',
    items: [
      { title: 'Fale Conosco', slug: 'fale-conosco' },
      { title: 'Garantia e Cuidados', slug: 'garantia-e-cuidados' },
      { title: 'Trocas e Devoluções', slug: 'trocas-e-devolucoes' },
      { title: 'Entregas', slug: 'entregas' },
      { title: 'Formas de Pagamento', slug: 'formas-de-pagamento' },
      { title: 'Política de Privacidade', slug: 'politica-de-privacidade' },
      { title: 'Declaração de Cookies', slug: 'declaracao-de-cookies' },
    ],
  },
];

const menu = await prisma.menu.upsert({
  where: { location: 'footer' },
  update: {},
  create: { name: 'Menu Rodapé', location: 'footer' },
});

await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });

let order = 0;
const itemsData = [];
for (const group of GROUPS) {
  itemsData.push({ menuId: menu.id, label: group.header, url: '', order: order++ });
  for (const item of group.items) {
    itemsData.push({ menuId: menu.id, label: item.title, url: `/paginas/${item.slug}`, order: order++ });
  }
}
await prisma.menuItem.createMany({ data: itemsData });
console.log(`Rodapé: ${itemsData.length} itens criados em ${GROUPS.length} grupos.`);

let pagesCreated = 0;
for (const group of GROUPS) {
  for (const item of group.items) {
    const existing = await prisma.page.findUnique({ where: { slug: item.slug } });
    if (existing) continue;
    await prisma.page.create({
      data: { slug: item.slug, title: item.title, content: '' },
    });
    pagesCreated++;
  }
}
console.log(`Páginas: ${pagesCreated} criadas (placeholder, aguardando conteúdo).`);

await prisma.$disconnect();
