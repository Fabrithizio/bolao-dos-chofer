"use strict";

const state = { matches: [] };
const $ = (selector) => document.querySelector(selector);

function isConfigured() {
  return API_URL && !API_URL.includes("COLE_AQUI");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function apiGet(action) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("_", Date.now());
  const response = await fetch(url.toString(), { redirect: "follow" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Não foi possível carregar os dados.");
  return data;
}

async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    redirect: "follow",
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

function updateTeamLabels() {
  const match = state.matches.find((item) => item.id === $("#matchId").value);
  $("#labelTeamA").textContent = match ? match.timeA : "Time A";
  $("#labelTeamB").textContent = match ? match.timeB : "Time B";
}

function renderMatches(matches) {
  const openMatches = matches.filter((match) => match.isOpen);
  const select = $("#matchId");

  select.innerHTML = openMatches.length
    ? `<option value="">Selecione uma partida</option>${openMatches.map((match) =>
      `<option value="${escapeHtml(match.id)}">${escapeHtml(match.timeA)} x ${escapeHtml(match.timeB)} · ${formatDate(match.dataHora)}</option>`
    ).join("")}`
    : `<option value="">Nenhum jogo aberto</option>`;

  $("#openMatches").innerHTML = openMatches.length
    ? openMatches.map((match) => `
      <article class="match-card">
        <span class="phase">${escapeHtml(match.fase)}</span>
        <div class="teams"><strong>${escapeHtml(match.timeA)}</strong><span>VS</span><strong>${escapeHtml(match.timeB)}</strong></div>
        <div class="match-time">Palpites até ${formatDate(match.dataHora)}</div>
      </article>`).join("")
    : `<div class="empty-state">Nenhuma partida aberta para palpites no momento.</div>`;

  updateTeamLabels();
}

async function loadMatches() {
  if (!isConfigured()) {
    $("#matchId").innerHTML = `<option value="">Configure a API primeiro</option>`;
    $("#openMatches").innerHTML = `<div class="empty-state">Cole a URL do Apps Script no arquivo config.js para carregar os jogos.</div>`;
    setStatus($("#formStatus"), "A URL da API ainda não foi configurada.", "error");
    return;
  }

  try {
    const data = await apiGet("bootstrap");
    state.matches = data.matches || [];
    renderMatches(state.matches);
  } catch (error) {
    setStatus($("#formStatus"), error.message, "error");
    $("#openMatches").innerHTML = `<div class="empty-state">Não foi possível carregar os jogos.</div>`;
  }
}

$("#matchId").addEventListener("change", updateTeamLabels);

$("#guessForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#submitButton");
  const payload = {
    action: "submitGuess",
    name: $("#name").value.trim(),
    matchId: $("#matchId").value,
    guessA: $("#guessA").value,
    guessB: $("#guessB").value
  };

  if (!payload.name || !payload.matchId || payload.guessA === "" || payload.guessB === "") {
    setStatus($("#formStatus"), "Preencha seu nome, o jogo e os dois placares.", "error");
    return;
  }

  if (![payload.guessA, payload.guessB].every((value) => Number.isInteger(Number(value)) && Number(value) >= 0)) {
    setStatus($("#formStatus"), "Os gols precisam ser números inteiros e não negativos.", "error");
    return;
  }

  button.disabled = true;
  setStatus($("#formStatus"), "Registrando...");
  try {
    const data = await apiPost(payload);
    setStatus($("#formStatus"), data.message || "Palpite registrado com sucesso!", "success");
    $("#guessA").value = "";
    $("#guessB").value = "";
  } catch (error) {
    setStatus($("#formStatus"), error.message, "error");
  } finally {
    button.disabled = false;
  }
});

loadMatches();
