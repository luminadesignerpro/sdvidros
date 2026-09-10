const { getClient } = require('./_supabase');

const NTFY_TOPIC = 'sdvidros_portal_notificacoes';

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isPost = req.method === 'POST';
  const query = req.query || {};
  const body = req.body || {};

  const action = String(body.action || query.action || 'notificar').toLowerCase();

  // 1. Envio de mensagem pelo Cliente ou pela Vidraçaria
  if (action === 'mensagem') {
    const remetente = String(body.remetente || 'cliente'); // 'cliente' ou 'empresa'
    const clienteNome = String(body.cliente_nome || body.cliente || 'Cliente');
    const os = String(body.os || body.numero_os || '');
    const texto = String(body.texto || body.mensagem || '').trim();
    const clienteTel = String(body.telefone || body.tel || '');

    if (!texto) {
      return res.status(400).json({ error: 'Texto da mensagem não informado.' });
    }

    const payloadMsg = {
      tipo: 'mensagem',
      remetente: remetente, // 'cliente' ou 'empresa'
      cliente_nome: clienteNome,
      telefone: clienteTel,
      os: os,
      texto: texto,
      data_hora: new Date().toISOString()
    };

    // Notifica via ntfy
    try {
      const titulo = remetente === 'cliente' 
        ? `💬 Nova Mensagem de ${clienteNome} (${os || 'Portal'})`
        : `💬 Resposta da SD Vidros sobre seu pedido ${os}`;
      
      const tag = remetente === 'cliente' ? 'speech_balloon,bell' : 'glasses,white_check_mark';

      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': titulo,
          'Tags': tag,
          'Priority': 'urgent'
        },
        body: JSON.stringify(payloadMsg)
      });
    } catch (e) {
      console.warn('Erro ao despachar no ntfy:', e.message);
    }

    return res.status(200).json({ success: true, mensagem: payloadMsg });
  }

  // 2. Atualização de Status do Serviço pela Vidraçaria
  if (action === 'atualizar_status') {
    const os = String(body.os || body.numero_os || '');
    const clienteNome = String(body.cliente_nome || body.cliente || 'Cliente');
    const clienteTel = String(body.telefone || body.tel || '');
    const novoStatus = String(body.status || 'Em andamento');
    const etapaIndex = Number(body.etapa || 1); // 1 a 6
    const observacao = String(body.obs || body.observacao || '');
    const previsao = String(body.previsao || '');

    const payloadStatus = {
      tipo: 'status_servico',
      os: os,
      cliente_nome: clienteNome,
      telefone: clienteTel,
      status: novoStatus,
      etapa: etapaIndex,
      observacao: observacao,
      previsao: previsao,
      atualizado_em: new Date().toISOString()
    };

    // Publica no barramento para que o cliente receba em tempo real
    try {
      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': `🔄 SD Vidros: Status Atualizado - ${novoStatus}`,
          'Tags': 'hammer_and_wrench,sparkles',
          'Priority': 'high'
        },
        body: JSON.stringify(payloadStatus)
      });
    } catch (e) {
      console.warn('Erro ao despachar status no ntfy:', e.message);
    }

    return res.status(200).json({ success: true, status: payloadStatus });
  }

  // 3. Adicionar foto na Galeria
  if (action === 'adicionar_foto') {
    const os = String(body.os || body.numero_os || '');
    const clienteNome = String(body.cliente_nome || 'Cliente');
    const fotoUrl = String(body.foto_url || body.foto || '');
    const legenda = String(body.legenda || 'Foto do serviço');
    const remetente = String(body.remetente || 'empresa');

    const payloadFoto = {
      tipo: 'galeria_foto',
      os: os,
      cliente_nome: clienteNome,
      remetente: remetente,
      foto: fotoUrl,
      legenda: legenda,
      data_hora: new Date().toISOString()
    };

    try {
      await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': `📸 Nova Foto na Galeria - ${os}`,
          'Tags': 'camera,art'
        },
        body: JSON.stringify(payloadFoto)
      });
    } catch (e) {
      console.warn('Erro ao despachar foto no ntfy:', e.message);
    }

    return res.status(200).json({ success: true, foto: payloadFoto });
  }

  // Endpoint de status / teste
  return res.status(200).json({
    status: 'online',
    topico_ntfy: NTFY_TOPIC,
    horario: new Date().toISOString()
  });
};
