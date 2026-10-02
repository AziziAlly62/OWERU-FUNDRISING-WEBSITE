const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outDir = path.join(__dirname, '..', 'docs', 'assets');
fs.mkdirSync(outDir, { recursive: true });

// ---------- Shared helpers ----------
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function rect(x, y, w, h, fill, stroke, rx) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx ?? 8}" fill="${fill}" stroke="${stroke ?? 'none'}" stroke-width="1.5"/>`;
}
function text(x, y, str, opts = {}) {
  const size = opts.size ?? 15;
  const color = opts.color ?? '#1f2937';
  const weight = opts.weight ?? 500;
  const anchor = opts.anchor ?? 'middle';
  const lines = Array.isArray(str) ? str : [str];
  let out = '';
  lines.forEach((ln, idx) => {
    out += `<text x="${x}" y="${y + idx * (size + 3) - (lines.length - 1) * (size + 3) / 2}" font-family="Segoe UI, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(ln)}</text>`;
  });
  return out;
}
function arrow(x1, y1, x2, y2, color = '#64748b') {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const hx = 9;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" marker-end="url(#arr)"/>
  <polygon points="${x2},${y2} ${x2 - ux * hx + px * 4},${y2 - uy * hx + py * 4} ${x2 - ux * hx - px * 4},${y2 - uy * hx - py * 4}" fill="${color}"/>`;
}
function arrowDef(color = '#64748b') {
  return `<marker id="arr" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0,0 L8,3 L0,6 z" fill="${color}"/>
  </marker>`;
}

// ---------- WORKFLOW DIAGRAM (Section 17) ----------
function workflowSvg() {
  const stages = [
    { label: 'Applicant submits request', color: '#e0f2fe', border: '#0284c7', sub: 'Draft / Submitted' },
    { label: 'Endorsement by Church / Org', color: '#dcfce7', border: '#16a34a', sub: 'Endorsement Pending' },
    { label: 'Foundation review', color: '#fef9c3', border: '#ca8a04', sub: 'Approve / Decline' },
    { label: 'Items priced & published', color: '#e9d5ff', border: '#9333ea', sub: 'Published' },
    { label: 'Donors fund items', color: '#fee2e2', border: '#dc2626', sub: '60-day window' },
  ];
  const proc = [
    { label: 'Payment confirmed', color: '#fee2e2', border: '#dc2626', sub: 'Fully Funded' },
    { label: 'Supplier procurement', color: '#f1f5f9', border: '#64748b', sub: 'Quote / Invoice' },
    { label: 'Delivery & verification', color: '#f1f5f9', border: '#64748b', sub: 'Photos / Serial' },
    { label: 'Equipment register', color: '#e0f2fe', border: '#0284c7', sub: 'Asset record' },
    { label: 'Reports & ledger', color: '#dcfce7', border: '#16a34a', sub: '30 / 90 day' },
  ];
  const W = 250, H = 110, GAP = 40, START_X = 40, START_Y = 150;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="620" viewBox="0 0 1640 620">
    <defs>${arrowDef()}</defs>
    <rect width="1640" height="620" fill="#ffffff"/>`;
  // title
  out += text(40, 45, 'OWERU Funding Lifecycle (Section 17 - End-to-End Workflow)', { size: 20, weight: 700, anchor: 'start', color: '#0f172a' });
  out += text(40, 70, 'The workflow separates approval, donor funding, procurement, delivery verification and post-delivery monitoring.', { size: 14, anchor: 'start', color: '#475569' });

  // Stage 1 row (pre-approval)
  let x = START_X, y = START_Y;
  stages.forEach((s, idx) => {
    out += rect(x, y, W, H, s.color, s.border);
    out += rect(x, y, W, 8, s.color, s.border);
    out += text(x + W / 2, y + 42, s.label.replace(' & ', ' &\n'), { size: 14, weight: 600 });
    out += text(x + W / 2, y + 66 + (s.label.includes('&') ? 8 : 0), s.sub, { size: 12, color: '#475569' });
    if (idx < stages.length - 1) out += arrow(x + W, y + H / 2, x + W + GAP, y + H / 2);
    x += W + GAP;
  });
  // down arrow
  const midRow2Start = START_X;
  const firstX = START_X + (W + GAP) * 2 + (W / 2);
  const secondX = START_X + (W + GAP) * 2 + (W / 2);
  const downY = y + H + 45;
  out += arrow(START_X + (W + GAP) * 0 + W / 2, y + H, START_X + (W + GAP) * 0 + W / 2, downY, '#0284c7');
  out += arrow(START_X + (W + GAP) * 4 + W / 2, y + H, START_X + (W + GAP) * 4 + W / 2, downY, '#0284c7');

  // Stage 2 row (procurement) - full width boxes
  const row2y = downY + 20;
  const boxW = 300, boxH = 110, gap2 = 28;
  const total = 5 * boxW + 4 * gap2;
  let x2 = (1640 - total) / 2;
  proc.forEach((s, idx) => {
    out += rect(x2, row2y, boxW, boxH, s.color, s.border);
    out += text(x2 + boxW / 2, row2y + 42, s.label, { size: 14, weight: 600 });
    out += text(x2 + boxW / 2, row2y + 68, s.sub, { size: 12, color: '#475569' });
    if (idx < proc.length - 1) out += arrow(x2 + boxW, row2y + boxH / 2, x2 + boxW + gap2, row2y + boxH / 2);
    x2 += boxW + gap2;
  });

  // Final result band
  out += rect(1640 / 2 - 260, row2y + boxH + 60, 520, 70, '#14b8a6', '#0f766e');
  out += text(1640 / 2, row2y + boxH + 92, 'Equipment funded, delivered, verified & monitored', { size: 16, weight: 700, color: '#ffffff' });
  out += text(1640 / 2, row2y + boxH + 115, 'Full traceability from request to asset & reporting', { size: 12, color: '#ecfdf5' });
  out += arrow(1640 / 2, row2y + boxH, 1640 / 2, row2y + boxH + 60, '#0f766e');

  out += `</svg>`;
  return out;
}

// ---------- ARCHITECTURE DIAGRAM (Section 18) ----------
function architectureSvg() {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="760" viewBox="0 0 1400 760">
    <defs>${arrowDef('#64748b')}</defs>
    <rect width="1400" height="760" fill="#ffffff"/>`;
  out += text(40, 45, 'OWERU Platform - System Architecture (Section 18)', { size: 20, weight: 700, anchor: 'start', color: '#0f172a' });
  out += text(40, 70, 'React frontend + Laravel REST API + PostgreSQL + controlled file storage + external payment rails.', { size: 14, anchor: 'start', color: '#475569' });

  const cx = 700;

  // ---- Client layer ----
  out += text(cx, 130, 'CLIENT LAYER', { size: 14, weight: 700, color: '#475569' });
  const clientW = 1150, clientH = 130, clientX = 125, clientY = 145;
  out += rect(clientX, clientY, clientW, clientH, '#f8fafc', '#cbd5e1');
  const browsers = ['Public Website', 'Applicant', 'Donor', 'Supplier', 'Recipient', 'Admin'];
  const bw = 170, bg = 12;
  browsers.forEach((b, i) => {
    const bx = clientX + 20 + i * (bw + bg);
    out += rect(bx, clientY + 25, bw, clientH - 50, '#e0f2fe', '#0284c7');
    out += text(bx + bw / 2, clientY + 62, b, { size: 14, weight: 600 });
    out += text(bx + bw / 2, clientY + 90, 'React (SPA)', { size: 12, color: '#0369a1' });
  });

  // Arrow down
  out += arrow(cx, clientY + clientH, cx, clientY + clientH + 40, '#0284c7');

  // ---- API layer ----
  out += text(cx, clientY + clientH + 55, 'API / BACKEND LAYER', { size: 14, weight: 700, color: '#475569' });
  const apiW = 900, apiH = 170, apiX = 250, apiY = clientY + clientH + 70;
  out += rect(apiX, apiY, apiW, apiH, '#f8fafc', '#cbd5e1');
  const apis = ['Auth & RBAC', 'Requests', 'Funding & Donations', 'Procurement', 'Equipment & Reports', 'Ledger & Audit'];
  const aw = 135, ag = 12;
  apis.forEach((a, i) => {
    const ax = apiX + 20 + i * (aw + ag);
    out += rect(ax, apiY + 25, aw, apiH - 70, '#dcfce7', '#16a34a');
    out += text(ax + aw / 2, apiY + 52, a, { size: 13, weight: 600 });
  });
  out += text(cx, apiY + apiH - 15, 'Laravel REST API  (validation, ORM, queues, notifications)', { size: 13, weight: 600, color: '#166534' });

  // label storage/security note
  out += text(cx, apiY + apiH + 30, 'HTTPS/TLS · CSRF · Input validation · Rate limiting · Server-side authorization', { size: 12, color: '#64748b' });

  // ---- Data layer ----
  out += arrow(cx, apiY + apiH + 40, cx, apiY + apiH + 70, '#64748b');
  out += text(cx, apiY + apiH + 80, 'DATA LAYER', { size: 14, weight: 700, color: '#475569' });
  const dataW = 1120, dataH = 170, dataX = 140, dataY = apiY + apiH + 95;
  out += rect(dataX, dataY, dataW, dataH, '#f8fafc', '#cbd5e1');
  const boxes = [
    { t: 'PostgreSQL', s: 'users, requests, items,\ndonations, equipment\nreports, audit_logs', f: '#fef9c3', b: '#ca8a04' },
    { t: 'File Storage', s: 'photos, documents,\nevidence, reports\n(access-controlled)', f: '#e9d5ff', b: '#9333ea' },
    { t: 'Payments Rail', s: 'external M-Pesa / bank\n(redirect or manual\nconfirmation)', f: '#fee2e2', b: '#dc2626' },
    { t: 'Backups & Monitoring', s: 'automated backups\nrestore testing\nuptime monitoring', f: '#f1f5f9', b: '#64748b' },
  ];
  const dw = 255, dg = 20;
  boxes.forEach((b, i) => {
    const bx = dataX + 20 + i * (dw + dg);
    out += rect(bx, dataY + 25, dw, dataH - 50, b.f, b.b);
    out += text(bx + dw / 2, dataY + 55, b.t, { size: 14, weight: 700 });
    out += text(bx + dw / 2, dataY + 78, b.s, { size: 12, color: '#334155' });
  });

  out += `</svg>`;
  return out;
}

async function render(name, svg) {
  const png = path.join(outDir, name + '.png');
  await sharp(Buffer.from(svg)).png().toFile(png);
  console.log('PNG ->', png);
}

(async () => {
  await render('workflow', workflowSvg());
  await render('architecture', architectureSvg());
})();
