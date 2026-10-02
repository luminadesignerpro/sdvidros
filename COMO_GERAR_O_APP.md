# 📱 Guia de Geração do App SD Vidros (APK Android)

Todos os arquivos e configurações necessários para gerar o aplicativo nativo Android já foram criados e sincronizados na pasta do projeto!

---

## 📂 Arquivos Configurados no Projeto

1. **`capacitor.config.json`**: Configuração central do Capacitor (nome do app: **SD Vidros**, pacote: `com.sdvidros.app`, pasta web: `www`).
2. **Pasta `android/`**: Projeto nativo Android completo com:
   - `android/app/src/main/AndroidManifest.xml` (permissões de internet, telas e ícones)
   - `android/app/src/main/java/com/sdvidros/app/MainActivity.java`
   - `android/gradlew` e scripts de build Gradle
   - `android/app/src/main/assets/public/` (todos os arquivos HTML, JS, CSS e imagens do sistema já embutidos)
3. **Pasta `www/`**: Build web com todas as telas (`login.html`, `index.html`, `cliente.html`, `funcionario.html`, `assinar.html`) e imagens/ícones sincronizados.
4. **`.github/workflows/build-apk.yml`**: Automação para gerar o APK diretamente na nuvem (GitHub Actions).

---

## 🚀 Como Gerar o APK

### Opção 1: Geração Automática na Nuvem (GitHub Actions - Recomendado)
Se você utiliza o repositório no GitHub, você não precisa instalar o Android Studio no seu computador:
1. Envie as alterações para o GitHub:
   ```bash
   git add .
   git commit -m "feat: arquivos e configuracao para geracao do app android"
   git push
   ```
2. No seu repositório no GitHub, clique na aba **Actions**.
3. Selecione a ação **Build Android APK** e você poderá baixar o arquivo **`app-debug.apk`** pronto para instalar no celular!

---

### Opção 2: Pelo Android Studio (No seu computador)
Se você tiver o Android Studio instalado:
1. No terminal do VS Code / pasta do projeto, execute:
   ```bash
   npm run open
   ```
   *(Ou abra a pasta `android` diretamente no Android Studio)*
2. Aguarde o Gradle sincronizar os arquivos.
3. No menu superior, clique em:
   **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. Ao concluir, clique na notificação em **locate** para pegar o arquivo `.apk`.

---

### Opção 3: Atualizar o App após fazer alterações
Sempre que fizer alterações nas páginas HTML, CSS ou JavaScript e quiser atualizar o app:
```bash
npm run copy
npm run sync
```

---

### Opção 4: Instalar como PWA (Sem precisar de APK)
O sistema já possui Service Worker e Manifests (`manifest.json` e `manifest_cliente.json`).
- Abra o link do sistema no Google Chrome do celular Android.
- Toque nos 3 pontinhos do Chrome ou no aviso na tela e selecione **"Adicionar à tela inicial"** ou **"Instalar aplicativo"**.
