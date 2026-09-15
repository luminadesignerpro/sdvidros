module.exports = (req, res) => {
  let { nome, empresa, logo } = req.query;

  // Se não veio por query param, tenta extrair do Referer
  if (!empresa && req.headers && req.headers.referer) {
    try {
      const refUrl = new URL(req.headers.referer);
      empresa = refUrl.searchParams.get('empresa');
      if (!nome) nome = refUrl.searchParams.get('nome');
    } catch (_) {}
  }

  const isMoveis = (empresa === 'sdmoveis' || (nome && nome.toLowerCase().includes('móveis')));
  const nomeFinal = nome || (isMoveis ? 'SD Móveis Projetados' : 'SD Vidros');
  const shortName = isMoveis ? 'SD Móveis' : (nomeFinal.length > 12 ? nomeFinal.split(' ')[0] + ' ' + (nomeFinal.split(' ')[1] || '') : nomeFinal);
  const logoFinal = logo || (isMoveis ? '/logo_moveis.jpg' : '/logo.jpg');

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({
    name: nomeFinal,
    short_name: shortName.trim(),
    description: `Sistema Oficial - ${nomeFinal}`,
    start_url: empresa ? `/cliente.html?empresa=${encodeURIComponent(empresa)}&nome=${encodeURIComponent(nomeFinal)}` : '/',
    display: 'standalone',
    background_color: '#080811',
    theme_color: '#080811',
    icons: [
      {
        src: logoFinal,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: logoFinal,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ]
  });
};
