const https = require('https');

module.exports = async (req, res) => {
  // Configuração de cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body || {};

    const nomeEmpresa = body.nome || req.query.nome || '';
    const slugDesejado = body.slug || req.query.slug || '';

    let slug = (slugDesejado || nomeEmpresa || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) slug = 'app-' + Date.now();

    const domainName = `${slug}.vercel.app`;
    const vercelToken = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID || 'sdvidros';

    if (vercelToken) {
      try {
        const postData = JSON.stringify({ name: domainName });
        const options = {
          hostname: 'api.vercel.com',
          path: `/v9/projects/${projectId}/domains`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        await new Promise((resolve) => {
          const apiReq = https.request(options, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => { resolve(data); });
          });
          apiReq.on('error', () => { resolve(null); });
          apiReq.write(postData);
          apiReq.end();
        });
      } catch (e) {
        console.warn('Alerta Vercel API:', e.message);
      }
    }

    return res.json({
      ok: true,
      domain: `https://${domainName}`,
      slug: slug
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
};
