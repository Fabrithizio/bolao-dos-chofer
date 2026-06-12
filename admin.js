"use strict";

const state = { matches: [] };
const $ = (selector) => document.querySelector(selector);

function isConfigured() {
  return API_URL && !API_URL.includes("COLE_AQUI");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Recife"
  }).format(new Date(value));
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `status-line ${type}`.trim();
}

async function apiGet() {
  const url = new URL(API_URL);
  url.searchParams.set("action", "bootstrap");
  url.searchParams.set("_", Date.now());
  const response = await fetch(url.toString(), { redirect: "follow" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Erro ao carregar jogos.");
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

function updateResultLabels() {
  const match = state.matches.find((item) => item.id === $("#resultMatchId").value);
  $("#resultLabelA").textContent = match ? match.timeA : "Time A";
  $("#resultLabelB").textContent = match ? match.timeB : "Time B";
}

function renderMatchOptions() {
  const select = $("#resultMatchId");
  select.innerHTML = state.matches.length
    ? `<option value="">Selecione uma partida</option>${state.matches.map((match) =>
      `<option value="${escapeHtml(match.id)}">${escapeHtml(match.timeA)} x ${escapeHtml(match.timeB)} · ${formatDate(match.dataHora)}${match.hasResult ? " · resultado lançado" : ""}</option>`
    ).join("")}`
    : `<option value="">Nenhum jogo cadastrado</option>`;
  updateResultLabels();
}

async function loadMatches() {
  if (!isConfigured()) {
    $("#resultMatchId").innerHTML = `<option value="">Configure a API primeiro</option>`;
    setStatus($("#matchStatus"), "Cole a URL do Apps Script no config.js.", "error");
    return;
  }
  try {
    const data = await apiGet();
    state.matches = data.matches || [];
    renderMatchOptions();
  } catch (error) {
    setStatus($("#matchStatus"), error.message, "error");
  }
}

function getPin() {
  const pin = $("#adminPin").value.trim();
  if (!pin) throw new Error("Digite o PIN do administrador.");
  return pin;
}

$("#resultMatchId").addEventListener("change", updateResultLabels);

$("#matchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#addMatchButton");
  try {
    const payload = {
      action: "addMatch",
      pin: getPin(),
      phase: $("#phase").value.trim(),
      teamA: $("#teamA").value.trim(),
      teamB: $("#teamB").value.trim(),
      matchDate: $("#matchDate").value
    };
    if (!payload.phase || !payload.teamA || !payload.teamB || !payload.matchDate) {
      throw new Error("Preencha todos os dados da partida.");
    }
    if (payload.teamA.toLocaleLowerCase("pt-BR") === payload.teamB.toLocaleLowerCase("pt-BR")) {
      throw new Error("Os times precisam ser diferentes.");
    }

    button.disabled = true;
    setStatus($("#matchStatus"), "Cadastrando...");
    const data = await apiPost(payload);
    setStatus($("#matchStatus"), data.message || "Jogo cadastrado!", "success");
    event.target.reset();
    await loadMatches();
  } catch (error) {
    setStatus($("#matchStatus"), error.message, "error");
  } finally {
    button.disabled = false;
  }
});

$("#resultForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#setResultButton");
  try {
    const payload = {
      action: "setResult",
      pin: getPin(),
      matchId: $("#resultMatchId").value,
      resultA: $("#resultA").value,
      resultB: $("#resultB").value
    };
    if (!payload.matchId || payload.resultA === "" || payload.resultB === "") {
      throw new Error("Escolha o jogo e informe os dois placares.");
    }
    if (![payload.resultA, payload.resultB].every((value) => Number.isInteger(Number(value)) && Number(value) >= 0)) {
      throw new Error("Os gols precisam ser números inteiros e não negativos.");
    }

    button.disabled = true;
    setStatus($("#resultStatus"), "Publicando resultado...");
    const data = await apiPost(payload);
    setStatus($("#resultStatus"), data.message || "Resultado publicado!", "success");
    $("#resultA").value = "";
    $("#resultB").value = "";
    await loadMatches();
  } catch (error) {
    setStatus($("#resultStatus"), error.message, "error");
  } finally {
    button.disabled = false;
  }
});

loadMatches();
