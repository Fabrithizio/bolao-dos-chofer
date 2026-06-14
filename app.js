"use strict";

const state = { pools: [], matches: [], participants: [] };
const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const formatDate = (value) => new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Recife"
}).format(new Date(value));
function countdown(value) {
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return "encerrado";
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${days ? `${days}d ` : ""}${hours}h ${minutes}min`;
}

async function apiGet(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set("_", Date.now());
  const response = await fetch(url, { redirect: "follow" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Não foi possível carregar os dados.");
  return data;
}

async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload)
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `status-line ${type}`.trim();
}

function selectedPool() {
  return state.pools.find((pool) => pool.id === $("#poolId").value);
}

function renderPool() {
  const pool = selectedPool();
  if (!pool) return;
  $("#heroPrize").textContent = money(pool.prize);
  $("#poolSummary").innerHTML = `
    <div><span>Fase</span><strong>${escapeHtml(pool.phase)}</strong></div>
    <div><span>Inscrição</span><strong>${pool.fee > 0 ? money(pool.fee) : "Grátis"}</strong></div>
    <div><span>Confirmados</span><strong>${pool.confirmedPaid}</strong></div>
    <div><span>Prazo</span><strong>${formatDate(pool.deadline)}</strong><small>Faltam ${countdown(pool.deadline)}</small></div>`;

  $("#registrationForm").classList.toggle("disabled-form", !pool.registrationOpen);
  $("#registerButton").disabled = !pool.registrationOpen;
  if (!pool.registrationOpen) setStatus($("#registrationStatus"), "Inscrições encerradas para este bolão.", "error");
  else setStatus($("#registrationStatus"), "");

  const paid = $("#mode").value === "PAGO";
  const paidOption = $("#mode").querySelector('option[value="PAGO"]');
  paidOption.disabled = pool.fee <= 0;
  if (pool.fee <= 0 && paid) {
    $("#mode").value = "DIVERSAO";
    renderPool();
    return;
  }
  $("#pixNameGroup").hidden = !paid;
  $("#pixInstructions").hidden = !paid;
  $("#pixInstructions").innerHTML = paid
    ? `<strong>PIX: ${escapeHtml(pool.pixKey)}</strong><br>Valor: ${money(pool.fee)}<br>Titular: ${escapeHtml(pool.pixOwner)}<br><small>O pagamento será confirmado manualmente pelo organizador.</small>`
    : "Você participa do ranking geral, mas não concorre ao prêmio.";

  const poolMatches = state.matches.filter((match) => match.poolId === pool.id && match.status !== "CANCELADO");
  const openMatches = poolMatches.filter((match) => match.isOpen);
  $("#matchId").innerHTML = openMatches.length
    ? `<option value="">Selecione uma partida</option>${openMatches.map((match) =>
      `<option value="${escapeHtml(match.id)}">${escapeHtml(match.timeA)} x ${escapeHtml(match.timeB)} · ${formatDate(match.dataHora)}</option>`
    ).join("")}`
    : `<option value="">Nenhum jogo aberto</option>`;

  $("#openMatches").innerHTML = poolMatches.length
    ? poolMatches.map((match) => `<article class="match-card">
        <span class="phase">${escapeHtml(match.fase)}</span>
        <div class="teams"><strong>${escapeHtml(match.timeA)}</strong><span>VS</span><strong>${escapeHtml(match.timeB)}</strong></div>
        <div class="match-time">${match.hasResult ? `Resultado: ${match.resultA} x ${match.resultB}` : `Palpites até ${formatDate(match.dataHora)} · faltam ${countdown(match.dataHora)}`}</div>
      </article>`).join("")
    : `<div class="empty-state">Os jogos ainda não foram cadastrados.</div>`;

  const participants = state.participants.filter((item) => item.poolId === pool.id);
  $("#participantList").innerHTML = participants.length
    ? participants.map((item) => `<div class="participant-row">
        <strong>${escapeHtml(item.name)}</strong>
        ${statusBadge(item)}
      </div>`).join("")
    : `<div class="empty-state">Ainda não há participantes.</div>`;
  updateTeamLabels();
}

function statusBadge(item) {
  if (item.registrationStatus !== "APROVADO") return "";
  if (item.mode === "DIVERSAO") return `<span class="pill neutral">Só diversão</span>`;
  if (item.paymentStatus === "CONFIRMADO") return `<span class="pill">PIX confirmado</span>`;
  if (item.paymentStatus === "RECUSADO") return `<span class="pill danger">Pagamento recusado</span>`;
  return `<span class="pill waiting">Aguardando PIX</span>`;
}

function updateTeamLabels() {
  const match = state.matches.find((item) => item.id === $("#matchId").value);
  $("#labelTeamA").textContent = match ? match.timeA : "Time A";
  $("#labelTeamB").textContent = match ? match.timeB : "Time B";
}
function renderDashboard(data) {
  const participant = data.participant;
  const pool = data.pool;
  $("#paymentPanel").innerHTML = paymentPanel(participant, pool);
  $("#dashboardSummary").innerHTML = `<div class="progress-summary">
    <strong>${data.completed} de ${data.total}</strong>
    <span>jogos com palpite registrado</span>
  </div>`;
  $("#myGuesses").innerHTML = data.matches.length ? data.matches.map((match) => `<article class="match-card ${match.hasGuess ? "completed-match" : "missing-match"}">
    <div class="match-card-footer"><div>
      <div class="teams compact-teams"><strong>${escapeHtml(match.timeA)}</strong><span>VS</span><strong>${escapeHtml(match.timeB)}</strong></div>
      <div class="match-time">${formatDate(match.dateTime)}</div>
    </div>
    <div class="guess-status">
      ${match.hasGuess ? `<span class="pill">Registrado: ${match.guessA} x ${match.guessB}</span>` : `<span class="pill waiting">Falta palpitar</span>`}
      ${match.isOpen ? `<button class="mini-button" type="button" data-use-match="${escapeHtml(match.id)}" data-guess-a="${match.guessA ?? ""}" data-guess-b="${match.guessB ?? ""}">${match.hasGuess ? "Editar" : "Palpitar"}</button>` : ""}
    </div></div>
  </article>`).join("") : `<div class="empty-state">Nenhum jogo cadastrado.</div>`;
}
function paymentPanel(participant, pool) {
  if (participant.mode === "DIVERSAO") {
    return `<div class="payment-status-card neutral-status"><div><span class="pill neutral">Só diversão</span>
      <h3>Você participa do ranking geral</h3><p>Esta inscrição não concorre ao prêmio em dinheiro.</p></div></div>`;
  }
  if (participant.paymentStatus === "CONFIRMADO") {
    return `<div class="payment-status-card confirmed-status"><div><span class="pill">Valendo prêmio</span>
      <h3>PIX confirmado pelo organizador</h3><p>Sua participação está confirmada no ranking do prêmio.</p></div></div>`;
  }
  if (participant.paymentStatus === "PIX_ENVIADO") {
    return `<div class="payment-status-card waiting-status"><div><span class="pill waiting">Aguardando confirmação</span>
      <h3>Você informou que fez o PIX</h3><p>O organizador precisa conferir o recebimento na conta. Isso pode demorar. Em caso de dúvida, use o grupo do WhatsApp.</p>
      <p><strong>Valor:</strong> ${money(pool.fee)} · <strong>Chave:</strong> ${escapeHtml(pool.pixKey)} · <strong>Titular:</strong> ${escapeHtml(pool.pixOwner)}</p></div></div>`;
  }
  if (participant.paymentStatus === "RECUSADO") {
    return `<div class="payment-status-card danger-status"><div><span class="pill danger">PIX não localizado</span>
      <h3>Confira e fale com o organizador</h3><p>Confira nome, valor e comprovante pelo grupo do WhatsApp. Se fez um novo pagamento ou corrigiu o problema, informe novamente.</p></div>
      <button class="button payment-report-button" type="button" data-report-payment>Informar PIX novamente</button></div>`;
  }
  return `<div class="payment-status-card waiting-status"><div><span class="pill waiting">Pagamento pendente</span>
    <h3>Faça o PIX para concorrer ao prêmio</h3>
    <p><strong>Valor:</strong> ${money(pool.fee)}<br><strong>Chave PIX:</strong> ${escapeHtml(pool.pixKey)}<br><strong>Titular:</strong> ${escapeHtml(pool.pixOwner)}</p>
    <p>Depois de pagar, clique no botão. A confirmação é manual e pode demorar.</p></div>
    <button class="button payment-report-button" type="button" data-report-payment>Já fiz o PIX</button></div>`;
}

async function loadData() {
  try {
    const data = await apiGet("bootstrap");
    state.pools = data.pools || [];
    state.matches = data.matches || [];
    state.participants = data.participants || [];
    $("#poolId").innerHTML = state.pools.length
      ? state.pools.map((pool) => `<option value="${escapeHtml(pool.id)}">${escapeHtml(pool.name)} · ${escapeHtml(pool.phase)}</option>`).join("")
      : `<option value="">Nenhum bolão criado</option>`;
    renderPool();
  } catch (error) {
    setStatus($("#formStatus"), error.message, "error");
  }
}

$("#poolId").addEventListener("change", () => {
  renderPool();
  $("#paymentPanel").innerHTML = "";
  $("#dashboardSummary").innerHTML = "";
  $("#myGuesses").innerHTML = "";
  setStatus($("#dashboardStatus"), "Consulte sua situação neste bolão.");
});
$("#mode").addEventListener("change", renderPool);
$("#matchId").addEventListener("change", updateTeamLabels);
$("#dashboardForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#dashboardButton");
  button.disabled = true; setStatus($("#dashboardStatus"), "Consultando...");
  try {
    const data = await apiPost({
      action: "participantDashboard", poolId: $("#poolId").value,
      name: $("#dashboardName").value.trim(), participantPin: $("#dashboardPin").value
    });
    renderDashboard(data); setStatus($("#dashboardStatus"), "Conferência atualizada.", "success");
  } catch (error) { setStatus($("#dashboardStatus"), error.message, "error"); }
  finally { button.disabled = false; }
});
async function loadParticipantDashboard() {
  const data = await apiPost({
    action: "participantDashboard", poolId: $("#poolId").value,
    name: $("#dashboardName").value.trim(), participantPin: $("#dashboardPin").value
  });
  renderDashboard(data);
  return data;
}
document.addEventListener("click", (event) => {
  const reportButton = event.target.closest("[data-report-payment]");
  if (reportButton) {
    reportButton.disabled = true;
    apiPost({
      action: "reportPayment", poolId: $("#poolId").value,
      name: $("#dashboardName").value.trim(), participantPin: $("#dashboardPin").value
    }).then(async (data) => {
      setStatus($("#dashboardStatus"), data.message, "success");
      await loadParticipantDashboard();
    }).catch((error) => setStatus($("#dashboardStatus"), error.message, "error"))
      .finally(() => { reportButton.disabled = false; });
    return;
  }
  const button = event.target.closest("[data-use-match]");
  if (!button) return;
  $("#name").value = $("#dashboardName").value.trim();
  $("#participantPin").value = $("#dashboardPin").value;
  $("#matchId").value = button.dataset.useMatch;
  $("#guessA").value = button.dataset.guessA;
  $("#guessB").value = button.dataset.guessB;
  updateTeamLabels();
  $("#guessForm").scrollIntoView({ behavior: "smooth" });
});

$("#registrationForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#registerButton");
  const payload = {
    action: "registerParticipant", poolId: $("#poolId").value,
    name: $("#registrationName").value.trim(),
    participantPin: $("#registrationPin").value,
    mode: $("#mode").value, pixName: $("#pixName").value.trim()
  };
  button.disabled = true;
  setStatus($("#registrationStatus"), "Criando inscrição...");
  try {
    const data = await apiPost(payload);
    $("#name").value = payload.name;
    $("#participantPin").value = payload.participantPin;
    $("#dashboardName").value = payload.name;
    $("#dashboardPin").value = payload.participantPin;
    event.target.reset();
    $("#mode").value = "PAGO";
    await loadData();
    setStatus($("#registrationStatus"), data.message, "success");
    try {
      await loadParticipantDashboard();
      $("#dashboardForm").scrollIntoView({ behavior: "smooth" });
    } catch (ignored) {}
  } catch (error) {
    setStatus($("#registrationStatus"), error.message, "error");
  } finally {
    button.disabled = !selectedPool()?.registrationOpen;
  }
});

$("#guessForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#submitButton");
  const payload = {
    action: "submitGuess", poolId: $("#poolId").value,
    name: $("#name").value.trim(), participantPin: $("#participantPin").value,
    matchId: $("#matchId").value, guessA: $("#guessA").value, guessB: $("#guessB").value
  };
  button.disabled = true;
  setStatus($("#formStatus"), "Registrando...");
  try {
    const data = await apiPost(payload);
    setStatus($("#formStatus"), data.message, "success");
    $("#guessA").value = "";
    $("#guessB").value = "";
  } catch (error) {
    setStatus($("#formStatus"), error.message, "error");
  } finally {
    button.disabled = false;
  }
});

loadData();
