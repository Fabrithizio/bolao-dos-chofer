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
    <div><span>Prazo</span><strong>${formatDate(pool.deadline)}</strong></div>`;

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

  const poolMatches = state.matches.filter((match) => match.poolId === pool.id);
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
        <div class="match-time">${match.hasResult ? `Resultado: ${match.resultA} x ${match.resultB}` : `Palpites até ${formatDate(match.dataHora)}`}</div>
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

$("#poolId").addEventListener("change", renderPool);
$("#mode").addEventListener("change", renderPool);
$("#matchId").addEventListener("change", updateTeamLabels);

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
    event.target.reset();
    $("#mode").value = "PAGO";
    await loadData();
    setStatus($("#registrationStatus"), data.message, "success");
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
