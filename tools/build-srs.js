const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, HeadingLevel, AlignmentType, ImageRun,
} = require('docx');

const SRC = path.join(__dirname, '..', 'docs', 'SRS-OWERU-Phase-One.md');
const OUT = path.join(__dirname, '..', 'docs', 'SRS-OWERU-Phase-One-v2.docx');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

const md = fs.readFileSync(SRC, 'utf8');
const lines = md.split(/\r?\n/);

function parseInline(text) {
  const runs = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`|([^*`]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[1]) runs.push(new TextRun({ text: m[1], bold: true }));
    else if (m[2]) runs.push(new TextRun({ text: m[2], font: 'Consolas' }));
    else if (m[3]) runs.push(new TextRun({ text: m[3] }));
  }
  if (runs.length === 0) runs.push(new TextRun({ text }));
  return runs;
}

function cellFromText(text) {
  return new TableCell({
    children: [new Paragraph({ children: parseInline(text || '') })],
  });
}

function makeTable(rows) {
  const header = rows[0].map((c) =>
    new TableCell({
      children: [new Paragraph({ children: parseInline(c) })],
      shading: { fill: 'D9E2F3' },
    })
  );
  const body = rows.slice(1).map((r) => new TableRow({ children: r.map(cellFromText) }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: header, tableHeader: true }), ...body],
  });
}

const children = [];
let i = 0;
let listCounter = 0;

// Use applyParagraphFormatting? Not available; handle lists manually.
while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  if (trimmed === '') { i++; continue; }

  if (trimmed.startsWith('### ')) {
    children.push(new Paragraph({ text: trimmed.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 160 } }));
    i++;
  } else if (trimmed.startsWith('## ')) {
    children.push(new Paragraph({ text: trimmed.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
    i++;
  } else if (trimmed.startsWith('# ')) {
    children.push(new Paragraph({ text: trimmed.slice(2), heading: HeadingLevel.HEADING_1, spacing: { before: 240 } }));
    i++;
  } else if (trimmed.startsWith('> ')) {
    children.push(new Paragraph({ children: parseInline(trimmed.slice(2)), indent: { left: 300 }, italic: true }));
    i++;
  } else if (trimmed.startsWith('---')) {
    i++;
  } else if (trimmed.startsWith('|')) {
    // gather contiguous table lines
    const rows = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      const cells = lines[i].trim().split('|').slice(1, -1).map((c) => c.trim());
      rows.push(cells);
      i++;
    }
    if (rows.length >= 2) {
      const dataRows = rows.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
      children.push(makeTable(dataRows));
    }
  } else if (trimmed.startsWith('- ')) {
    children.push(new Paragraph({ children: parseInline(trimmed.slice(2)), bullet: { level: 0 } }));
    i++;
  } else if (trimmed.startsWith('![')) {
    // image marker: ![Alt](assets/file.png)
    const mImg = /!\[[^\]]*\]\(([^)]+)\)/.exec(trimmed);
    if (mImg) {
      const rel = mImg[1];
      const abs = path.join(DOCS_DIR, rel);
      const data = fs.readFileSync(abs);
      const ext = path.extname(rel).toLowerCase();
      const type = ext === '.png' ? 'png' : ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png';
      const dims = {
        'workflow.png': { w: 1640, h: 620 },
        'architecture.png': { w: 1400, h: 760 },
      };
      const base = path.basename(rel);
      const dim = dims[base] || { w: 1400, h: 700 };
      const W = 620;
      const H = Math.round((W * dim.h) / dim.w);
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data, transformation: { width: W, height: H },
              type,
            }),
          ],
        })
      );
    }
    i++;
  } else if (/^\d+\.\s/.test(trimmed)) {
    listCounter++;
    children.push(new Paragraph({
      children: parseInline(trimmed),
      numbering: { reference: 'num', level: 0 },
    }));
    i++;
  } else {
    children.push(new Paragraph({ children: parseInline(trimmed) }));
    i++;
  }
}

const doc = new Document({
  numbering: {
    config: [{ reference: 'num', levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT }] }],
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
  },
  sections: [{
    properties: {},
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('OK -> ', OUT, '(', buf.length, 'bytes )');
}).catch((e) => { console.error('FAIL', e); process.exit(1); });
