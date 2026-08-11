const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID não informado.' });

    const supabase = getClient();
    const { data, error } = await supabase
      .from('contratos')
      .select('numero_os, cliente_nome, texto, assinado, assinante_nome, assinado_em')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Contrato não encontrado.' });
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao buscar contrato.' });
  }
};
