const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID não informado.' });

    let supabase;
    try {
      supabase = getClient();
    } catch (cfgErr) {
      return res.status(503).json({ error: cfgErr.message });
    }

    const { data, error } = await supabase
      .from('contratos')
      .select('numero_os, cliente_nome, texto, assinado, assinante_nome, assinado_em')
      .eq('id', id)
      .single();

    if (error) {
      const msg = error.message || '';
      if (msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
        return res.status(503).json({ error: 'Banco de dados Supabase inacessível ou pausado.' });
      }
      throw error;
    }
    if (!data) return res.status(404).json({ error: 'Contrato não encontrado.' });
    res.status(200).json(data);
  } catch (e) {
    console.error('Erro em contrato:', e);
    let msg = e.message || 'Erro ao buscar contrato.';
    if (msg.includes('fetch failed')) {
      msg = 'Banco de dados Supabase inacessível ou pausado.';
    }
    res.status(500).json({ error: msg });
  }
};
