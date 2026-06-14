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

Depois do prazo escolhido, novas inscrições são recusadas automaticamente. Em bolões pagos, esse prazo deve ser anterior ao primeiro jogo; em gratuitos, pode ficar aberto durante a fase.

### Diferença entre gratuito e pago

- **Bolão gratuito:** pode aceitar novos participantes durante a fase. Quem entrar mais tarde começa com zero e só consegue palpitar nos jogos que ainda não começaram.
- **Bolão pago:** o prazo precisa terminar antes do primeiro jogo incluído, para todos começarem em igualdade.

Você pode criar quantos bolões quiser. Por exemplo:

- `Aquecimento - Fase de Grupos`, gratuito até 27/06/2026;
- `Fase de Grupos a partir de 20/06`, contendo somente jogos futuros;
- `Bolão das Oitavas`, pago e com ranking zerado;
- `Bolão das Quartas`, com novo valor e novo prêmio.

## Inscrição do participante

O participante escolhe:

- **Competir pelo prêmio:** faz o PIX e aguarda confirmação.
- **Só por diversão:** aparece apenas no ranking geral.

O nome completo precisa ser igual ao nome que aparece no comprovante PIX. Isso ajuda o organizador a identificar pagamentos de pessoas que ele não conhece.

O PIN pessoal tem de 4 a 8 números. Ele serve somente para impedir que outra pessoa envie palpites usando o mesmo nome. Não deve ser senha de banco, cartão ou celular.

Uma inscrição com PIX pendente pode palpitar para não perder o horário do jogo, mas só entra no ranking do prêmio depois da confirmação.

Inscrições novas ficam ocultas do público enquanto aguardam análise. Os palpites ficam guardados, mas também permanecem ocultos. Quando o organizador aprova ou confirma o PIX, o participante e seus palpites aparecem normalmente.

## Confirmar um PIX

1. Confira no aplicativo do banco o nome do pagador e o valor.
2. No painel administrativo, encontre a inscrição.
3. Compare **Nome da inscrição** e **Nome no PIX**.
4. Clique em **Confirmar** somente depois que o dinheiro aparecer na conta.
5. Use **Recusar** quando o pagamento não for localizado ou estiver incorreto.

O site mostra apenas o nome e a situação do pagamento. Não mostra chave PIX do participante, dados bancários ou comprovantes.

A confirmação administrativa pode ser feita depois do prazo de inscrição. O importante é que a pessoa tenha se inscrito e enviado o pagamento dentro do prazo. O prazo impede novas inscrições, mas não impede o organizador de concluir a conferência depois.

## Aprovar ou bloquear inscrições

- **Aprovar:** libera a pessoa e seus palpites nas áreas públicas.
- **Bloquear:** impede novos palpites e mantém tudo oculto, preservando o registro para conferência.
- **Confirmar PIX:** confirma o pagamento e aprova automaticamente a inscrição paga.

Bloquear é mais seguro do que apagar, pois mantém o histórico em caso de dúvida ou discussão.

## Cadastrar jogos

1. Abra `admin.html` no site publicado.
2. Digite o PIN do administrador.
3. Escolha o bolão.
4. Preencha fase, Time A, Time B, data e hora.
5. Clique em **Cadastrar Jogo**.

O horário usa o fuso de Recife/Fortaleza. No horário marcado, o jogo fecha automaticamente para novos palpites.

## Corrigir bolão ou jogo

O painel administrativo possui botões **Editar** nos bolões e jogos cadastrados.

Regras de segurança:

- bolão com PIX confirmado não pode mudar o valor da inscrição;
- jogo com palpites não pode trocar os times nem ser movido para outro bolão;
- jogo com palpites pode ser adiado, mas não antecipado;
- jogo com resultado publicado não pode ser editado.

Essas travas evitam mudar as condições depois que participantes já pagaram ou palpitaram.

É tecnicamente possível alterar células diretamente na planilha, mas não é recomendado. Datas em formato errado, IDs alterados ou nomes de colunas modificados podem quebrar os vínculos. Prefira sempre o painel.

## Conferir os próprios palpites

Na página principal, a seção **Meus palpites e jogos faltantes** pede nome e PIN pessoal. Ela mostra:

- quantidade de jogos já preenchidos;
- palpites registrados;
- jogos que ainda faltam;
- botão para palpitar ou editar enquanto o jogo estiver aberto.

Enviar novamente um palpite para o mesmo jogo atualiza o placar anterior, desde que a partida ainda não tenha começado.

Em bolão gratuito com entrada tardia, a conferência considera somente os jogos que ainda estavam disponíveis quando a pessoa se inscreveu.

## Filtrar ranking e palpites

Na página de ranking, use o campo **Filtrar por participante** para localizar uma pessoa e o campo **Ver palpites de** para mostrar somente os palpites daquele nome.

## Reaproveitar times

Ao cadastrar um jogo, os campos Time A e Time B sugerem automaticamente seleções já usadas anteriormente. Você pode escolher a sugestão ou digitar um novo time.

## Regulamento público

A página `regulamento.html` apresenta pontuação, prazos, confirmação de PIX, desempates, prêmio e tratamento de jogos adiados ou cancelados. O link aparece no menu do site.

Por padrão, o sistema informa que 100% do prêmio vai ao primeiro colocado. Caso o grupo decida outra divisão, anuncie no WhatsApp antes do primeiro jogo.

## Histórico e backup

O painel registra as principais ações na aba `Historico`, incluindo criação e edição de bolões, jogos, resultados, pagamentos, bloqueios e alterações de palpites.

O botão **Baixar backup CSV** gera um arquivo no computador contendo bolões, inscrições, pagamentos, jogos e palpites. Esse arquivo:

- serve como cópia de segurança;
- pode ser aberto no Excel ou Google Planilhas;
- ajuda a conferir dados se algo for apagado por engano;
- não contém PIN administrativo nem PIN pessoal.

Faça um backup antes do primeiro jogo de cada fase e depois de publicar o resultado final.

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
