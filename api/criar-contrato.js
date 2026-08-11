const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { numero_os, cliente_nome, cliente_tel, texto } = req.body || {};
    if (!texto) return res.status(400).json({ error: 'Texto do contrato é obrigatório.' });

    const supabase = getClient();
    const { data, error } = await supabase
      .from('contratos')
      .insert({ numero_os, cliente_nome, cliente_tel, texto })
      .select('id')
      .single();

    if (error) throw error;
    res.status(200).json({ id: data.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao criar contrato.' });
  }
};
