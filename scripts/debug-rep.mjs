import { readFileSync, existsSync } from "fs";

const pdfPath = process.argv[2];
if (!pdfPath || !existsSync(pdfPath)) {
  console.error("Usage: npx tsx scripts/debug-rep.mjs <path-to.pdf>");
  process.exit(1);
}

const buffer = readFileSync(pdfPath);
const { extractGrilleFromBuffer } = await import("../src/lib/devis/extract-grid.ts");
const { analyserDevis } = await import("../src/lib/devis/parser.ts");
const { extractPosteReference } = await import("../src/lib/devis-parser/poste-references.ts");
const { extractAmounts, splitGluedAmounts } = await import("../src/lib/devis-parser/numbers.ts");

const { grille, pdfPlainText } = await extractGrilleFromBuffer(buffer, "pdf");

const repInPlain = (pdfPlainText ?? "").match(/REP[^\n]{0,30}/gi) ?? [];
const repInGrille = [];
for (let i = 0; i < grille.length; i++) {
  for (const cell of grille[i]) {
    if (/REP/i.test(cell)) repInGrille.push({ row: i, cell: cell.slice(0, 120) });
  }
}

console.log("grille rows:", grille.length, "avg cols:", grille.reduce((s, r) => s + r.filter((c) => c.trim()).length, 0) / grille.length);
console.log("REP in pdf-parse:", repInPlain.length, repInPlain.slice(0, 5));
console.log("REP in grille:", repInGrille.length, repInGrille.slice(0, 8));

const amt4724 = [];
for (let i = 0; i < grille.length; i++) {
  for (const cell of grille[i]) {
    const amounts = extractAmounts(splitGluedAmounts(cell));
    if (amounts.some((a) => Math.abs(a - 4724.95) < 0.05)) {
      amt4724.push({ row: i, cell: cell.slice(0, 100), amounts });
    }
  }
}
console.log("rows with 4724.95:", amt4724.length, amt4724.slice(0, 5));

if (pdfPlainText) {
  const lines = pdfPlainText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    if (extractAmounts(splitGluedAmounts(lines[i])).some((a) => Math.abs(a - 4724.95) < 0.05)) {
      const above = lines.slice(Math.max(0, i - 8), i);
      console.log("pdf-parse amount line", i, ":", lines[i]);
      console.log("  above:", above);
      break;
    }
  }
}

const result = analyserDevis(grille, { pdfPlainText, pdfImperfect: true });
const p1 = result.postes.find((p) => p.type_ligne === "poste" && Math.abs((p.prix_total ?? 0) - 4724.95) < 0.05);
console.log("poste 4724.95:", JSON.stringify(p1, null, 2));
