import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SobrePage() {
  const storeNameSetting = await prisma.siteSetting.findUnique({ where: { key: "store_name" } });
  const storeName = storeNameSetting?.value || "Cat Store";
  const contactEmail = (await prisma.siteSetting.findUnique({ where: { key: "contact_email" } }))?.value || "contato@catstore.com.br";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-cat-black mb-2">Sobre Nós</h1>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <div className="bg-cat-yellow text-cat-black font-black text-3xl px-4 py-2 tracking-widest inline-block mb-6">
            CAT
          </div>
          <h2 className="text-lg font-black text-cat-black mb-2">Nossa missão</h2>
          <p>
            A <strong>{storeName}</strong> nasceu da paixão por calçados que combinam resistência, conforto e estilo.
            Somos uma loja especializada em calçados <strong>Caterpillar</strong> — a mesma marca que equipa as maiores
            obras do mundo agora está nos seus pés.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">Por que escolher a CAT?</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Qualidade certificada</strong> — cada par passa por rigorosos testes de resistência e durabilidade.
            </li>
            <li>
              <strong>Conforto real</strong> — tecnologia de amortecimento que suporta longas jornadas de trabalho e aventura.
            </li>
            <li>
              <strong>Design atemporal</strong> — botas e tênis que combinam com qualquer estilo, dentro e fora do trabalho.
            </li>
            <li>
              <strong>Material de ponta</strong> — couro legítimo, solado de borracha e construção robusta para durar anos.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">Nosso compromisso</h2>
          <p>
            Entregamos em todo o Brasil com rastreamento em tempo real. Cada pedido é embalado com cuidado
            para garantir que seu calçado chegue em perfeito estado. Acreditamos em atendimento transparente
            e honesto — se algo não estiver certo, resolvemos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">Fale conosco</h2>
          <p>
            Tem alguma dúvida sobre nossos produtos, tamanhos ou entrega? Nossa equipe está pronta para ajudar.
          </p>
          <p className="mt-2">
            E-mail:{" "}
            <a href={`mailto:${contactEmail}`} className="text-cat-black font-bold underline">{contactEmail}</a>
          </p>
          <p className="mt-1">
            <Link href="/contato" className="text-cat-black font-bold underline hover:text-cat-yellow transition-colors">
              Ir para página de contato →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
