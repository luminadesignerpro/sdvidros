const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  try {
    const id = (req.query && req.query.id) || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'ID não informado.' });

    const supabase = getClient();
    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao excluir contrato.' });
  }
};
