const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    let supabase;
    try {
      supabase = getClient();
    } catch (cfgErr) {
      return res.status(200).json([]);
    }

    const { data, error } = await supabase
      .from('contratos')
      .select('id, numero_os, cliente_nome, cliente_tel, assinado, assinante_nome, assinado_em, assinatura_base64, texto')
      .order('id', { ascending: false });

    if (error) {
      console.warn('Aviso Supabase listar-contratos:', error.message);
      return res.status(200).json([]);
    }
    res.status(200).json(data || []);
  } catch (e) {
    console.warn('Exceção listar-contratos:', e.message);
    res.status(200).json([]);
  }
};
