const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const GOLD = rgb(201 / 255, 168 / 255, 76 / 255);
const DARK = rgb(0.12, 0.12, 0.12);
const GRAY = rgb(0.45, 0.45, 0.45);
const BORDER = rgb(0.82, 0.82, 0.82);
const BOX_BG = rgb(0.97, 0.97, 0.97);

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

function wrapText(text, font, size, maxWidth) {
  const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

async function gerarPdfContrato(dados, fetchLogo) {
  const {
    numero, dataStr, nome, cnpj, tel, endereco, resp,
    itens, total, forma, obs, prazo, garantia
  } = dados;

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let logoImage = null;
  try {
    const buf = await fetchLogo();
    if (buf) logoImage = await pdfDoc.embedJpg(buf);
  } catch (e) { /* segue sem logo */ }

  const pages = [];
  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H - MARGIN;

  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN;
  }

  function ensureSpace(h) {
    if (y - h < MARGIN + 34) newPage();
  }

  function paragraph(text, size, font, color, x, maxWidth, lineHeight) {
    const lines = wrapText(text, font, size, maxWidth);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
    }
  }

  function tituloClausula(texto) {
    ensureSpace(28);
    page.drawText(texto, { x: MARGIN, y, size: 11, font: fontBold, color: DARK });
    y -= 18;
  }

  // ---------------- HEADER ----------------
  const headerTop = y;
  if (logoImage) {
    const logoSize = 54;
    const dims = logoImage.scale(1);
    const ratio = dims.width / dims.height;
    const lw = logoSize * Math.min(ratio, 1);
    const lh = logoSize / Math.max(ratio, 1);
    page.drawImage(logoImage, { x: MARGIN, y: headerTop - logoSize + 6, width: lw || logoSize, height: lh || logoSize });
  }
  const textX = logoImage ? MARGIN + 66 : MARGIN;
  page.drawText('SD VIDROS', { x: textX, y: headerTop - 6, size: 19, font: fontBold, color: DARK });
  page.drawText('Vidraçaria, Esquadrias de Alumínio e Soluções em Vidro', { x: textX, y: headerTop - 23, size: 8.5, font: fontRegular, color: GRAY });
  page.drawText('WhatsApp: (85) 99611-9824 | Instagram: @sdvidros', { x: textX, y: headerTop - 35, size: 8.5, font: fontRegular, color: GRAY });
  page.drawText('Itaitinga - CE', { x: textX, y: headerTop - 47, size: 8.5, font: fontRegular, color: GRAY });

  const numeroStr = `CONTRATO N° ${numero || ''}`;
  const numeroW = fontBold.widthOfTextAtSize(numeroStr, 11);
  page.drawText(numeroStr, { x: PAGE_W - MARGIN - numeroW, y: headerTop - 6, size: 11, font: fontBold, color: GOLD });
  const dataLine = `Itaitinga - CE, ${dataStr || ''}`;
  const dataW = fontRegular.widthOfTextAtSize(dataLine, 9);
  page.drawText(dataLine, { x: PAGE_W - MARGIN - dataW, y: headerTop - 22, size: 9, font: fontRegular, color: GRAY });

  y = headerTop - 64;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.2, color: GOLD });
  y -= 24;

  // ---------------- TÍTULO ----------------
  const titulo = 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS';
  const tituloW = fontBold.widthOfTextAtSize(titulo, 14);
  page.drawText(titulo, { x: (PAGE_W - tituloW) / 2, y, size: 14, font: fontBold, color: DARK });
  y -= 12;
  page.drawLine({ start: { x: (PAGE_W - 260) / 2, y }, end: { x: (PAGE_W + 260) / 2, y }, thickness: 0.6, color: BORDER });
  y -= 26;

  // ---------------- CAIXA QUALIFICAÇÃO ----------------
  const rows = [
    ['CONTRATADA:', 'SD VIDROS (Itaitinga - CE)'],
    ['WhatsApp / Redes:', '(85) 99611-9824 | Instagram: @sdvidros'],
    ['GAP', ''],
    ['CONTRATANTE:', nome || 'Não informado'],
  ];
  if (cnpj) rows.push(['CPF / CNPJ:', cnpj]);
  rows.push(['WhatsApp / Tel:', tel || 'Não informado']);
  rows.push(['Endereço:', endereco || 'Não informado']);
  if (resp) rows.push(['Responsável:', resp]);

  const boxPadding = 14;
  const labelSize = 9.5;
  const lineH = 16;
  const gapH = 8;
  const labelColW = 118;
  const valueMaxW = CONTENT_W - boxPadding * 2 - labelColW;

  const rowsWrapped = rows.map(([label, value]) => {
    if (label === 'GAP') return { gap: true };
    const valueLines = wrapText(value, fontRegular, labelSize, valueMaxW);
    return { label, valueLines };
  });
  const boxHeight = boxPadding * 2 + rowsWrapped.reduce((acc, r) => acc + (r.gap ? gapH : lineH * r.valueLines.length), 0);

  ensureSpace(boxHeight + 20);
  const boxTop = y;
  page.drawRectangle({ x: MARGIN, y: boxTop - boxHeight, width: CONTENT_W, height: boxHeight, color: BOX_BG, borderColor: BORDER, borderWidth: 1 });
  let rowY = boxTop - boxPadding - 10;
  for (const r of rowsWrapped) {
    if (r.gap) { rowY -= gapH; continue; }
    page.drawText(r.label, { x: MARGIN + boxPadding, y: rowY, size: labelSize, font: fontBold, color: DARK });
    for (const vl of r.valueLines) {
      page.drawText(vl, { x: MARGIN + boxPadding + labelColW, y: rowY, size: labelSize, font: fontRegular, color: DARK });
      rowY -= lineH;
    }
  }
  y = boxTop - boxHeight - 24;

  // ---------------- CLÁUSULAS ----------------
  const pSize = 9.5;
  const pLineH = 14.5;

  tituloClausula('CLÁUSULA 1ª – DO OBJETO');
  paragraph('A CONTRATADA obriga-se a fornecer e instalar ao CONTRATANTE os seguintes serviços de vidraçaria e esquadrias:', pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  y -= 4;
  const itensList = Array.isArray(itens) && itens.length ? itens : [];
  if (!itensList.length) {
    paragraph('(itens não especificados)', pSize, fontRegular, GRAY, MARGIN + 10, CONTENT_W - 10, pLineH);
  } else {
    itensList.forEach((it, i) => {
      let detalhe = '';
      if (it.alt && it.larg) detalhe += ` [Dimensões: ${it.alt}m x ${it.larg}m = ${it.m2 || ''}]`;
      if (it.cor) detalhe += ` [Cor: ${it.cor}]`;
      if (it.bizt) detalhe += ` [Lapidação/Bizotê: ${it.bizt}]`;
      const linha = `${i + 1}. ${it.desc || ''}${detalhe} — Qtd: ${it.qtd || ''} — Total: ${it.total || ''}`;
      paragraph(linha, pSize, fontRegular, DARK, MARGIN + 10, CONTENT_W - 10, pLineH);
    });
  }
  y -= 14;

  tituloClausula('CLÁUSULA 2ª – DO VALOR E FORMA DE PAGAMENTO');
  paragraph(`Valor Total: ${total || 'R$ 0,00'}`, pSize, fontBold, DARK, MARGIN, CONTENT_W, pLineH);
  paragraph(`Forma de Pagamento: ${forma || 'À vista'}`, pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  if (obs) paragraph(`Observações: ${obs}`, pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  y -= 4;
  paragraph('A CONTRATANTE efetuará o pagamento conforme a forma descrita acima.', pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  paragraph('Chave Pix para pagamento: (85) 99760-2237', pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  y -= 14;

  tituloClausula('CLÁUSULA 3ª – DO PRAZO DE ENTREGA E EXECUÇÃO');
  paragraph(`O prazo para execução e entrega dos serviços é de ${prazo || 'a combinar'}, contados a partir da confirmação do pagamento/sinal e da aprovação de todos os detalhes técnicos do projeto.`, pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  y -= 14;

  tituloClausula('CLÁUSULA 4ª – DA GARANTIA');
  paragraph(`A CONTRATADA oferece garantia de ${garantia || '1 (um) ano'} contra defeitos de fabricação e instalação, excluindo danos causados por mau uso, vandalismo, acidentes ou fenômenos naturais.`, pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  y -= 14;

  tituloClausula('CLÁUSULA 5ª – DAS OBRIGAÇÕES DAS PARTES');
  paragraph('5.1 – A CONTRATADA executará os serviços com materiais de alta qualidade e mão de obra especializada;', pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);
  paragraph('5.2 – A CONTRATANTE garantirá o acesso ao local nos dias combinados e efetuará o pagamento acordado.', pSize, fontRegular, DARK, MARGIN, CONTENT_W, pLineH);

  // ---------------- ASSINATURAS ----------------
  ensureSpace(90);
  y -= 30;
  const colW = (CONTENT_W - 30) / 2;
  const line1X = MARGIN;
  const line2X = MARGIN + colW + 30;
  page.drawLine({ start: { x: line1X, y }, end: { x: line1X + colW, y }, thickness: 0.8, color: DARK });
  page.drawLine({ start: { x: line2X, y }, end: { x: line2X + colW, y }, thickness: 0.8, color: DARK });
  y -= 16;
  const centerText = (text, x, w, size, font, color) => {
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: x + (w - tw) / 2, y, size, font, color });
  };
  centerText('SD VIDROS', line1X, colW, 10, fontBold, DARK);
  centerText((nome || 'CLIENTE').toUpperCase(), line2X, colW, 10, fontBold, DARK);
  y -= 14;
  centerText('CONTRATADA', line1X, colW, 8.5, fontRegular, GRAY);
  centerText('CONTRATANTE (CLIENTE)', line2X, colW, 8.5, fontRegular, GRAY);

  // ---------------- RODAPÉ (todas as páginas) ----------------
  pages.forEach((p, i) => {
    const label = `Página ${i + 1} de ${pages.length}`;
    const w = fontRegular.widthOfTextAtSize(label, 8);
    p.drawText(label, { x: (PAGE_W - w) / 2, y: 28, size: 8, font: fontRegular, color: GRAY });
  });

  return pdfDoc.save();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const dados = req.body || {};

    const fetchLogo = async () => {
      const host = req.headers.host;
      const proto = host && host.includes('localhost') ? 'http' : 'https';
      const resp = await fetch(`${proto}://${host}/logo.jpg`);
      if (!resp.ok) return null;
      return Buffer.from(await resp.arrayBuffer());
    };

    const pdfBytes = await gerarPdfContrato(dados, fetchLogo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="contrato-${(dados.numero || '0001').replace('#', '')}.pdf"`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao gerar PDF do contrato.' });
  }
};
