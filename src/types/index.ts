import type {
  User,
  Product,
  ProductVariant,
  Category,
  Order,
  OrderItem,
  OrderStatusHistory,
  Banner,
  Menu,
  MenuItem,
  SiteSetting,
  Cart,
  CartItem,
  Address,
} from "@prisma/client";

export type {
  User,
  Product,
  ProductVariant,
  Category,
  Order,
  OrderItem,
  OrderStatusHistory,
  Banner,
  Menu,
  MenuItem,
  SiteSetting,
  Cart,
  CartItem,
  Address,
};

export type ProductWithDetails = Product & {
  category: Category | null;
  variants: ProductVariant[];
};

export type OrderWithDetails = Order & {
  items: (OrderItem & { product: Product; variant: ProductVariant | null })[];
  statusHistory: OrderStatusHistory[];
  user: User | null;
};

export type CartWithDetails = Cart & {
  items: (CartItem & {
    product: Product;
    variant: ProductVariant | null;
  })[];
};

export type SiteSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  storeName: string;
  storeDescription: string;
  logo: string;
  favicon: string;
  phone: string;
  email: string;
  address: string;
  shippingFee: string;
  freeShippingThreshold: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
};
