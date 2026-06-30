"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";

interface CardBrickProps {
  amount: number;
  onSubmit: (formData: unknown) => Promise<void>;
  onError?: () => void;
}

export function CardBrick({ amount, onSubmit, onError }: CardBrickProps) {
  const [ready, setReady] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/payments/config")
      .then((r) => r.json())
      .then(({ publicKey }: { publicKey: string }) => {
        if (!publicKey) { setNotConfigured(true); return; }
        initMercadoPago(publicKey, { locale: "pt-BR" });
        setReady(true);
      })
      .catch(() => setNotConfigured(true));
  }, []);

  if (notConfigured) {
    return (
      <div className="py-6 px-4 text-center space-y-2">
        <p className="text-sm font-semibold text-gray-700">Pagamento por cartão indisponível</p>
        <p className="text-xs text-gray-500">Use o <strong>PIX</strong> para finalizar seu pedido agora mesmo.</p>
        <p className="text-[10px] text-gray-400 mt-3">
          (Admin: configure <code>MP_PUBLIC_KEY</code> no Vercel para ativar o cartão.)
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <CardPayment
      initialization={{ amount }}
      onSubmit={onSubmit}
      onError={onError}
      customization={{
        paymentMethods: { minInstallments: 1, maxInstallments: 12 },
        visual: {
          style: {
            customVariables: {
              baseColor: "#000000",
              baseColorFirstVariant: "#FFCD11",
              borderRadiusFull: "12px",
            },
          },
        },
      }}
    />
  );
}
