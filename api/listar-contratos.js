const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('contratos')
      .select('id, numero_os, cliente_nome, cliente_tel, assinado, assinante_nome, assinado_em, assinatura_base64, texto')
      .order('id', { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (e) {
    console.error('Erro em listar-contratos:', e);
    res.status(500).json({ error: e.message || 'Erro ao listar contratos.' });
  }
};
