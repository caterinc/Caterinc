"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import {
  Upload, FileText, CheckCircle, XCircle, Trash2, Eye, EyeOff,
  Star, AlertCircle, Download, Package, ChevronDown, X,
} from "lucide-react";

interface ReviewRow {
  product_slug?: string;
  product_name?: string;
  product_link?: string;
  reviewer_name: string;
  rating: number | string;
  comment?: string;
  verified_purchase?: string;
  date?: string;
}

interface StoredReview {
  id: string;
  productId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  verifiedPurchase: boolean;
  isVisible: boolean;
  createdAt: string;
  product?: { name: string; slug: string };
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

function Stars({ value }: { value: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= value ? "#FFCD11" : "#D1D5DB", fontSize: 14 }}>★</span>
      ))}
    </span>
  );
}

export default function AvaliacoesPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Products for selector
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // CSV import state
  const [previewRows, setPreviewRows] = useState<ReviewRow[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null);

  // Reviews list state
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [filterProduct, setFilterProduct] = useState("");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load products for selector
  useEffect(() => {
    fetch("/api/produtos?limit=200")
      .then((r) => r.json())
      .then((data) => {
        const list = (Array.isArray(data) ? data : data.products || []) as ProductOption[];
        setProducts(list.map((p: ProductOption) => ({ id: p.id, name: p.name, slug: p.slug })));
      })
      .catch(() => {});
  }, []);

  const normalizeHeader = (h: string): string => {
    const clean = h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
    const aliases: Record<string, string> = {
      // product_slug
      product_slug: "product_slug", slug: "product_slug", produto: "product_slug",
      produto_slug: "product_slug", item_slug: "product_slug",
      handle: "product_slug", produto_handle: "product_slug",
      // product_name (new)
      product_name: "product_name", nome_produto: "product_name",
      product_title: "product_name", title: "product_name",
      produto_nome: "product_name", nome: "product_name",
      // product_link (new)
      product_link: "product_link", link: "product_link",
      url: "product_link", product_url: "product_link",
      produto_link: "product_link", produto_url: "product_link",
      // reviewer_name
      reviewer_name: "reviewer_name", name: "reviewer_name",
      reviewer: "reviewer_name", avaliador: "reviewer_name", cliente: "reviewer_name",
      author: "reviewer_name", author_name: "reviewer_name",
      // rating
      rating: "rating", nota: "rating", avaliacao: "rating", avalia__o: "rating",
      stars: "rating", estrelas: "rating", score: "rating", grade: "rating",
      // comment
      comment: "comment", comentario: "comment", coment_rio: "comment",
      texto: "comment", review: "comment", body: "comment", mensagem: "comment",
      // verified_purchase
      verified_purchase: "verified_purchase", verificado: "verified_purchase",
      compra_verificada: "verified_purchase", verified: "verified_purchase",
      compra_confirmada: "verified_purchase",
      // date
      date: "date", data: "date", created_at: "date", created: "date", data_avaliacao: "date",
    };
    return aliases[clean] || clean;
  };

  const parseLine = (line: string, delimiter: string): string[] => {
    const cols: string[] = [];
    let inQ = false;
    let cur = "";
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === delimiter && !inQ) { cols.push(cur.trim()); cur = ""; }
      else if (ch !== "\r") { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  };

  const parseCSV = (rawText: string): ReviewRow[] => {
    const text = rawText.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headerLine = lines[0];
    const delimiter = (headerLine.split(";").length > headerLine.split(",").length) ? ";" : ",";
    const rawHeaders = parseLine(headerLine, delimiter).map((h) => h.replace(/^"|"$/g, ""));
    const headers = rawHeaders.map(normalizeHeader);
    const rows: ReviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = parseLine(line, delimiter).map((c) => c.replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
      rows.push(row as unknown as ReviewRow);
    }
    return rows;
  };

  const handleFiles = (files: File[]) => {
    if (files.length === 0) return;
    setImportResult(null);
    setFileNames(files.map((f) => f.name));
    const allRows: ReviewRow[] = [];
    let loaded = 0;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // If file has no product column, inject product_name from filename (strip .csv)
        const rows = parseCSV(text);
        const hasProduct = rows.some((r) => r.product_slug || r.product_name || r.product_link);
        if (!hasProduct && !selectedProduct) {
          const nameFromFile = file.name.replace(/\.csv$/i, "").replace(/[-_]/g, " ").trim();
          rows.forEach((r) => { if (!r.product_name) r.product_name = nameFromFile; });
        }
        allRows.push(...rows);
        loaded++;
        if (loaded === files.length) setPreviewRows([...allRows]);
      };
      reader.readAsText(file, "UTF-8");
    });
  };

  const handleFile = (file: File) => handleFiles([file]);

  const handleImport = async () => {
    if (!previewRows.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/reviews/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: previewRows,
          selectedProductId: selectedProduct?.id || undefined,
        }),
      });
      const data = await res.json();
      setImporting(false);
      if (res.ok) {
        setImportResult(data);
        if (data.created === 0) {
          toast({ title: "Nenhuma avaliação importada", description: data.errors?.[0] || "Verifique os erros abaixo", variant: "destructive" });
        } else {
          toast({ title: `${data.created} avaliação(ões) importada(s) com sucesso!` });
          setPreviewRows([]);
          setFileNames([]);
          loadReviews();
          startTransition(() => router.refresh());
        }
      } else {
        toast({ title: `Erro ${res.status}`, description: data.error || "Falha ao importar avaliações", variant: "destructive" });
      }
    } catch (err) {
      setImporting(false);
      toast({ title: "Erro de conexão", description: String(err), variant: "destructive" });
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    const res = await fetch("/api/reviews/all");
    if (res.ok) setReviews(await res.json());
    setLoadingReviews(false);
  };

  useEffect(() => { loadReviews(); }, []);

  const toggleVisibility = async (id: string, current: boolean) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !current }),
    });
    if (res.ok) setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isVisible: !current } : r));
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Avaliação excluída", variant: "success" });
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.slug.includes(productSearch.toLowerCase())
  );

  const filteredReviews = filterProduct
    ? reviews.filter((r) =>
        r.product?.name.toLowerCase().includes(filterProduct.toLowerCase()) ||
        r.product?.slug.includes(filterProduct.toLowerCase()) ||
        r.reviewerName.toLowerCase().includes(filterProduct.toLowerCase())
      )
    : reviews;

  const getRowProductLabel = (row: ReviewRow) =>
    row.product_slug || row.product_name || row.product_link || (selectedProduct ? `→ ${selectedProduct.name}` : "—");

  const csvTemplate = `reviewer_name,rating,comment,verified_purchase,date
João Silva,5,"Produto excelente! Muito confortável.",true,2024-03-15
Maria Oliveira,4,"Ótima qualidade, entrega rápida.",false,2024-03-20`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_avaliacoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-cat-black">Avaliações</h1>
          <p className="text-gray-500 text-sm mt-0.5">{reviews.length} avaliações cadastradas</p>
        </div>
      </div>

      {/* CSV Import */}
      <div className="bg-white rounded-xl border p-6 mb-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-cat-black">Importar avaliações via CSV</h2>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-cat-black border rounded-lg px-3 py-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar modelo CSV
          </button>
        </div>

        {/* Product selector (optional) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Produto de destino{" "}
            <span className="text-gray-400 font-normal">(opcional — deixe vazio se o CSV já tem o produto)</span>
          </label>
          <div className="relative" ref={productDropdownRef}>
            <div
              className="flex items-center gap-2 border rounded-xl px-3 py-2.5 cursor-pointer hover:border-cat-yellow transition-colors bg-white"
              onClick={() => { setShowProductDropdown(!showProductDropdown); setProductSearch(""); }}
            >
              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {selectedProduct ? (
                <span className="flex-1 text-sm text-cat-black font-medium truncate">{selectedProduct.name}</span>
              ) : (
                <span className="flex-1 text-sm text-gray-400">Selecionar produto (opcional)...</span>
              )}
              {selectedProduct ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedProduct(null); setShowProductDropdown(false); }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {showProductDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-xl z-20 max-h-64 flex flex-col">
                <div className="p-2 border-b">
                  <input
                    autoFocus
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cat-yellow"
                  />
                </div>
                <div className="overflow-y-auto flex-1">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">Nenhum produto encontrado</p>
                  ) : (
                    filteredProducts.slice(0, 50).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setShowProductDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${selectedProduct?.id === p.id ? "bg-cat-yellow/10 font-semibold" : ""}`}
                      >
                        <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedProduct && (
            <p className="text-xs text-blue-600 mt-1.5 ml-1">
              Avaliações sem produto identificado no CSV serão atribuídas a: <strong>{selectedProduct.name}</strong>
            </p>
          )}
        </div>

        {/* Format hint */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono">
          <p className="font-semibold text-gray-700 mb-1 font-sans">Colunas reconhecidas pelo sistema:</p>
          <p><span className="text-blue-600">product_slug</span> ou <span className="text-blue-600">product_name</span> ou <span className="text-blue-600">link</span> — identifica o produto</p>
          <p><span className="text-blue-600">reviewer_name</span>, <span className="text-blue-600">rating</span> (1-5), <span className="text-blue-600">comment</span>, <span className="text-blue-600">verified_purchase</span>, <span className="text-blue-600">date</span></p>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cat-yellow transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
            if (files.length) handleFiles(files);
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) handleFiles(files);
              e.target.value = "";
            }}
          />
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          {fileNames.length > 0 ? (
            <div className="space-y-0.5">
              {fileNames.map((n, i) => (
                <p key={i} className="text-sm font-semibold text-cat-black truncate max-w-xs mx-auto">{n}</p>
              ))}
              {fileNames.length > 1 && (
                <p className="text-xs text-gray-400 mt-1">{fileNames.length} arquivos selecionados</p>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-600">Clique ou arraste um ou mais arquivos CSV</p>
              <p className="text-xs text-gray-400 mt-1">Múltiplos arquivos: o nome do arquivo vira o produto se não houver coluna de produto</p>
            </>
          )}
        </div>

        {/* Preview */}
        {previewRows.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-cat-black">
                {previewRows.length} linha(s) encontrada(s)
                {fileNames.length > 1 && <span className="text-gray-400 ml-1">em {fileNames.length} arquivos</span>}
                {selectedProduct && <span className="text-blue-600 ml-2">→ {selectedProduct.name}</span>}
              </p>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-cat-yellow text-cat-black text-sm font-bold rounded-lg hover:bg-yellow-300 disabled:opacity-60 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {importing ? "Importando..." : "Confirmar importação"}
              </button>
            </div>
            <div className="border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Produto</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Nome</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Nota</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Comentário</th>
                    <th className="text-left px-3 py-2 text-gray-500 font-semibold">Verificado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-500 max-w-[140px] truncate">
                        {getRowProductLabel(row)}
                      </td>
                      <td className="px-3 py-2">{row.reviewer_name}</td>
                      <td className="px-3 py-2"><Stars value={Number(row.rating)} /></td>
                      <td className="px-3 py-2 max-w-[200px] truncate">{row.comment || "—"}</td>
                      <td className="px-3 py-2">
                        {String(row.verified_purchase).toLowerCase() === "true"
                          ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import result */}
        {importResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span><strong>{importResult.created}</strong> avaliação(ões) importada(s) com sucesso</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="bg-orange-50 px-4 py-3 rounded-lg">
                <p className="text-sm font-semibold text-orange-700 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  {importResult.errors.length} erro(s):
                </p>
                <ul className="text-xs text-orange-600 space-y-0.5">
                  {importResult.errors.map((err, i) => <li key={i}>• {err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reviews list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-cat-black">Avaliações cadastradas</h2>
          <div className="ml-auto">
            <input
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              placeholder="Filtrar por produto ou nome..."
              className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cat-yellow w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Avaliador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nota</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Comentário</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loadingReviews ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              ) : filteredReviews.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">
                  <Star className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  Nenhuma avaliação encontrada
                </td></tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className={`hover:bg-gray-50 ${!review.isVisible ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs text-gray-600">{review.product?.name || review.productId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{review.reviewerName}</p>
                        {review.verifiedPurchase && <span className="text-xs text-green-600">✓ Verificado</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Stars value={review.rating} /></td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-gray-600 truncate">{review.comment || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleVisibility(review.id, review.isVisible)}
                          title={review.isVisible ? "Ocultar" : "Mostrar"}
                          className="text-gray-400 hover:text-cat-black transition-colors"
                        >
                          {review.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
