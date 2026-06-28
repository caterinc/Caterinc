import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PrivacidadePage() {
  const storeNameSetting = await prisma.siteSetting.findUnique({ where: { key: "store_name" } });
  const storeName = storeNameSetting?.value || "Cat Store";
  const contactEmail = (await prisma.siteSetting.findUnique({ where: { key: "contact_email" } }))?.value || "contato@catstore.com.br";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-cat-black mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-400 mb-8">Última atualização: junho de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">1. Quem somos</h2>
          <p>
            <strong>{storeName}</strong> é responsável pelo tratamento dos seus dados pessoais coletados neste site,
            em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
          <p className="mt-2">
            Em caso de dúvidas: <a href={`mailto:${contactEmail}`} className="text-cat-black font-bold underline">{contactEmail}</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">2. Quais dados coletamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Nome completo</strong> — para identificação e emissão de pedido</li>
            <li><strong>E-mail</strong> — para envio de confirmações e comunicações do pedido</li>
            <li><strong>Telefone/WhatsApp</strong> — para contato sobre o pedido</li>
            <li><strong>Endereço de entrega</strong> — para entrega do produto</li>
          </ul>
          <p className="mt-2 text-sm">
            <strong>Não coletamos</strong> dados de cartão de crédito. Os pagamentos com cartão são processados
            diretamente pelo <strong>Mercado Pago</strong>, que é responsável pela segurança dessas informações.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">3. Para que usamos seus dados</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processar e entregar seu pedido</li>
            <li>Enviar confirmações e atualizações sobre o status do pedido</li>
            <li>Entrar em contato em caso de problemas com a entrega</li>
            <li>Cumprir obrigações legais e fiscais</li>
          </ul>
          <p className="mt-2 text-sm"><strong>Não vendemos seus dados a terceiros.</strong></p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">4. Com quem compartilhamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mercado Pago</strong> — processamento de pagamentos (LGPD art. 7, VI)</li>
            <li><strong>Transportadoras</strong> — somente nome e endereço para entrega</li>
            <li><strong>Autoridades públicas</strong> — quando exigido por lei</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">5. Por quanto tempo guardamos</h2>
          <p>
            Dados de pedidos são mantidos por <strong>5 anos</strong> para fins fiscais e contábeis,
            conforme a legislação brasileira. Após esse prazo, os dados são excluídos ou anonimizados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">6. Seus direitos (LGPD art. 18)</h2>
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar se tratamos seus dados</li>
            <li>Acessar seus dados</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão (quando não houver obrigação legal)</li>
            <li>Revogar o consentimento a qualquer momento</li>
          </ul>
          <p className="mt-2">
            Para exercer seus direitos, envie um e-mail para{" "}
            <a href={`mailto:${contactEmail}`} className="text-cat-black font-bold underline">{contactEmail}</a>.
            Respondemos em até 15 dias.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">7. Segurança</h2>
          <p>
            Utilizamos conexão HTTPS, banco de dados protegido por senha e controle de acesso para proteger seus dados.
            Em caso de incidente de segurança, você será notificado conforme exigido pela LGPD.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">8. Cookies</h2>
          <p>
            Usamos cookies apenas para manter sua sessão de login e o carrinho de compras.
            Não utilizamos cookies de rastreamento ou publicidade.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-cat-black mb-2">9. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política a qualquer momento. A data de &quot;última atualização&quot; no topo
            indica quando houve mudança. Recomendamos consultar periodicamente.
          </p>
        </section>
      </div>
    </div>
  );
}
