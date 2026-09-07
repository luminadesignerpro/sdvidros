const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Paleta de Cores Premium SD VIDROS
const DARK = rgb(0.09, 0.12, 0.18);      // Slate Navy elegante
const GOLD = rgb(0.79, 0.63, 0.22);      // Dourado nobre
const GOLD_LIGHT = rgb(0.96, 0.93, 0.84);// Dourado suave para fundos
const GRAY = rgb(0.42, 0.46, 0.54);      // Cinza neutro texto secundário
const LIGHT_GRAY = rgb(0.65, 0.69, 0.76);// Cinza claro
const BORDER = rgb(0.86, 0.89, 0.93);    // Borda suave
const BOX_BG = rgb(0.98, 0.98, 0.99);    // Fundo de cards
const HEADER_BG = rgb(0.93, 0.95, 0.98); // Fundo sutil de cabeçalhos
const ROW_ALT = rgb(0.97, 0.98, 0.99);   // Fundo alternado de linhas
const WHITE = rgb(1, 1, 1);
const GREEN_BG = rgb(0.93, 0.97, 0.94);  // Fundo PIX
const GREEN_TXT = rgb(0.12, 0.48, 0.24); // Texto PIX

const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN_X = 32;
const CONTENT_W = PAGE_W - (MARGIN_X * 2); // 531.28 pt

function sanitizePdf(text) {
  if (text == null) return '';
  return String(text)
    .replace(/[^\x00-\x7F\xA0-\xFF\u2022]/g, '')
    .trim();
}

