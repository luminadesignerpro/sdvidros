const fs = require('fs');

const files = ['cliente.html', 'funcionario.html', 'www/cliente.html', 'www/funcionario.html'];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Corrigir lógica do Banner para empresas de móveis (Tc móveis, SD Móveis, etc)
  const oldBannerSlice = `      // 5. Banner principal
      const bannerEl = document.getElementById('portal-banner-img');
      if (bannerEl) {
        if (lic.id !== 'sdvidros' && (!lic.banner || lic.banner === 'banner.jpg')) {
          bannerEl.src = 'banner_ia_vidros.jpg';
        } else if (lic.banner) {
          bannerEl.src = lic.banner;
        }
        bannerEl.alt = \`\${lic.nome} – \${lic.segmento}\`;
      }`;

  const newBannerSlice = `      // 5. Banner principal
      const bannerEl = document.getElementById('portal-banner-img');
      if (bannerEl) {
        const ehMoveis = (lic.nome && (lic.nome.toLowerCase().includes('móveis') || lic.nome.toLowerCase().includes('moveis'))) || lic.id === 'sdmoveis';
        if (ehMoveis) {
          bannerEl.src = (lic.banner && lic.banner !== 'banner.jpg' && lic.banner !== 'banner_ia_vidros.jpg') ? lic.banner : 'banner_ia_moveis.jpg';
        } else if (lic.id !== 'sdvidros' && (!lic.banner || lic.banner === 'banner.jpg')) {
          bannerEl.src = 'banner_ia_vidros.jpg';
        } else if (lic.banner) {
          bannerEl.src = lic.banner;
        }
        bannerEl.alt = \`\${lic.nome} – \${lic.segmento}\`;
      }`;

  if (code.includes(oldBannerSlice)) {
    code = code.replace(oldBannerSlice, newBannerSlice);
    console.log(`Banner logic updated in ${filePath}`);
  }

  // 2. Corrigir checarParametrosUrl para limpar sessão salva se a URL for de outra empresa
  const oldCheckSlice = `      // Verifica se já estava logado
      const salvo = localStorage.getItem('sdv_cliente_sessao');
      if (salvo) {
        try {
          const c = JSON.parse(salvo);
          // Se for sessão de funcionário (por flag ou pelo nome)
          if (c.isFuncionario || (c.nome && (c.nome.toLowerCase().includes('instalador') || c.nome.toLowerCase().includes('técnico') || c.nome.toLowerCase().includes('tecnico')))) {
            c.isFuncionario = true;
          }
          if (paramOs && c.os && !c.os.includes(paramOs)) {
            c.os = paramOs.startsWith('#') ? paramOs : '#' + paramOs;
            if (paramNome) c.nome = paramNome;
            localStorage.setItem('sdv_cliente_sessao', JSON.stringify(c));
          }
          iniciarPortalCliente(c);
          return;
        } catch (_) {}
      }`;

  const newCheckSlice = `      // Verifica se já estava logado
      const salvo = localStorage.getItem('sdv_cliente_sessao');
      const paramEmpUrl = urlParams.get('empresa') || urlParams.get('emp');
      const paramNomeEmpUrl = urlParams.get('nome') || urlParams.get('empNome');

      if (salvo) {
        try {
          const c = JSON.parse(salvo);
          // Se a sessão salva for de OUTRA empresa (ex: salvo era SD Móveis mas a URL é Tc móveis)
          const sessaoOutraEmpresa = paramEmpUrl && c.empresaId && c.empresaId !== paramEmpUrl;
          const sessaoNomeDiferente = paramNomeEmpUrl && c.empresaNome && c.empresaNome.toLowerCase() !== paramNomeEmpUrl.toLowerCase();

          if (sessaoOutraEmpresa || (sessaoNomeDiferente && (paramInstalar || autoLogin))) {
            localStorage.removeItem('sdv_cliente_sessao');
            // Deixa seguir para criar a sessão da nova empresa solicitada na URL!
          } else {
            if (paramNomeEmpUrl && c.nome && (c.nome.toLowerCase().includes('sd móveis') || c.nome.toLowerCase().includes('sd vidros') || c.nome.toLowerCase() !== paramNomeEmpUrl.toLowerCase())) {
              c.nome = paramNomeEmpUrl;
              c.empresaNome = paramNomeEmpUrl;
              if (paramEmpUrl) c.empresaId = paramEmpUrl;
              localStorage.setItem('sdv_cliente_sessao', JSON.stringify(c));
            }
            if (c.isFuncionario || (c.nome && (c.nome.toLowerCase().includes('instalador') || c.nome.toLowerCase().includes('técnico') || c.nome.toLowerCase().includes('tecnico')))) {
              c.isFuncionario = true;
            }
            if (paramOs && c.os && !c.os.includes(paramOs)) {
              c.os = paramOs.startsWith('#') ? paramOs : '#' + paramOs;
              if (paramNome) c.nome = paramNome;
              localStorage.setItem('sdv_cliente_sessao', JSON.stringify(c));
            }
            aplicarLicencaAtivaCliente();
            iniciarPortalCliente(c);
            return;
          }
        } catch (_) {}
      }`;

  if (code.includes(oldCheckSlice)) {
    code = code.replace(oldCheckSlice, newCheckSlice);
    console.log(`Session check updated in ${filePath}`);
  }

  // 3. Corrigir confirmarAcessoDiretoCliente para adotar a empresa da URL
  const oldConfirmSlice = `      const urlParams = new URLSearchParams(window.location.search);
      const urlNome = urlParams.get('nome') || (clienteSessao && clienteSessao.nome) || ('Colaborador');
      const urlOs = urlParams.get('os') || '#0001';
      const urlTel = urlParams.get('tel') || lic.telefone || '(85) 99611-9824';

      const ordens = carregarOrdensDoStorage();
      let ordemEncontrada = ordens.find(o => String(o.empresaId || '') === String(lic.id)) || ordens[0];

      const sessao = {
        nome: urlNome,
        telefone: urlTel,
        os: (ordemEncontrada && ordemEncontrada.numero) || urlOs,
        empresaId: lic.id,
        empresaNome: lic.nome,`;

  const newConfirmSlice = `      const urlParams = new URLSearchParams(window.location.search);
      const urlNome = lic.nome || urlParams.get('nome') || (clienteSessao && clienteSessao.nome) || ('Cliente');
      const urlOs = urlParams.get('os') || '#0001';
      const urlTel = urlParams.get('tel') || lic.telefone || '(85) 99611-9824';

      const ordens = carregarOrdensDoStorage();
      let ordemEncontrada = ordens.find(o => String(o.empresaId || '') === String(lic.id)) || ordens[0];

      const sessao = {
        nome: lic.nome || urlNome,
        telefone: urlTel,
        os: (ordemEncontrada && ordemEncontrada.numero) || urlOs,
        empresaId: lic.id,
        empresaNome: lic.nome,`;

  if (code.includes(oldConfirmSlice)) {
    code = code.replace(oldConfirmSlice, newConfirmSlice);
    console.log(`confirmarAcessoDiretoCliente updated in ${filePath}`);
  }

  fs.writeFileSync(filePath, code, 'utf8');
});

console.log('--- Patching completed! ---');
