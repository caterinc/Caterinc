import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";

export default async function ContatoPage() {
  const storeNameSetting = await prisma.siteSetting.findUnique({ where: { key: "store_name" } });
  const storeName = storeNameSetting?.value || "Cat Store";

  const [emailSetting, phoneSetting, addressSetting] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "contact_email" } }),
    prisma.siteSetting.findUnique({ where: { key: "contact_phone" } }),
    prisma.siteSetting.findUnique({ where: { key: "contact_address" } }),
  ]);

  const contactEmail = emailSetting?.value || "contato@catstore.com.br";
  const contactPhone = phoneSetting?.value || null;
  const contactAddress = addressSetting?.value || null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-8">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-3xl font-black text-cat-black mb-2">Contato</h1>
      <p className="text-sm text-gray-400 mb-8">Fale com a equipe {storeName}</p>

      <div className="space-y-4">
        {/* Email */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-cat-yellow rounded-xl flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-cat-black" />
          </div>
          <div>
            <p className="font-bold text-cat-black mb-0.5">E-mail</p>
            <a href={`mailto:${contactEmail}`} className="text-sm text-gray-600 hover:text-cat-black transition-colors underline">
              {contactEmail}
            </a>
            <p className="text-xs text-gray-400 mt-1">Respondemos em até 2 dias úteis</p>
          </div>
        </div>

        {/* Phone */}
        {contactPhone && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-cat-yellow rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-cat-black" />
            </div>
            <div>
              <p className="font-bold text-cat-black mb-0.5">Telefone / WhatsApp</p>
              <a href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-cat-black transition-colors underline">
                {contactPhone}
              </a>
            </div>
          </div>
        )}

        {/* Address */}
        {contactAddress && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-cat-yellow rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-cat-black" />
            </div>
            <div>
              <p className="font-bold text-cat-black mb-0.5">Endereço</p>
              <p className="text-sm text-gray-600">{contactAddress}</p>
            </div>
          </div>
        )}

        {/* Business hours */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-cat-yellow rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-cat-black" />
          </div>
          <div>
            <p className="font-bold text-cat-black mb-0.5">Horário de atendimento</p>
            <p className="text-sm text-gray-600">Segunda a sexta: 9h às 18h</p>
            <p className="text-sm text-gray-600">Sábado: 9h às 13h</p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-cat-yellow/10 border border-cat-yellow/30 rounded-2xl">
        <p className="text-sm text-gray-700">
          Para dúvidas sobre <strong>trocas e devoluções</strong>, acesse nossa{" "}
          <Link href="/trocas" className="font-bold text-cat-black underline hover:text-cat-yellow transition-colors">
            política de trocas
          </Link>
          . Para informações sobre privacidade, veja nossa{" "}
          <Link href="/privacidade" className="font-bold text-cat-black underline hover:text-cat-yellow transition-colors">
            política de privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
