import {
  Navigation, Images, ChevronsDown, Coffee, Star, Eye, MousePointerClick,
  type LucideIcon,
} from "lucide-react";

export interface FormattableEvent {
  type: string;
  page: string;
  label: string | null;
  scrollPct: number | null;
}

export function eventIcon(type: string, label: string | null): { Icon: LucideIcon; color: string; bg: string } {
  if (type === "pageview") return { Icon: Navigation, color: "#60a5fa", bg: "rgba(96,165,250,0.15)" };
  if (type === "gallery") return { Icon: Images, color: "#f472b6", bg: "rgba(244,114,182,0.15)" };
  if (type === "scroll") return { Icon: ChevronsDown, color: "#34d399", bg: "rgba(52,211,153,0.15)" };
  if (type === "idle") return { Icon: Coffee, color: "#7b7fa3", bg: "rgba(123,127,163,0.12)" };
  if (type === "section") {
    if (label?.toLowerCase().includes("avalia")) return { Icon: Star, color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
    return { Icon: Eye, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
  }
  return { Icon: MousePointerClick, color: "#a78bfa", bg: "rgba(167,139,250,0.15)" };
}

const PAGE_LABELS: Record<string, string> = {
  home: "Entrou na página inicial", cart: "Abriu o carrinho",
  checkout: "Iniciou o checkout", tracking: "Acessou rastreamento do pedido",
  account: "Entrou na conta", products: "Navegando em produtos",
  vsl: "Assistindo a VSL",
};

export function formatEventLabel(event: FormattableEvent): string {
  const { type, label, scrollPct, page } = event;

  if (type === "idle") return label || "Ficou parado";
  if (type === "section") {
    if (label?.toLowerCase().includes("avalia")) return "Lendo avaliações do produto";
    return label || "Visualizando seção";
  }
  if (type === "scroll") return label || `Rolou ${scrollPct ?? "?"}% da página`;
  if (type === "gallery") return label || "Passou a foto do produto";
  if (type === "pageview") {
    if (label?.startsWith("Produto: ")) return label;
    return PAGE_LABELS[page] || label || `Visitou: ${page}`;
  }
  if (type === "click") {
    if (label?.startsWith("Botão: ")) return `Clicou em "${label.slice(7)}"`;
    if (label?.startsWith("Link: ")) return `Clicou no link "${label.slice(6)}"`;
    if (label?.startsWith("Clique: ")) return `Clicou em "${label.slice(8)}"`;
    return label || "Clique";
  }
  return label || type;
}
