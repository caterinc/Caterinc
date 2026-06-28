import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cat-light flex items-center justify-center px-4">
      <div className="text-center">
        <div className="bg-cat-yellow text-cat-black font-black text-5xl px-6 py-2 tracking-widest inline-block mb-6">
          404
        </div>
        <h1 className="text-3xl font-black text-cat-black mb-4">Página não encontrada</h1>
        <p className="text-gray-500 mb-8">A página que você está procurando não existe.</p>
        <Button asChild>
          <Link href="/">Voltar para a Home</Link>
        </Button>
      </div>
    </div>
  );
}
