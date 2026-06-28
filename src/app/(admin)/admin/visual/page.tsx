import Link from "next/link";
import { Image, Menu, Palette, Move, Wand2 } from "lucide-react";

const sections = [
  {
    title: "Banners",
    description: "Gerencie o carrossel da página inicial. Adicione, edite, reordene e ative/desative banners.",
    href: "/admin/visual/banners",
    icon: Image,
    color: "bg-blue-500",
  },
  {
    title: "Menus",
    description: "Edite os links do cabeçalho e rodapé. Adicione, remova e reordene itens de navegação.",
    href: "/admin/visual/menu",
    icon: Menu,
    color: "bg-green-500",
  },
  {
    title: "Cores e Tema",
    description: "Personalize as cores da loja: cor primária, secundária e de destaque.",
    href: "/admin/visual/cores",
    icon: Palette,
    color: "bg-purple-500",
  },
  {
    title: "Posição dos Produtos",
    description: "Reordene os produtos da loja. Defina quais aparecem primeiro na listagem.",
    href: "/admin/visual/produtos",
    icon: Move,
    color: "bg-cat-black",
  },
];

export default function VisualEditorPage() {
  return (
    <div>
      <h1 className="text-2xl font-black text-cat-black mb-2">Editor Visual</h1>
      <p className="text-gray-500 text-sm mb-6">Personalize a aparência da sua loja sem precisar escrever código.</p>

      {/* New unified editor CTA */}
      <Link
        href="/admin/visual/editor"
        className="flex items-center gap-4 bg-cat-black text-white rounded-xl p-6 mb-8 hover:bg-gray-900 transition-colors group"
      >
        <div className="bg-cat-yellow rounded-xl w-14 h-14 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Wand2 className="w-7 h-7 text-cat-black" />
        </div>
        <div>
          <p className="font-black text-lg">Editor Visual Completo</p>
          <p className="text-gray-400 text-sm mt-0.5">
            Preview em tempo real · Desktop e mobile · Editar banners, cores, menus e mais — tudo em uma tela.
          </p>
        </div>
        <span className="ml-auto text-cat-yellow font-bold text-lg">→</span>
      </Link>

      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-3">Ou edite individualmente:</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="bg-white rounded-xl border p-6 hover:border-cat-yellow hover:shadow-md transition-all group"
          >
            <div className={`${section.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <section.icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-bold text-lg text-cat-black mb-2">{section.title}</h2>
            <p className="text-sm text-gray-500">{section.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-cat-yellow rounded-xl p-6">
        <h2 className="font-bold text-cat-black mb-2">Como funciona o Editor Visual?</h2>
        <ul className="text-sm text-cat-gray space-y-1">
          <li>• Alterações são salvas automaticamente no banco de dados</li>
          <li>• Mudanças ficam visíveis na loja imediatamente após salvar</li>
          <li>• Banners inativos não aparecem na home, mas ficam salvos</li>
          <li>• A ordem dos produtos reflete na página de listagem</li>
        </ul>
      </div>
    </div>
  );
}
