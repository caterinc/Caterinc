import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TrocasPage() {
  const storeNameSetting = await prisma.siteSetting.findUnique({ where: { key: "store_name" } });
  const storeName = storeNameSetting?.value || "Cat Store";
  const contactEmail = (await prisma.siteSetting.findUnique({ where: { key: "contact_email" } }))?.value || "contato@catstore.com.br";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-cat-black mb-2">Trocas e Devoluções</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: junho de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">1. Prazo para troca ou devolução</h2>
          <p>
            Você tem até <strong>30 dias corridos</strong> a partir da data de recebimento do produto para
            solicitar troca ou devolução, conforme o <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>.
          </p>
          <p className="mt-2">
            Para produtos com defeito de fabricação, o prazo é de <strong>90 dias</strong> a partir do recebimento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">2. Condições para troca ou devolução</h2>
          <p>O produto deve estar:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Na embalagem original, sem sinais de uso</li>
            <li>Acompanhado da nota fiscal</li>
            <li>Sem avarias causadas pelo cliente</li>
            <li>Com todos os acessórios e documentos originais</li>
          </ul>
          <p className="mt-2 text-sm">
            Produtos com sinais de uso, avaria por descuido ou fora do prazo não serão aceitos para troca.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">3. Como solicitar</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Envie um e-mail para{" "}
              <a href={`mailto:${contactEmail}`} className="text-cat-black font-bold underline">{contactEmail}</a>{" "}
              com o número do pedido e o motivo da troca/devolução.
            </li>
            <li>Aguarde nossa confirmação (em até 2 dias úteis).</li>
            <li>Após confirmação, envie o produto pelos Correios com código de rastreio.</li>
            <li>
              Assim que recebermos e conferirmos o produto, realizaremos a troca ou o reembolso em até <strong>5 dias úteis</strong>.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">4. Quem paga o frete de devolução?</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Defeito de fabricação ou erro nosso</strong> — o frete de retorno é por nossa conta.
              Enviaremos um código de postagem pelos Correios.
            </li>
            <li>
              <strong>Troca por tamanho ou cor</strong> — o frete de retorno é por conta do cliente.
              Após receber o produto, enviamos o novo sem custo adicional de frete.
            </li>
            <li>
              <strong>Desistência da compra (arrependimento)</strong> — o frete de retorno é por conta do cliente.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">5. Reembolso</h2>
          <p>
            O reembolso é realizado pelo mesmo meio de pagamento utilizado na compra:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cartão de crédito</strong> — estorno em até 2 faturas seguintes</li>
            <li><strong>Pix / boleto</strong> — transferência bancária em até 5 dias úteis</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">6. Produtos sem direito a troca</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Produtos personalizados ou sob encomenda</li>
            <li>Produtos com embalagem violada pelo cliente sem registro fotográfico</li>
            <li>Produtos fora do prazo estabelecido</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">7. Dúvidas</h2>
          <p>
            Qualquer dúvida, entre em contato pelo e-mail{" "}
            <a href={`mailto:${contactEmail}`} className="text-cat-black font-bold underline">{contactEmail}</a>.
            Nossa equipe responde em até <strong>2 dias úteis</strong>.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            — {storeName}
          </p>
        </section>
      </div>
    </div>
  );
}
