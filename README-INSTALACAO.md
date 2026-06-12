# Bolão Dos Chofer - Instalação

Este projeto usa GitHub Pages no site e Google Sheets + Apps Script na API. Não precisa de servidor próprio.

## 1. Instalar a API no Google Apps Script

1. Abra a planilha:
   https://docs.google.com/spreadsheets/d/1axBLiaeERvtxNQ02GOByXU8z7pBFGH1w-j9N7UnLNVA/edit
2. Confirme que está usando a conta `fabricio.silva.s.silva@gmail.com`.
3. Clique em **Extensões > Apps Script**.
4. Apague o código de exemplo do arquivo `Código.gs`.
5. Abra o arquivo local `apps-script.gs`, copie todo o conteúdo e cole no Apps Script.
6. Clique em **Salvar**.
7. Em **Configurações do projeto**, defina o fuso horário como **(GMT-03:00) America/Recife**.
8. Clique em **Implantar > Nova implantação**.
9. Em "Selecione o tipo", escolha **Aplicativo da Web**.
10. Em "Executar como", escolha **Eu**.
11. Em "Quem pode acessar", escolha **Qualquer pessoa**.
12. Clique em **Implantar** e autorize o acesso solicitado pelo Google.
13. Copie a URL terminada em `/exec`.
14. Abra `config.js` e troque:

```js
const API_URL = "COLE_AQUI_A_URL_DO_APPS_SCRIPT";
```

pela URL copiada, mantendo as aspas.

Ao primeiro acesso, as abas `Jogos` e `Palpites` serão criadas automaticamente.

## 2. Testar no computador

Abra `index.html` no navegador. Para um teste mais fiel, rode um servidor local dentro da pasta:

```powershell
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## 3. Publicar no GitHub Pages

O Git foi inicializado localmente e o primeiro commit foi criado. Como o GitHub CLI não estava instalado neste computador, faça:

1. Entre em https://github.com/new.
2. Crie um repositório público com o nome exato `bolao-dos-chofer`.
3. Não marque README, `.gitignore` ou licença, pois o projeto local já tem arquivos.
4. No PowerShell, dentro da pasta `Bolão Dos Chofer`, execute:

```powershell
git remote add origin https://github.com/SEU-USUARIO/bolao-dos-chofer.git
git branch -M main
git push -u origin main
```

5. No repositório do GitHub, abra **Settings > Pages**.
6. Em **Build and deployment**, selecione **Deploy from a branch**.
7. Escolha a branch `main`, pasta `/(root)` e clique em **Save**.
8. Aguarde alguns minutos. O endereço será:

```text
https://SEU-USUARIO.github.io/bolao-dos-chofer/
```

## Atualizar o Apps Script

Quando alterar `apps-script.gs`, cole a nova versão no editor e crie uma implantação:

1. **Implantar > Gerenciar implantações**.
2. Clique no lápis.
3. Em "Versão", selecione **Nova versão**.
4. Clique em **Implantar**.

Usando a mesma implantação, a URL `/exec` continua igual.

## Segurança

O PIN fica somente em `apps-script.gs`, no computador e no servidor do Google. Ele não aparece em `admin.js`, `config.js` ou nas páginas públicas.

O arquivo `.gitignore` já impede que `apps-script.gs` seja enviado ao repositório público. Não remova essa regra e não use `git add -f apps-script.gs`.
