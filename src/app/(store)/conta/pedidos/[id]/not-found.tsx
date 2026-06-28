import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
      <p className="text-gray-500 mb-6">Este pedido não existe ou você não tem permissão para acessá-lo.</p>
      <Button asChild><Link href="/conta/pedidos">Ver Meus Pedidos</Link></Button>
    </div>
  );
}
