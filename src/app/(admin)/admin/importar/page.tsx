"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, Download, FileText, CheckCircle2, XCircle } from "lucide-react";

interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export default function ImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/csv/import", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);

    if (res.ok) {
      setResult(data);
      toast({ title: `${data.created} produto(s) importado(s)!`, variant: "success" });
    } else {
      toast({ title: "Erro na importação", variant: "destructive" });
    }
  };

  const csvTemplate = `name,slug,sku,price,comparePrice,category,description,sizes,colors,stock,isFeatured,tags
"Bota CAT Exemplo","bota-cat-exemplo","CAT-EX01","599.90","799.90","Botas","Descrição do produto","38;39;40;41;42","Preto;Marrom","10;8;6;4;2","false","bota,couro"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-cat-black mb-2">Importar / Exportar CSV</h1>
      <p className="text-gray-500 text-sm mb-8">Importe ou exporte produtos em massa via planilha CSV.</p>

      {/* Export */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Download className="w-5 h-5 text-cat-yellow" />
          Exportar Produtos
        </h2>
        <p className="text-sm text-gray-500 mb-4">Baixe todos os produtos cadastrados em formato CSV.</p>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href="/api/csv/export">
              <Download className="w-4 h-4 mr-2" /> Exportar Todos
            </a>
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <FileText className="w-4 h-4 mr-2" /> Baixar Template
          </Button>
        </div>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cat-yellow" />
          Importar Produtos
        </h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600 space-y-3">
          <div>
            <p className="font-semibold mb-1">✅ Shopify CSV (exportação direta da Shopify)</p>
            <p className="text-xs text-gray-500">Detectado automaticamente. Basta exportar produtos da Shopify e importar aqui.</p>
          </div>
          <div>
            <p className="font-semibold mb-1">📄 Formato próprio:</p>
            <code className="text-xs bg-white border rounded p-2 block overflow-x-auto whitespace-pre">
              {`name, slug, sku, price, comparePrice, category,\ndescription, sizes, colors, stock, isFeatured, tags`}
            </code>
            <ul className="mt-2 space-y-1 text-xs text-gray-500">
              <li>• <strong>sizes</strong> e <strong>colors</strong>: separados por <code>;</code></li>
              <li>• <strong>stock</strong>: separado por <code>;</code>, mapeado com sizes</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400">Produtos com slug já existente são ignorados (não duplicados).</p>
        </div>

        <div
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-cat-yellow transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          {file ? (
            <div>
              <p className="font-semibold text-cat-black">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-600">Clique para selecionar arquivo CSV</p>
              <p className="text-sm text-gray-400 mt-1">ou arraste e solte aqui</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
          />
        </div>

        {file && (
          <Button className="w-full mt-4" onClick={handleImport} disabled={importing}>
            {importing ? "Importando..." : "Importar Produtos"}
          </Button>
        )}

        {result && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">{result.created} produto(s) criado(s)</span>
            </div>
            {result.skipped > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <span className="text-sm">{result.skipped} produto(s) ignorado(s) (slug já existe)</span>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{result.errors.length} erro(s):</span>
                </div>
                <ul className="text-xs text-red-500 space-y-1">
                  {result.errors.slice(0, 10).map((e, i) => (
                    <li key={i} className="truncate max-w-full">{e}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-gray-400 italic">... e mais {result.errors.length - 10} erro(s)</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
