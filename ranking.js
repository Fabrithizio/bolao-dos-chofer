"use strict";
const $ = (selector) => document.querySelector(selector);
let pools = [];
let currentData = null;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const formatDate = (value) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Recife" }).format(new Date(value));
function countdown(value) {
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return "encerrado";
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  return `${days ? `${days}d ` : ""}${hours}h`;
}

async function apiGet(poolId = "") {
  const url = new URL(API_URL);
  url.searchParams.set("action", "ranking");
  if (poolId) url.searchParams.set("poolId", poolId);
  url.searchParams.set("_", Date.now());
  const response = await fetch(url, { redirect: "follow" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Erro ao carregar ranking.");
  return data;
}

function badge(item) {
  if (item.registrationStatus === "BLOQUEADO") return `<span class="pill danger">Bloqueado</span>`;
  if (item.registrationStatus !== "APROVADO") return `<span class="pill waiting">Em análise</span>`;
  if (item.mode === "DIVERSAO") return `<span class="pill neutral">Só diversão</span>`;
  if (item.paymentStatus === "CONFIRMADO") return `<span class="pill">PIX confirmado</span>`;
  if (item.paymentStatus === "PIX_ENVIADO") return `<span class="pill waiting">Aguardando confirmação</span>`;
  if (item.paymentStatus === "RECUSADO") return `<span class="pill danger">Recusado</span>`;
  return `<span class="pill waiting">PIX pendente</span>`;
}

function rankingRows(items, includeStatus) {
  const colspan = includeStatus ? 7 : 6;
  return items.length ? items.map((item, index) => `<tr>
    <td class="position">${index + 1}º</td><td><strong>${escapeHtml(item.name)}</strong></td>
    ${includeStatus ? `<td>${badge(item)}</td>` : ""}
    <td><strong>${item.points}</strong></td><td>${item.exactScores}</td>
    <td>${item.correctOutcomes}</td><td>${item.totalGuesses}</td>
  </tr>`).join("") : `<tr><td colspan="${colspan}" class="empty-state">Ainda não há participantes neste ranking.</td></tr>`;
}

function render(data) {
  currentData = data;
  pools = data.pools || [];
  const currentValue = $("#poolId").value;
  $("#poolId").innerHTML = pools.map((pool) =>
    `<option value="${escapeHtml(pool.id)}">${escapeHtml(pool.name)} · ${escapeHtml(pool.phase)}</option>`
  ).join("") || `<option value="">Nenhum bolão</option>`;
  if (currentValue && pools.some((pool) => pool.id === currentValue)) $("#poolId").value = currentValue;

  const pool = data.selectedPool;
  if (!pool) return;
  $("#poolId").value = pool.id;
  $("#prizeValue").textContent = money(pool.prize);
  $("#poolSummary").innerHTML = `
    <div><span>Fase</span><strong>${escapeHtml(pool.phase)}</strong></div>
    <div><span>Inscrição</span><strong>${money(pool.fee)}</strong></div>
    <div><span>Pagos confirmados</span><strong>${pool.confirmedPaid}</strong></div>
    <div><span>Prazo</span><strong>${formatDate(pool.deadline)}</strong><small>Faltam ${countdown(pool.deadline)}</small></div>`;
  renderFilteredRankings();
  $("#participantList").innerHTML = (data.participants || []).length
    ? data.participants.map((item) => `<div class="participant-row"><strong>${escapeHtml(item.name)}</strong>${badge(item)}</div>`).join("")
    : `<div class="empty-state">Nenhum participante.</div>`;
  renderFilteredGuesses();
}
function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function renderFilteredRankings() {
  if (!currentData) return;
  const filter = normalize($("#rankingFilter").value);
  const matches = (item) => !filter || normalize(item.name).includes(filter);
  $("#paidRankingBody").innerHTML = rankingRows((currentData.paidRanking || []).filter(matches), false);
  $("#generalRankingBody").innerHTML = rankingRows((currentData.generalRanking || []).filter(matches), true);
}
function renderFilteredGuesses() {
  if (!currentData) return;
  const filter = normalize($("#guessFilter").value);
  const guesses = (currentData.guesses || []).filter((guess) => !filter || normalize(guess.name).includes(filter));
  $("#guessesBody").innerHTML = guesses.length
    ? guesses.map((guess) => `<tr><td><strong>${escapeHtml(guess.name)}</strong></td>
      <td>${escapeHtml(guess.timeA)} x ${escapeHtml(guess.timeB)}</td><td>${guess.guessA} x ${guess.guessB}</td>
      <td>${guess.hasResult ? `${guess.resultA} x ${guess.resultB}` : `<span class="pill waiting">aguardando</span>`}</td>
      <td>${guess.hasResult ? `${guess.points} pts` : "—"}</td></tr>`).join("")
    : `<tr><td colspan="5" class="empty-state">Ainda não há palpites.</td></tr>`;
}

async function refresh(poolId = $("#poolId").value) {
  try {
    render(await apiGet(poolId));
    $("#refreshStatus").textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR")}`;
  } catch (error) {
    $("#refreshStatus").textContent = error.message;
  }
}
$("#poolId").addEventListener("change", () => refresh($("#poolId").value));
$("#rankingFilter").addEventListener("input", renderFilteredRankings);
$("#guessFilter").addEventListener("input", renderFilteredGuesses);
refresh();
setInterval(() => refresh(), Math.max(5, Number(REFRESH_SECONDS) || 15) * 1000);
