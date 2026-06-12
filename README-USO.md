# Bolão Dos Chofer - Guia de uso

## Cadastrar jogos

1. Abra `admin.html` no site publicado.
2. Digite o PIN do administrador.
3. Preencha fase, Time A, Time B, data e hora.
4. Clique em **Cadastrar Jogo**.

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

Opção simples:

1. Abra a planilha.
2. Nas abas `Jogos` e `Palpites`, mantenha a primeira linha com os títulos.
3. Apague somente as linhas a partir da linha 2.

Também é possível excluir completamente as abas `Jogos` e `Palpites`. Elas serão recriadas no próximo acesso à API. Não altere os nomes ou a ordem das colunas.

## Conferir palpites na planilha

Abra a aba `Palpites`. Cada linha contém data, nome, jogo e placar enviado. A coluna `nomeNormalizado` é usada para impedir que o mesmo participante repita palpite usando maiúsculas, minúsculas ou acentos diferentes.

## Pontuação

- Placar exato: 5 pontos.
- Resultado certo e erro total de 1 gol: 3 pontos.
- Resultado certo e erro total de 2 gols: 2 pontos.
- Resultado certo e erro total de 3 gols: 1 ponto.
- Resultado errado ou erro maior que 3 gols: 0 pontos.
