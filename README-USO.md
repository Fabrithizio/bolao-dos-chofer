# Bolão Dos Chofer - Guia de uso

## Como funciona agora

Cada fase pode ter seu próprio bolão. Assim, quem chegar depois da fase de grupos pode entrar nas oitavas, quartas ou outra fase sem começar em desvantagem.

Cada bolão possui:

- nome e fase;
- valor da inscrição;
- prazo para entrar;
- chave PIX;
- participantes pagos e participantes por diversão;
- prêmio acumulado;
- ranking do prêmio e ranking geral.

O ranking do prêmio inclui somente quem teve o PIX confirmado pelo organizador. O ranking geral inclui todos.

## Criar um bolão

1. Abra `admin.html`.
2. Digite o PIN administrativo e clique em **Entrar no painel**.
3. Preencha nome, fase, valor, prazo, chave PIX e titular.
4. Clique em **Criar Bolão**.

O prazo deve terminar antes do primeiro jogo. Depois dele, novas inscrições são recusadas automaticamente.

## Inscrição do participante

O participante escolhe:

- **Competir pelo prêmio:** faz o PIX e aguarda confirmação.
- **Só por diversão:** aparece apenas no ranking geral.

O nome completo precisa ser igual ao nome que aparece no comprovante PIX. Isso ajuda o organizador a identificar pagamentos de pessoas que ele não conhece.

O PIN pessoal tem de 4 a 8 números. Ele serve somente para impedir que outra pessoa envie palpites usando o mesmo nome. Não deve ser senha de banco, cartão ou celular.

Uma inscrição com PIX pendente pode palpitar para não perder o horário do jogo, mas só entra no ranking do prêmio depois da confirmação.

## Confirmar um PIX

1. Confira no aplicativo do banco o nome do pagador e o valor.
2. No painel administrativo, encontre a inscrição.
3. Compare **Nome da inscrição** e **Nome no PIX**.
4. Clique em **Confirmar** somente depois que o dinheiro aparecer na conta.
5. Use **Recusar** quando o pagamento não for localizado ou estiver incorreto.

O site mostra apenas o nome e a situação do pagamento. Não mostra chave PIX do participante, dados bancários ou comprovantes.

## Cadastrar jogos

1. Abra `admin.html` no site publicado.
2. Digite o PIN do administrador.
3. Escolha o bolão.
4. Preencha fase, Time A, Time B, data e hora.
5. Clique em **Cadastrar Jogo**.

O horário usa o fuso de Recife/Fortaleza. No horário marcado, o jogo fecha automaticamente para novos palpites.

## Mandar o link para os motoristas

Envie o link principal do GitHub Pages pelo WhatsApp:

```text
https://SEU-USUARIO.github.io/bolao-dos-chofer/
```

O participante abre no navegador do celular, informa o nome, escolhe o jogo, marca o placar e toca em **Registrar Palpite**. Não precisa instalar aplicativo.

## Lançar resultados

1. Abra a página `admin.html`.
2. Digite o PIN.
3. Escolha a partida na área **Lançar resultado**.
4. Informe o placar real.
5. Clique em **Publicar Resultado**.

O ranking é recalculado automaticamente pela API.

## Ver o ranking

Abra `ranking.html`. A página mostra pontos, placares exatos, resultados certos, total de palpites e a lista pública de palpites. Ela atualiza automaticamente a cada 15 segundos.

## Trocar o PIN

1. Abra o projeto no Google Apps Script.
2. No início do código, altere:

```js
const ADMIN_PIN = "35450946";
```

3. Salve.
4. Vá em **Implantar > Gerenciar implantações**, edite a implantação, selecione **Nova versão** e implante.

Nunca coloque o PIN em `admin.js` ou `config.js`.

## Participante esqueceu o PIN pessoal

No painel administrativo, localize a inscrição e clique em **Novo PIN**. Informe um novo número de 4 a 8 dígitos e comunique diretamente ao participante.

## Erro de CORS, acesso ou permissão

Confira:

1. A URL em `config.js` termina em `/exec`, não em `/dev`.
2. A implantação está como **Executar como: Eu**.
3. O acesso está como **Qualquer pessoa**.
4. Você autorizou o Apps Script a acessar a planilha.
5. Depois de alterar o Apps Script, publicou uma **Nova versão**.
6. A URL foi colada em `config.js` sem espaços extras.

Se ainda falhar, abra a URL `/exec?action=bootstrap` diretamente no navegador. Ela deve mostrar um JSON com `"ok":true`. Se pedir login, a implantação não está pública.

## Resetar o bolão

Para apagar apenas testes:

1. Abra a planilha.
2. Nas abas `Boloes`, `Inscricoes`, `Jogos` e `Palpites`, mantenha a primeira linha com os títulos.
3. Apague somente as linhas a partir da linha 2.

Também é possível excluir completamente as quatro abas. Elas serão recriadas no próximo acesso à API.

## Conferir palpites na planilha

Abra a aba `Palpites`. Cada linha contém data, nome, jogo e placar enviado. A coluna `nomeNormalizado` é usada para impedir que o mesmo participante repita palpite usando maiúsculas, minúsculas ou acentos diferentes.

## Pontuação

- Placar exato: 5 pontos.
- Resultado certo e erro total de 1 gol: 3 pontos.
- Resultado certo e erro total de 2 gols: 2 pontos.
- Resultado certo e erro total de 3 gols: 1 ponto.
- Resultado errado ou erro maior que 3 gols: 0 pontos.
