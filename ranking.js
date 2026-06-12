"use strict";

const $ = (selector) => document.querySelector(selector);

function isConfigured() {
  return API_URL && !API_URL.includes("COLE_AQUI");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

async function apiGet() {
  const url = new URL(API_URL);
  url.searchParams.set("action", "ranking");
  url.searchParams.set("_", Date.now());
  const response = await fetch(url.toString(), { redirect: "follow" });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Erro ao carregar ranking.");
  return data;
}

function renderRanking(ranking) {
  $("#participantCount").textContent = ranking.length;
  $("#rankingBody").innerHTML = ranking.length
    ? ranking.map((item, index) => `
      <tr>
        <td class="position">${index + 1}º</td>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td><strong>${item.points}</strong></td>
        <td>${item.exactScores}</td>
        <td>${item.correctOutcomes}</td>
        <td>${item.totalGuesses}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="empty-state">Ainda não há palpites registrados.</td></tr>`;
}

function renderGuesses(guesses) {
  $("#guessesBody").innerHTML = guesses.length
    ? guesses.map((guess) => `
      <tr>
        <td><strong>${escapeHtml(guess.name)}</strong></td>
        <td>${escapeHtml(guess.timeA)} x ${escapeHtml(guess.timeB)}</td>
        <td>${guess.guessA} x ${guess.guessB}</td>
        <td>${guess.hasResult
          ? `${guess.resultA} x ${guess.resultB}`
          : `<span class="pill waiting">aguardando resultado</span>`}</td>
        <td>${guess.hasResult ? `<span class="pill">${guess.points} pts</span>` : "—"}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty-state">Ainda não há palpites registrados.</td></tr>`;
}

async function refresh() {
  if (!isConfigured()) {
    $("#refreshStatus").textContent = "Configure a URL da API no config.js.";
    $("#rankingBody").innerHTML = `<tr><td colspan="6" class="empty-state">API ainda não configurada.</td></tr>`;
    $("#guessesBody").innerHTML = `<tr><td colspan="5" class="empty-state">API ainda não configurada.</td></tr>`;
    return;
  }

  try {
    const data = await apiGet();
    renderRanking(data.ranking || []);
    renderGuesses(data.guesses || []);
    $("#refreshStatus").textContent = `Atualizado às ${new Date().toLocaleTimeString("pt-BR")}`;
  } catch (error) {
    $("#refreshStatus").textContent = error.message;
  }
}

refresh();
setInterval(refresh, Math.max(5, Number(REFRESH_SECONDS) || 15) * 1000);
