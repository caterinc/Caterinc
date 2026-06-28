import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@catstore.com" },
    update: {},
    create: {
      email: "admin@catstore.com",
      name: "Admin CAT Store",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Demo customer
  const customerPassword = await bcrypt.hash("cliente123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "cliente@exemplo.com" },
    update: {},
    create: {
      email: "cliente@exemplo.com",
      name: "João Silva",
      password: customerPassword,
      role: "CUSTOMER",
      phone: "(11) 99999-9999",
    },
  });
  console.log("✅ Demo customer created:", customer.email);

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "botas" },
      update: {},
      create: {
        name: "Botas",
        slug: "botas",
        description: "Botas robustas para trabalho e aventura",
        image: "/uploads/cat-botas.jpg",
        order: 1,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "tenis" },
      update: {},
      create: {
        name: "Tênis",
        slug: "tenis",
        description: "Tênis confortáveis para uso diário",
        image: "/uploads/cat-tenis.jpg",
        order: 2,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "sapatos" },
      update: {},
      create: {
        name: "Sapatos",
        slug: "sapatos",
        description: "Sapatos para ocasiões formais e casuais",
        image: "/uploads/cat-sapatos.jpg",
        order: 3,
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: "acessorios" },
      update: {},
      create: {
        name: "Acessórios",
        slug: "acessorios",
        description: "Meias, palmilhas e mais",
        image: "/uploads/cat-acessorios.jpg",
        order: 4,
        isActive: true,
      },
    }),
  ]);
  console.log("✅ Categories created:", categories.map((c) => c.name).join(", "));

  // Products
  const products = [
    {
      name: "Bota CAT Colorado",
      slug: "bota-cat-colorado",
      sku: "CAT-B001",
      price: 599.9,
      comparePrice: 799.9,
      description:
        "A Bota CAT Colorado é construída para durar. Com couro premium resistente à água e solado de borracha antiderrapante, ela oferece proteção e conforto para os trabalhadores mais exigentes.",
      categorySlug: "botas",
      isFeatured: true,
      order: 1,
      images: ["/uploads/bota-colorado-1.jpg", "/uploads/bota-colorado-2.jpg"],
      tags: ["bota", "couro", "impermeável", "trabalho"],
      variants: [
        { size: "38", color: "Preto", stock: 10 },
        { size: "39", color: "Preto", stock: 8 },
        { size: "40", color: "Preto", stock: 12 },
        { size: "41", color: "Preto", stock: 6 },
        { size: "42", color: "Preto", stock: 4 },
        { size: "43", color: "Preto", stock: 5 },
        { size: "38", color: "Marrom", stock: 7 },
        { size: "39", color: "Marrom", stock: 9 },
        { size: "40", color: "Marrom", stock: 11 },
        { size: "41", color: "Marrom", stock: 3 },
        { size: "42", color: "Marrom", stock: 6 },
        { size: "43", color: "Marrom", stock: 2 },
      ],
    },
    {
      name: "Tênis CAT Streamline",
      slug: "tenis-cat-streamline",
      sku: "CAT-T001",
      price: 389.9,
      comparePrice: 489.9,
      description:
        "O Tênis CAT Streamline combina estilo urbano com durabilidade industrial. Perfeito para uso diário, com amortecimento avançado e cabedal em mesh respirável.",
      categorySlug: "tenis",
      isFeatured: true,
      order: 2,
      images: ["/uploads/tenis-streamline-1.jpg"],
      tags: ["tênis", "casual", "conforto", "urbano"],
      variants: [
        { size: "38", color: "Cinza", stock: 15 },
        { size: "39", color: "Cinza", stock: 12 },
        { size: "40", color: "Cinza", stock: 18 },
        { size: "41", color: "Cinza", stock: 10 },
        { size: "42", color: "Cinza", stock: 8 },
        { size: "38", color: "Preto", stock: 10 },
        { size: "39", color: "Preto", stock: 14 },
        { size: "40", color: "Preto", stock: 16 },
        { size: "41", color: "Preto", stock: 9 },
        { size: "42", color: "Preto", stock: 7 },
      ],
    },
    {
      name: "Bota CAT Excavator",
      slug: "bota-cat-excavator",
      sku: "CAT-B002",
      price: 749.9,
      comparePrice: null,
      description:
        "Bota de segurança com biqueira de aço e palmilha anti-perfuração. Certificada NR-10, ideal para ambientes industriais de alto risco.",
      categorySlug: "botas",
      isFeatured: true,
      order: 3,
      images: ["/uploads/bota-excavator-1.jpg"],
      tags: ["bota", "segurança", "biqueira", "industrial", "nr10"],
      variants: [
        { size: "38", color: "Amarelo", stock: 5 },
        { size: "39", color: "Amarelo", stock: 8 },
        { size: "40", color: "Amarelo", stock: 10 },
        { size: "41", color: "Amarelo", stock: 7 },
        { size: "42", color: "Amarelo", stock: 6 },
        { size: "43", color: "Amarelo", stock: 4 },
        { size: "44", color: "Amarelo", stock: 3 },
      ],
    },
    {
      name: "Tênis CAT Lace Up",
      slug: "tenis-cat-lace-up",
      sku: "CAT-T002",
      price: 299.9,
      comparePrice: 359.9,
      description:
        "Clássico reinventado. O CAT Lace Up traz o estilo icônico da marca com tecnologia de conforto moderna.",
      categorySlug: "tenis",
      isFeatured: false,
      order: 4,
      images: ["/uploads/tenis-laceup-1.jpg"],
      tags: ["tênis", "clássico", "lace-up"],
      variants: [
        { size: "37", color: "Branco", stock: 12 },
        { size: "38", color: "Branco", stock: 15 },
        { size: "39", color: "Branco", stock: 18 },
        { size: "40", color: "Branco", stock: 20 },
        { size: "41", color: "Branco", stock: 16 },
        { size: "42", color: "Branco", stock: 14 },
      ],
    },
    {
      name: "Sapato CAT Brock",
      slug: "sapato-cat-brock",
      sku: "CAT-S001",
      price: 459.9,
      comparePrice: 559.9,
      description:
        "Elegância industrial. O CAT Brock é um sapato casual de couro que une o DNA robusto da marca com um visual sofisticado.",
      categorySlug: "sapatos",
      isFeatured: false,
      order: 5,
      images: ["/uploads/sapato-brock-1.jpg"],
      tags: ["sapato", "couro", "casual", "elegante"],
      variants: [
        { size: "39", color: "Caramelo", stock: 8 },
        { size: "40", color: "Caramelo", stock: 10 },
        { size: "41", color: "Caramelo", stock: 12 },
        { size: "42", color: "Caramelo", stock: 9 },
        { size: "43", color: "Caramelo", stock: 6 },
      ],
    },
    {
      name: "Bota CAT Highbury",
      slug: "bota-cat-highbury",
      sku: "CAT-B003",
      price: 649.9,
      comparePrice: 749.9,
      description:
        "Bota Chelsea com elástico lateral, confeccionada em couro legítimo com acabamento premium. Do canteiro de obras ao happy hour.",
      categorySlug: "botas",
      isFeatured: false,
      order: 6,
      images: ["/uploads/bota-highbury-1.jpg"],
      tags: ["bota", "chelsea", "couro", "premium"],
      variants: [
        { size: "39", color: "Preto", stock: 6 },
        { size: "40", color: "Preto", stock: 8 },
        { size: "41", color: "Preto", stock: 10 },
        { size: "42", color: "Preto", stock: 7 },
        { size: "43", color: "Preto", stock: 5 },
      ],
    },
  ];

  for (const productData of products) {
    const { variants, categorySlug, ...rest } = productData;
    const category = categories.find((c) => c.slug === categorySlug);

    const existingProduct = await prisma.product.findUnique({
      where: { slug: rest.slug },
    });

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          ...rest,
          price: rest.price,
          comparePrice: rest.comparePrice ?? undefined,
          categoryId: category?.id,
          variants: {
            create: variants.map((v, i) => ({
              size: v.size,
              color: v.color,
              stock: v.stock,
              sku: `${rest.sku}-${v.size}-${v.color?.substring(0, 2).toUpperCase()}-${i}`,
            })),
          },
        },
      });
      console.log("✅ Product created:", product.name);
    }
  }

  // Banners
  const bannersData = [
    {
      title: "Built for the Tough",
      subtitle: "Calçados que resistem a tudo. Feitos para quem não para.",
      image: "/uploads/banner-hero-1.jpg",
      link: "/produtos",
      order: 1,
      isActive: true,
    },
    {
      title: "Nova Coleção Botas",
      subtitle: "Durabilidade e estilo para cada terreno.",
      image: "/uploads/banner-hero-2.jpg",
      link: "/produtos?categoria=botas",
      order: 2,
      isActive: true,
    },
    {
      title: "Tênis Urbanos",
      subtitle: "Conforto industrial para o dia a dia.",
      image: "/uploads/banner-hero-3.jpg",
      link: "/produtos?categoria=tenis",
      order: 3,
      isActive: true,
    },
  ];

  for (const banner of bannersData) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
    });
    if (!existing) {
      await prisma.banner.create({ data: banner });
    }
  }
  console.log("✅ Banners created");

  // Menus
  const headerMenu = await prisma.menu.upsert({
    where: { location: "header" },
    update: {},
    create: {
      name: "Menu Principal",
      location: "header",
      items: {
        create: [
          { label: "Início", url: "/", order: 1 },
          { label: "Produtos", url: "/produtos", order: 2 },
          { label: "Botas", url: "/produtos?categoria=botas", order: 3 },
          { label: "Tênis", url: "/produtos?categoria=tenis", order: 4 },
          { label: "Sapatos", url: "/produtos?categoria=sapatos", order: 5 },
        ],
      },
    },
  });

  await prisma.menu.upsert({
    where: { location: "footer" },
    update: {},
    create: {
      name: "Menu Rodapé",
      location: "footer",
      items: {
        create: [
          { label: "Sobre Nós", url: "/sobre", order: 1 },
          { label: "Contato", url: "/contato", order: 2 },
          { label: "Trocas e Devoluções", url: "/trocas", order: 3 },
          { label: "Política de Privacidade", url: "/privacidade", order: 4 },
        ],
      },
    },
  });
  console.log("✅ Menus created");

  // Site Settings
  const settingsData = [
    { key: "primaryColor", value: "#FFCD11" },
    { key: "secondaryColor", value: "#000000" },
    { key: "accentColor", value: "#333333" },
    { key: "storeName", value: "CAT Store" },
    { key: "storeDescription", value: "Calçados robustos e duráveis para quem não para." },
    { key: "logo", value: "/uploads/logo.svg" },
    { key: "favicon", value: "/favicon.ico" },
    { key: "phone", value: "(11) 3000-0000" },
    { key: "email", value: "contato@catstore.com.br" },
    { key: "address", value: "Av. Paulista, 1000 - São Paulo, SP" },
    { key: "shippingFee", value: "29.90" },
    { key: "freeShippingThreshold", value: "299.00" },
    {
      key: "socialLinks",
      value: JSON.stringify({
        instagram: "https://instagram.com/catstore",
        facebook: "https://facebook.com/catstore",
        whatsapp: "https://wa.me/5511930000000",
      }),
    },
  ];

  for (const setting of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ Site settings created");

  // Demo order
  const demoProduct = await prisma.product.findUnique({
    where: { slug: "bota-cat-colorado" },
    include: { variants: true },
  });

  if (demoProduct && demoProduct.variants.length > 0) {
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: "CAT-00001" },
    });

    if (!existingOrder) {
      const order = await prisma.order.create({
        data: {
          orderNumber: "CAT-00001",
          userId: customer.id,
          email: customer.email!,
          status: "SHIPPED",
          paymentStatus: "PAID",
          subtotal: 599.9,
          shipping: 0,
          total: 599.9,
          shippingAddress: {
            name: customer.name,
            street: "Rua das Flores",
            number: "123",
            district: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01310-100",
          },
          trackingCode: "BR123456789BR",
          items: {
            create: [
              {
                productId: demoProduct.id,
                variantId: demoProduct.variants[0].id,
                quantity: 1,
                price: 599.9,
                name: demoProduct.name,
                size: demoProduct.variants[0].size,
                color: demoProduct.variants[0].color,
              },
            ],
          },
          statusHistory: {
            create: [
              { status: "PENDING", note: "Pedido realizado", createdAt: new Date("2024-10-01T10:00:00Z") },
              { status: "CONFIRMED", note: "Pagamento confirmado", createdAt: new Date("2024-10-01T10:30:00Z") },
              { status: "PROCESSING", note: "Pedido em separação", createdAt: new Date("2024-10-02T09:00:00Z") },
              { status: "SHIPPED", note: "Pedido enviado via Correios", createdAt: new Date("2024-10-03T14:00:00Z") },
            ],
          },
        },
      });
      console.log("✅ Demo order created:", order.orderNumber);
    }
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("📧 Admin: admin@catstore.com / 🔑 admin123");
  console.log("📧 Cliente: cliente@exemplo.com / 🔑 cliente123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
