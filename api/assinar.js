const { getClient } = require('./_supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  try {
    const { id, assinante_nome, assinatura_base64 } = req.body || {};
    if (!id || !assinante_nome || !assinatura_base64) {
      return res.status(400).json({ error: 'Dados incompletos para assinatura.' });
    }

    const supabase = getClient();

    const { data: existente, error: errBusca } = await supabase
      .from('contratos')
      .select('assinado')
      .eq('id', id)
      .single();
    if (errBusca) throw errBusca;
    if (existente && existente.assinado) {
      return res.status(409).json({ error: 'Este contrato já foi assinado anteriormente.' });
    }

    const { error } = await supabase
      .from('contratos')
      .update({
        assinante_nome,
        assinatura_base64,
        assinado: true,
        assinado_em: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Erro ao salvar assinatura.' });
  }
};
