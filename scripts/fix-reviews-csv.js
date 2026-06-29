/**
 * fix-reviews-csv.js
 * Uso: node scripts/fix-reviews-csv.js "caminho/para/arquivo.csv"
 * Gera: arquivo_fixed.csv com cabeçalhos e datas corretos
 */
const fs = require("fs");

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Uso: node scripts/fix-reviews-csv.js \"caminho/para/arquivo.csv\"");
  process.exit(1);
}
const outputFile = inputFile.replace(/\.csv$/i, "_fixed.csv");

const raw = fs.readFileSync(inputFile);
const text = raw.toString("utf8").replace(/^﻿/, ""); // remove BOM
const lines = text.trim().split(/\r?\n/);
if (lines.length < 2) { console.error("Arquivo vazio."); process.exit(1); }

const firstLine = lines[0];
const delim = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

function parseLine(line) {
  const cols = [];
  let inQ = false, cur = "";
  for (const c of line) {
    if (c === '"') { inQ = !inQ; }
    else if (c === delim && !inQ) { cols.push(cur.trim()); cur = ""; }
    else if (c !== "\r") { cur += c; }
  }
  cols.push(cur.trim());
  return cols;
}

const ALIASES = {
  nome: "reviewer_name", name: "reviewer_name", reviewer_name: "reviewer_name",
  avaliador: "reviewer_name", cliente: "reviewer_name", author: "reviewer_name",
  "comentário": "comment", comentario: "comment", comment: "comment",
  coment_rio: "comment", texto: "comment", review: "comment",
  estrelas: "rating", rating: "rating", nota: "rating", stars: "rating",
  link: "product_link", url: "product_link", product_link: "product_link",
  produto_link: "product_link",
  data: "date", date: "date", created_at: "date",
  verificado: "verified_purchase", verified_purchase: "verified_purchase",
  compra_verificada: "verified_purchase",
  produto: "product_slug", slug: "product_slug", product_slug: "product_slug",
  nome_produto: "product_name", product_name: "product_name",
};

function normalizeHeader(h) {
  const clean = h.toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  return ALIASES[clean] || ALIASES[h.toLowerCase().trim()] || clean;
}

function fixDate(d) {
  if (!d) return "";
  // DD/MM/YYYY → YYYY-MM-DD
  const m = d.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // Already ISO or other format – return as-is
  return d.trim();
}

const rawHeaders = parseLine(firstLine).map(h => h.replace(/^"|"$/g, ""));
const headers = rawHeaders.map(normalizeHeader);

const outputLines = [headers.map(h => `"${h}"`).join(",")];
let rowCount = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const cols = parseLine(lines[i]).map(c => c.replace(/^"|"$/g, ""));
  const row = {};
  headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
  if (row.date) row.date = fixDate(row.date);
  outputLines.push(headers.map(h => `"${(row[h] || "").replace(/"/g, '""')}"`).join(","));
  rowCount++;
}

fs.writeFileSync(outputFile, outputLines.join("\n"), "utf8");
console.log(`\n✓ Arquivo gerado: ${outputFile}`);
console.log(`  ${rowCount} avaliações processadas`);
console.log(`  Cabeçalhos detectados: ${rawHeaders.join(", ")}`);
console.log(`  Cabeçalhos convertidos: ${headers.join(", ")}`);
