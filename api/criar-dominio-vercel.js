module.exports = async (req, res) => {
  // Configuração de cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const body = req.body || {};
    const nomeEmpresa = body.nome || req.query.nome || '';
    const slugDesejado = body.slug || req.query.slug || '';
    
    if (!nomeEmpresa && !slugDesejado) {
      return res.status(400).json({ error: 'Informe o nome ou slug da empresa.' });
    }

    // Gera o slug limpo (ex: "jS serviços" -> "jsservicos")
    let slug = (slugDesejado || nomeEmpresa)
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

    // Tenta registrar automaticamente o domínio via API da Vercel se VERCEL_AUTH_TOKEN estiver configurado
    if (vercelToken) {
      try {
        const response = await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: domainName })
        });
        const data = await response.json();
        if (response.ok || (data.error && (data.error.code === 'domain_already_in_use' || data.error.code === 'domain_already_exists'))) {
          return res.json({
            ok: true,
            domain: `https://${domainName}`,
            slug: slug,
            createdViaApi: true
          });
        }
      } catch (e) {
        console.warn('Alerta Vercel API:', e.message);
      }
    }

    // Retorna a URL formatada automaticamente para a empresa
    return res.json({
      ok: true,
      domain: `https://${domainName}`,
      slug: slug,
      createdViaApi: false
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