function wrapText(text, font, size, maxWidth) {
  const words = sanitizePdf(text).split(/\s+/).filter(Boolean);
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
    numero, dataStr, nome, cnpj, tel, endereco, bairro, cidade, apto, resp,
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

  // 1. Faixa decorativa superior dourada
  page.drawRectangle({
    x: MARGIN_X,
    y: PAGE_H - 24,
    width: CONTENT_W,
    height: 3.5,
    color: GOLD
  });

  // ---------------- 2. CABEÇALHO ELEGANTE ----------------
  const headerY = PAGE_H - 34;

  // Logo com borda suave
  if (logoImage) {
    const logoSize = 48;
    page.drawRectangle({
      x: MARGIN_X,
      y: headerY - logoSize,
      width: logoSize,
      height: logoSize,
      borderColor: BORDER,
      borderWidth: 0.8,
      color: WHITE
    });
    page.drawImage(logoImage, {
      x: MARGIN_X + 2,
      y: headerY - logoSize + 2,
      width: logoSize - 4,
      height: logoSize - 4
    });
  }

  const textX = logoImage ? MARGIN_X + 56 : MARGIN_X;
  page.drawText('SD VIDROS', { x: textX, y: headerY - 14, size: 17, font: fontBold, color: DARK });
  page.drawText('SOLUÇÕES EM VIDROS TEMPERADOS E ESQUADRIAS DE ALUMÍNIO', { x: textX, y: headerY - 26, size: 7.2, font: fontBold, color: GOLD });
  page.drawText('Rua Jorge Figueiredo 740, Barrocão - Itaitinga-CE • CNPJ: 49.226.611/0001-33', { x: textX, y: headerY - 37, size: 7, font: fontRegular, color: GRAY });
  page.drawText('WhatsApp: (85) 99611-9824 • 99760-2237 • 98574-9606 | sdvidros2025@gmail.com', { x: textX, y: headerY - 48, size: 7, font: fontRegular, color: GRAY });

  // Badge do Orçamento no canto direito superior
  const badgeW = 138;
  const badgeH = 50;
  const badgeX = MARGIN_X + CONTENT_W - badgeW;
  const badgeY = headerY - badgeH;

  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: DARK
  });

  // Linha dourada na lateral do badge
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: 3.5,
    height: badgeH,
    color: GOLD
  });

  const numLimpo = String(numero || '000001').replace('#', '').padStart(6, '0');
  page.drawText('PROPOSTA COMERCIAL', { x: badgeX + 10, y: badgeY + 35, size: 7, font: fontBold, color: GOLD });
  page.drawText(`Nº ${numLimpo}`, { x: badgeX + 10, y: badgeY + 20, size: 12, font: fontBold, color: WHITE });

  const agora = new Date();
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dataFormatada = dataStr || agora.toLocaleDateString('pt-BR');
  page.drawText(`Emissão: ${dataFormatada} às ${horaStr}`, { x: badgeX + 10, y: badgeY + 8, size: 6.8, font: fontRegular, color: rgb(0.85, 0.88, 0.93) });

  // ---------------- 3. CARD: DADOS DO CLIENTE & LOCAL ----------------
  const clientCardY = badgeY - 14;
  const clientCardH = 58;
  const clientCardBoxY = clientCardY - clientCardH;

  page.drawRectangle({
    x: MARGIN_X,
    y: clientCardBoxY,
    width: CONTENT_W,
    height: clientCardH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  // Topo interno do card
  page.drawRectangle({
    x: MARGIN_X,
    y: clientCardY - 15,
    width: CONTENT_W,
    height: 15,
    color: HEADER_BG
  });
  page.drawText('IDENTIFICAÇÃO DO CLIENTE & LOCAL DA INSTALAÇÃO', { x: MARGIN_X + 10, y: clientCardY - 11, size: 7, font: fontBold, color: DARK });

  const nomeCliente = String(nome || 'CLIENTE NÃO INFORMADO').toUpperCase();
  const telCliente = String(tel || '').trim();
  const endLimpo = String(endereco || '').toUpperCase();
  const bairroNome = String(bairro || '').toUpperCase();
  const cidadeNome = String(cidade || '').toUpperCase();
  const bairroCidade = [bairroNome, cidadeNome ? cidadeNome + ' - CE' : 'CE'].filter(Boolean).join(', ');

  // Linha 1: Cliente e Telefone
  page.drawText('CLIENTE:', { x: MARGIN_X + 10, y: clientCardY - 27, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(nomeCliente.substring(0, 48), { x: MARGIN_X + 56, y: clientCardY - 27, size: 8, font: fontBold, color: DARK });

  page.drawText('WHATSAPP / TEL:', { x: MARGIN_X + 340, y: clientCardY - 27, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(telCliente || '-', { x: MARGIN_X + 420, y: clientCardY - 27, size: 8, font: fontBold, color: DARK });

  // Linha 2: Endereço e Bairro/Cidade
  page.drawText('ENDEREÇO:', { x: MARGIN_X + 10, y: clientCardY - 41, size: 6.8, font: fontBold, color: GRAY });
  page.drawText((endLimpo || 'Não informado').substring(0, 52), { x: MARGIN_X + 68, y: clientCardY - 41, size: 7.5, font: fontRegular, color: DARK });

  page.drawText('BAIRRO / CID:', { x: MARGIN_X + 340, y: clientCardY - 41, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(bairroCidade || 'Itaitinga - CE', { x: MARGIN_X + 406, y: clientCardY - 41, size: 7.5, font: fontRegular, color: DARK });

  // Linha 3: CPF/CNPJ e Complemento
  page.drawText('CPF / CNPJ:', { x: MARGIN_X + 10, y: clientCardY - 54, size: 6.8, font: fontBold, color: GRAY });
  page.drawText(cnpj || 'Não informado', { x: MARGIN_X + 68, y: clientCardY - 54, size: 7.5, font: fontRegular, color: DARK });

  if (apto) {
    page.drawText('COMPL / APTO:', { x: MARGIN_X + 220, y: clientCardY - 54, size: 6.8, font: fontBold, color: GRAY });
    page.drawText(String(apto).toUpperCase(), { x: MARGIN_X + 284, y: clientCardY - 54, size: 7.5, font: fontRegular, color: DARK });
  }

  // ---------------- 4. TABELA DE ITENS & SERVIÇOS ----------------
  const tableHeaderY = clientCardBoxY - 14;
  const tableHeaderH = 19;

  // Barra de cabeçalho da tabela escura e elegante
  page.drawRectangle({
    x: MARGIN_X,
    y: tableHeaderY - tableHeaderH,
    width: CONTENT_W,
    height: tableHeaderH,
    color: DARK
  });

  page.drawText('DESCRIÇÃO DO PRODUTO / SERVIÇO', { x: MARGIN_X + 8, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('MEDIDAS (L x A)', { x: MARGIN_X + 250, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('ÁREA (M²)', { x: MARGIN_X + 338, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('QTD', { x: MARGIN_X + 395, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('VL. UNIT (R$)', { x: MARGIN_X + 434, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });
  page.drawText('TOTAL (R$)', { x: MARGIN_X + 486, y: tableHeaderY - 13, size: 7, font: fontBold, color: WHITE });

  let curY = tableHeaderY - tableHeaderH;
  const itensList = Array.isArray(itens) && itens.length ? itens : [];

  if (!itensList.length) {
    // Linha única padrão se não houver itens discriminados
    const rowH = 24;
    curY -= rowH;
    page.drawRectangle({
      x: MARGIN_X,
      y: curY,
      width: CONTENT_W,
      height: rowH,
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 0.6
    });
    page.drawText('SERVIÇOS DE VIDRAÇARIA E ESQUADRIAS DE ALUMÍNIO', { x: MARGIN_X + 8, y: curY + 8, size: 7.5, font: fontBold, color: DARK });
    page.drawText('Sob Medida', { x: MARGIN_X + 250, y: curY + 8, size: 7.5, font: fontRegular, color: GRAY });
    page.drawText('-', { x: MARGIN_X + 350, y: curY + 8, size: 7.5, font: fontRegular, color: GRAY });
    page.drawText('1 UND', { x: MARGIN_X + 395, y: curY + 8, size: 7.5, font: fontRegular, color: DARK });

    const valTot = String(total || '0,00').replace('R$', '').trim();
    page.drawText(valTot, { x: MARGIN_X + 438, y: curY + 8, size: 7.5, font: fontRegular, color: DARK });
    page.drawText(valTot, { x: MARGIN_X + 490, y: curY + 8, size: 8, font: fontBold, color: DARK });
  } else {
    itensList.forEach((it, idx) => {
      let descTxt = String(it.desc || '').toUpperCase();
      if (it.cor) descTxt += ` (${String(it.cor).toUpperCase()})`;

      const descLines = wrapText(descTxt, fontRegular, 7.5, 230);
      const rowH = Math.max(22, descLines.length * 11 + 9);
      curY -= rowH;

      // Fundo alternado
      page.drawRectangle({
        x: MARGIN_X,
        y: curY,
        width: CONTENT_W,
        height: rowH,
        color: idx % 2 === 0 ? WHITE : ROW_ALT,
        borderColor: BORDER,
        borderWidth: 0.5
      });

      // Descrição do item
      descLines.forEach((l, lIdx) => {
        page.drawText(l, { x: MARGIN_X + 8, y: curY + rowH - 12 - (lIdx * 10), size: 7.5, font: lIdx === 0 ? fontBold : fontRegular, color: DARK });
      });

      // Medidas
      let medTxt = '-';
      if (it.larg && it.alt) {
        medTxt = `${it.larg} x ${it.alt} m`;
      }
      page.drawText(medTxt, { x: MARGIN_X + 250, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      // Área m²
      const m2Txt = it.m2 ? String(it.m2).replace('m²', '').trim() + ' m²' : '-';
      page.drawText(m2Txt, { x: MARGIN_X + 338, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      // Quantidade
      page.drawText(`${it.qtd || 1} UND`, { x: MARGIN_X + 395, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      // Valor unitário
      const vUnitTxt = it.v_unit ? String(it.v_unit).replace('R$', '').trim() : '-';
      page.drawText(vUnitTxt, { x: MARGIN_X + 438, y: curY + rowH - 13, size: 7.5, font: fontRegular, color: DARK });

      // Valor total do item
      const vTotTxt = String(it.total || '0,00').replace('R$', '').trim();
      page.drawText(vTotTxt, { x: MARGIN_X + 488, y: curY + rowH - 13, size: 7.8, font: fontBold, color: DARK });
    });
  }

  // Se a tabela terminou muito alta, ajustamos o espaço para manter o layout nobre e balanceado
  const minBottomSectionTop = 330;
  let bottomY = curY - 14;
  if (bottomY > minBottomSectionTop) {
    bottomY = minBottomSectionTop;
  }

  // ---------------- 5. CARDS INFERIORES (CONDIÇÕES COMERCIAIS & TOTAIS) ----------------
  const cardBottomH = 150;
  const cardBottomY = bottomY - cardBottomH;

  // CARD ESQUERDO: CONDIÇÕES & PAGAMENTO (Largura: 320 pt)
  const leftCardW = 320;
  page.drawRectangle({
    x: MARGIN_X,
    y: cardBottomY,
    width: leftCardW,
    height: cardBottomH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  // Cabeçalho do Card Esquerdo
  page.drawRectangle({
    x: MARGIN_X,
    y: bottomY - 16,
    width: leftCardW,
    height: 16,
    color: HEADER_BG
  });
  page.drawText('CONDIÇÕES COMERCIAIS & FORMAS DE PAGAMENTO', { x: MARGIN_X + 8, y: bottomY - 12, size: 7, font: fontBold, color: DARK });

  let condY = bottomY - 28;
  const formaTxt = forma ? String(forma).toUpperCase() : 'À VISTA';
  page.drawText(`• Forma Escolhida: ${formaTxt}`, { x: MARGIN_X + 8, y: condY, size: 7.2, font: fontBold, color: DARK });
  condY -= 11;
  page.drawText('• Opções: 50% na entrada + 50% na entrega | Até 10x s/ juros no cartão', { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: GRAY });
  condY -= 11;
  page.drawText(`• Prazo de Execução: ${prazo || '15 dias úteis após confirmação'}`, { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: DARK });
  condY -= 11;
  page.drawText(`• Garantia: ${garantia || '1 Ano de garantia legal e de instalação'}`, { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: DARK });

  if (obs) {
    condY -= 11;
    page.drawText(`• Observações: ${String(obs).substring(0, 50)}`, { x: MARGIN_X + 8, y: condY, size: 6.8, font: fontRegular, color: GRAY });
  }

  // Box PIX no rodapé do Card Esquerdo
  const pixBoxH = 46;
  const pixBoxY = cardBottomY + 7;
  page.drawRectangle({
    x: MARGIN_X + 8,
    y: pixBoxY,
    width: leftCardW - 16,
    height: pixBoxH,
    color: GREEN_BG,
    borderColor: rgb(0.72, 0.85, 0.76),
    borderWidth: 0.8
  });
  page.drawText('DADOS PARA PAGAMENTO VIA PIX:', { x: MARGIN_X + 16, y: pixBoxY + 32, size: 6.8, font: fontBold, color: GREEN_TXT });
  page.drawText('Chave CNPJ: 49.226.611/0001-33 (InfinityPay - SD Vidros)', { x: MARGIN_X + 16, y: pixBoxY + 20, size: 6.8, font: fontRegular, color: DARK });
  page.drawText('Chave Celular: (85) 99760-2237 (Itaú - Samuel David)', { x: MARGIN_X + 16, y: pixBoxY + 9, size: 6.8, font: fontRegular, color: DARK });

  // CARD DIREITO: RESUMO FINANCEIRO E TOTAL (Largura: 198 pt)
  const rightCardW = CONTENT_W - leftCardW - 12; // ~199 pt
  const rightCardX = MARGIN_X + leftCardW + 12;

  page.drawRectangle({
    x: rightCardX,
    y: cardBottomY,
    width: rightCardW,
    height: cardBottomH,
    color: BOX_BG,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  // Cabeçalho do Card Direito
  page.drawRectangle({
    x: rightCardX,
    y: bottomY - 16,
    width: rightCardW,
    height: 16,
    color: HEADER_BG
  });
  page.drawText('RESUMO FINANCEIRO', { x: rightCardX + 8, y: bottomY - 12, size: 7, font: fontBold, color: DARK });

  let totY = bottomY - 32;
  const valorTotalLimpo = String(total || '0,00').replace('R$', '').trim();

  page.drawText('Valor dos Materiais:', { x: rightCardX + 10, y: totY, size: 7, font: fontRegular, color: GRAY });
  page.drawText(`R$ ${valorTotalLimpo}`, { x: rightCardX + rightCardW - 10 - fontBold.widthOfTextAtSize(`R$ ${valorTotalLimpo}`, 7.5), y: totY, size: 7.5, font: fontBold, color: DARK });

  totY -= 14;
  page.drawText('Mão de Obra e Instalação:', { x: rightCardX + 10, y: totY, size: 7, font: fontRegular, color: GRAY });
  page.drawText('Inclusa', { x: rightCardX + rightCardW - 10 - fontRegular.widthOfTextAtSize('Inclusa', 7), y: totY, size: 7, font: fontRegular, color: DARK });

  totY -= 14;
  page.drawText('Frete e Deslocamento:', { x: rightCardX + 10, y: totY, size: 7, font: fontRegular, color: GRAY });
  page.drawText('Incluso', { x: rightCardX + rightCardW - 10 - fontRegular.widthOfTextAtSize('Incluso', 7), y: totY, size: 7, font: fontRegular, color: DARK });

  // Bloco de destaque do VALOR TOTAL
  const totalBoxH = 50;
  const totalBoxY = cardBottomY + 7;
  page.drawRectangle({
    x: rightCardX + 8,
    y: totalBoxY,
    width: rightCardW - 16,
    height: totalBoxH,
    color: DARK
  });
  // Borda dourada no total
  page.drawRectangle({
    x: rightCardX + 8,
    y: totalBoxY,
    width: rightCardW - 16,
    height: totalBoxH,
    borderColor: GOLD,
    borderWidth: 1.2
  });

  page.drawText('TOTAL DO ORÇAMENTO', { x: rightCardX + 18, y: totalBoxY + 34, size: 7, font: fontBold, color: GOLD });
  page.drawText(`R$ ${valorTotalLimpo}`, { x: rightCardX + 18, y: totalBoxY + 14, size: 14, font: fontBold, color: WHITE });

  // ---------------- 6. RODAPÉ DE APROVAÇÃO & ASSINATURA ----------------
  const rodapeCardH = 68;
  const rodapeCardY = 32;

  page.drawRectangle({
    x: MARGIN_X,
    y: rodapeCardY,
    width: CONTENT_W,
    height: rodapeCardH,
    color: WHITE,
    borderColor: BORDER,
    borderWidth: 0.8
  });

  // Linha 1: Autorização e Opções de Aprovação
  page.drawText('Autorizo a execução dos serviços conforme as especificações e valores discriminados nesta proposta.', {
    x: MARGIN_X + 10,
    y: rodapeCardY + rodapeCardH - 14,
    size: 6.8,
    font: fontRegular,
    color: DARK
  });

  // Checkboxes no canto superior direito do rodapé
  page.drawText('[  ] APROVADO     [  ] AJUSTAR DETALHES', {
    x: MARGIN_X + CONTENT_W - 200,
    y: rodapeCardY + rodapeCardH - 14,
    size: 7.5,
    font: fontBold,
    color: DARK
  });

  // Linha 2: Campo de Assinatura
  page.drawText('Assinatura do Cliente: __________________________________________________', {
    x: MARGIN_X + 10,
    y: rodapeCardY + 30,
    size: 7.5,
    font: fontBold,
    color: DARK
  });
  page.drawText('Data: _____ / _____ / ________', {
    x: MARGIN_X + CONTENT_W - 145,
    y: rodapeCardY + 30,
    size: 7.5,
    font: fontBold,
    color: DARK
  });

  // Linha 3: Responsável técnico e Confirmação via WhatsApp
  const respNome = String(resp || 'SAMUEL DAVID').toUpperCase();
  page.drawText(`Responsável: ${respNome} • Situação: Aguardando Aprovação`, {
    x: MARGIN_X + 10,
    y: rodapeCardY + 12,
    size: 6.8,
    font: fontRegular,
    color: GRAY
  });

  page.drawText('Confirmação rápida WhatsApp: (85) 99611-9824', {
    x: MARGIN_X + CONTENT_W - 205,
    y: rodapeCardY + 12,
    size: 6.8,
    font: fontBold,
    color: GOLD
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
