/** Ouvre une fenêtre d'impression / export PDF navigateur */
export function printDocument(title: string, bodyHtml: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; color: #1c1208; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
    .content { white-space: pre-wrap; }
    @media print { body { padding: 1rem; } }
  </style>
</head>
<body>
  ${bodyHtml}
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
  win.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildPrintableDoc(opts: {
  title: string;
  chantier: string;
  date: string;
  extraMeta?: string;
  contenu: string;
}) {
  return `
    <h1>${escapeHtml(opts.title)}</h1>
    <p class="meta">Chantier : ${escapeHtml(opts.chantier)} · ${escapeHtml(opts.date)}${opts.extraMeta ? ` · ${escapeHtml(opts.extraMeta)}` : ""}</p>
    <div class="content">${escapeHtml(opts.contenu)}</div>
    <p class="meta" style="margin-top:2rem">Simply BTP — document généré le ${new Date().toLocaleDateString("fr-FR")}</p>
  `;
}
