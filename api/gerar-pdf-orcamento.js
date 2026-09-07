const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const DARK = rgb(0, 0, 0);
const GRAY = rgb(0.35, 0.35, 0.35);

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;

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

async function gerarPdfOrcamento(dados, fetchLogo) {
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

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

  // Moldura retangular externa idêntica ao modelo da imagem 1
  const BORDER_X = 26;
  const BORDER_Y = 26;
  const BORDER_W = PAGE_W - 52;
  const BORDER_H = PAGE_H - 52;
  page.drawRectangle({
    x: BORDER_X,
    y: BORDER_Y,
    width: BORDER_W,
    height: BORDER_H,
    borderColor: DARK,
    borderWidth: 0.8
  });

  const LINE_START_X = BORDER_X;
  const LINE_END_X = BORDER_X + BORDER_W;

  function desenharLinha(yPos) {
    page.drawLine({
      start: { x: LINE_START_X, y: yPos },
      end: { x: LINE_END_X, y: yPos },
      thickness: 0.6,
      color: DARK
    });
  }

  let y = BORDER_Y + BORDER_H - 10;

  // ---------------- 1. CABEÇALHO (LOGO + DADOS DA EMPRESA) ----------------
  const logoTop = y;
  if (logoImage) {
    const logoSize = 42;
    page.drawImage(logoImage, {
      x: 36,
      y: logoTop - logoSize - 2,
      width: logoSize,
      height: logoSize
    });
  }

  const textX = logoImage ? 86 : 36;
  page.drawText('SD VIDROS', { x: textX, y: logoTop - 10, size: 12, font: fontBold, color: DARK });
  page.drawText('RUA JORGE FIGUEIREDO 740 - BARROCAO - ITAITINGA-CE - 61887-000', { x: textX, y: logoTop - 22, size: 6.8, font: fontRegular, color: DARK });
  page.drawText('SDVIDROS2025@GMAIL.COM   CNPJ: 49.226.611/0001-33', { x: textX, y: logoTop - 32, size: 6.8, font: fontRegular, color: DARK });

  // Telefones no canto direito
  page.drawText('(85) 99611-9824', { x: 470, y: logoTop - 12, size: 8, font: fontBold, color: DARK });
  page.drawText('(85) 99760-2237', { x: 470, y: logoTop - 23, size: 8, font: fontBold, color: DARK });
  page.drawText('(85) 98574-9606', { x: 470, y: logoTop - 34, size: 8, font: fontBold, color: DARK });

  y = logoTop - 50;
  desenharLinha(y);

  // ---------------- 2. NÚMERO DO ORÇAMENTO, HORA E DATA ----------------
  y -= 13;
  const numLimpo = String(numero || '000001').replace('#', '').padStart(6, '0');
  page.drawText(`ORCAMENTO ${numLimpo}`, { x: 36, y, size: 9.5, font: fontBold, color: DARK });

  const agora = new Date();
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataFormatada = dataStr || agora.toLocaleDateString('pt-BR');
  const dataHoraTxt = `Hora: ${horaStr}    Data: ${dataFormatada}`;
  const dataHoraW = fontRegular.widthOfTextAtSize(dataHoraTxt, 8);
  page.drawText(dataHoraTxt, { x: LINE_END_X - 10 - dataHoraW, y, size: 8, font: fontRegular, color: DARK });

  y -= 7;
  desenharLinha(y);

  // ---------------- 3. DADOS DO CLIENTE ----------------
  y -= 13;
  page.drawText(`Cliente  : ${String(nome || '').toUpperCase()}`, { x: 36, y, size: 8, font: fontBold, color: DARK });
  if (tel) {
    const telW = fontRegular.widthOfTextAtSize(tel, 8);
    page.drawText(tel, { x: LINE_END_X - 10 - telW, y, size: 8, font: fontRegular, color: DARK });
  }

  y -= 12;
  const endLimpo = String(endereco || '').trim().toUpperCase();
  page.drawText(endLimpo ? `Endereço: ${endLimpo.substring(0, 48)}` : 'Endereço:', { x: 36, y, size: 7.5, font: fontRegular, color: DARK });
  const bairroNome = String(dados.bairro || '').trim().toUpperCase();
  page.drawText(bairroNome ? `Bairro: ${bairroNome}` : 'Bairro:', { x: 370, y, size: 7.5, font: fontRegular, color: DARK });

  y -= 12;
  page.drawText(`CPF/Cnpj: ${cnpj || ''}`, { x: 36, y, size: 7.5, font: fontRegular, color: DARK });
  page.drawText(`Cpl: ${dados.apto || ''}`, { x: 230, y, size: 7.5, font: fontRegular, color: DARK });
  const cidadeNome = String(dados.cidade || '').trim().toUpperCase();
  page.drawText(cidadeNome ? `Cidade: ${cidadeNome}` : 'Cidade:', { x: 330, y, size: 7.5, font: fontRegular, color: DARK });
  page.drawText('UF: CE', { x: 470, y, size: 7.5, font: fontRegular, color: DARK });
  page.drawText('CEP:', { x: 515, y, size: 7.5, font: fontRegular, color: DARK });

  y -= 7;
  desenharLinha(y);

  // ---------------- 4. CABEÇALHO DA TABELA DE ITENS ----------------
  y -= 12;
  page.drawText('Descrição do Item', { x: 36, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('Uni', { x: 240, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('Quant', { x: 265, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('LAR  x  ALT  -  MT2', { x: 300, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('VL Metro', { x: 400, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('VL Unita', { x: 455, y, size: 7.2, font: fontBold, color: DARK });
  page.drawText('VL Total', { x: 515, y, size: 7.2, font: fontBold, color: DARK });

  y -= 6;
  desenharLinha(y);

  // ---------------- 5. LINHAS DE ITENS ----------------
  const itensList = Array.isArray(itens) && itens.length ? itens : [];
  y -= 13;

  if (!itensList.length) {
    page.drawText('SERVIÇOS DE VIDRAÇARIA E ESQUADRIAS DE ALUMÍNIO', { x: 36, y, size: 7.5, font: fontRegular, color: DARK });
    page.drawText('UND', { x: 240, y, size: 7.5, font: fontRegular, color: DARK });
    page.drawText('1', { x: 272, y, size: 7.5, font: fontRegular, color: DARK });
    const totW = fontRegular.widthOfTextAtSize(total || '0,00', 7.5);
    page.drawText(total || '0,00', { x: 550 - totW, y, size: 7.5, font: fontRegular, color: DARK });
    y -= 16;
  } else {
    itensList.forEach((it) => {
      let descTxt = String(it.desc || '').toUpperCase();
      if (it.cor) descTxt += ` ${String(it.cor).toUpperCase()}`;

      // Quebrar descrição se for longa
      const descLines = wrapText(descTxt, fontRegular, 7.2, 195);
      page.drawText(descLines[0], { x: 36, y, size: 7.2, font: fontRegular, color: DARK });

      page.drawText('UND', { x: 240, y, size: 7.2, font: fontRegular, color: DARK });
      page.drawText(String(it.qtd || 1), { x: 272, y, size: 7.2, font: fontRegular, color: DARK });

      let medTxt = '';
      if (it.alt && it.larg) {
        medTxt = `${it.larg} x ${it.alt} - ${it.m2 || ''}`;
      } else if (it.m2) {
        medTxt = it.m2;
      }
      if (medTxt) {
        page.drawText(medTxt, { x: 300, y, size: 7.2, font: fontRegular, color: DARK });
      }

      if (it.v_m2) {
        page.drawText(String(it.v_m2), { x: 400, y, size: 7.2, font: fontRegular, color: DARK });
      }
      if (it.v_unit) {
        page.drawText(String(it.v_unit), { x: 455, y, size: 7.2, font: fontRegular, color: DARK });
      }

      const valTotItem = String(it.total || '').replace('R$', '').trim();
      const totItemW = fontRegular.widthOfTextAtSize(valTotItem, 7.2);
      page.drawText(valTotItem, { x: 555 - totItemW, y, size: 7.2, font: fontRegular, color: DARK });

      y -= 12;
      // Se a descrição teve continuação na segunda linha
      for (let d = 1; d < descLines.length; d++) {
        page.drawText(descLines[d], { x: 36, y, size: 7.2, font: fontRegular, color: DARK });
        y -= 11;
      }
    });
  }

  // ---------------- 6. OBSERVAÇÕES GERAIS E FORMAS DE PAGAMENTO ----------------
  // Posicionar bloco de observações com espaço adequado
  if (y > 330) y = 330;
  desenharLinha(y);
  y -= 13;

  page.drawText('Observações Gerais:', { x: 36, y, size: 8, font: fontBold, color: DARK });
  y -= 11;
  page.drawText('FORMAS DE PAGAMENTO', { x: 36, y, size: 7.2, font: fontBold, color: DARK });
  y -= 10;

  if (forma) {
    page.drawText(`* ${String(forma).toUpperCase()}`, { x: 36, y, size: 7, font: fontRegular, color: DARK });
    y -= 9;
  }
  page.drawText('* 50 % NA ENTRADA E 50% NO FINAL DO SERVIÇO (VALOR TOTAL)', { x: 36, y, size: 7, font: fontRegular, color: DARK });
  y -= 9;
  page.drawText('* 10 X S/JUROS NO CARTAO (VALOR TOTAL)', { x: 36, y, size: 7, font: fontRegular, color: DARK });
  y -= 9;
  page.drawText('* AV 10% DESCONTO', { x: 36, y, size: 7, font: fontRegular, color: DARK });
  y -= 13;

  page.drawText('CHAVES PIX PARA PAGAMENTO:', { x: 36, y, size: 7.2, font: fontBold, color: DARK });
  y -= 10;
  page.drawText('* InfinityPay (CNPJ): 49.226.611/0001-33', { x: 36, y, size: 7, font: fontRegular, color: DARK });
  y -= 9;
  page.drawText('* Itaú (Celular): 85 99760-2237', { x: 36, y, size: 7, font: fontRegular, color: DARK });
  y -= 11;

  if (prazo || garantia || obs) {
    if (prazo) { page.drawText(`* Prazo de Entrega: ${prazo}`, { x: 36, y, size: 7, font: fontRegular, color: DARK }); y -= 9; }
    if (garantia) { page.drawText(`* Garantia: ${garantia}`, { x: 36, y, size: 7, font: fontRegular, color: DARK }); y -= 9; }
    if (obs) { page.drawText(`* Obs: ${obs}`, { x: 36, y, size: 7, font: fontRegular, color: DARK }); y -= 9; }
  }

  // ---------------- 7. VALORES / TOTAIS E RESPONSÁVEL ----------------
  const totaisTopY = 160;
  desenharLinha(totaisTopY + 12);

  // Esquerda: Responsável e Situação
  page.drawText(`Responsavel: ${String(resp || 'SAMUEL DAVID').toUpperCase()}`, { x: 36, y: totaisTopY - 2, size: 7.5, font: fontBold, color: DARK });
  page.drawText('Situação Atual: Aguardando Aprovação', { x: 36, y: totaisTopY - 14, size: 7.5, font: fontRegular, color: DARK });
  page.drawText('Data Aprovação:   /   /         Data Entrega:   /   /', { x: 36, y: totaisTopY - 26, size: 7.5, font: fontRegular, color: DARK });

  // Direita: Totais tabulados idênticos à imagem 1
  const valorTotalLimpo = String(total || '0,00').replace('R$', '').trim();
  page.drawText('VALOR MATERIAL R$', { x: 375, y: totaisTopY - 2, size: 7.2, font: fontBold, color: DARK });
  page.drawText(valorTotalLimpo, { x: 505, y: totaisTopY - 2, size: 7.2, font: fontRegular, color: DARK });

  page.drawText('VALOR SERVIÇO  R$', { x: 375, y: totaisTopY - 12, size: 7.2, font: fontBold, color: DARK });
  page.drawText('FRETE          R$', { x: 375, y: totaisTopY - 22, size: 7.2, font: fontBold, color: DARK });
  page.drawText('DESCONTO       R$', { x: 375, y: totaisTopY - 32, size: 7.2, font: fontBold, color: DARK });

  page.drawText('VALOR TOTAL    R$', { x: 375, y: totaisTopY - 44, size: 8, font: fontBold, color: DARK });
  page.drawText(valorTotalLimpo, { x: 505, y: totaisTopY - 44, size: 8, font: fontBold, color: DARK });

  // ---------------- 8. RODAPÉ E CAMPO DE APROVAÇÃO ----------------
  const rodapeY = 88;
  desenharLinha(rodapeY + 12);

  page.drawText('Impressão em 1 via - 1ª VIA (X) - ** Obrigado pela Preferência **', { x: 36, y: rodapeY - 2, size: 6.8, font: fontRegular, color: GRAY });
  page.drawText('Autorizo a execução do(s) serviço(s) nas condições acima discriminado', { x: 36, y: rodapeY - 14, size: 7.2, font: fontRegular, color: DARK });

  page.drawText('( ) Aprovado   ( ) Reprovado   Assinatura: ___________________________________   Data: ____/____/________', {
    x: 36,
    y: rodapeY - 28,
    size: 7.2,
    font: fontBold,
    color: DARK
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

    const pdfBytes = await gerarPdfOrcamento(dados, fetchLogo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orcamento-${(dados.numero || '0001').replace('#', '')}.pdf"`);
    res.status(200).send(Buffer.from(pdfBytes));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao gerar PDF do orçamento.' });
  }
};
