"use strict";
const state = { pools: [], matches: [], registrations: [] };
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
})[char]);
const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const formatDate = (value) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Recife" }).format(new Date(value));
const pin = () => {
  const value = $("#adminPin").value.trim();
  if (!value) throw new Error("Digite o PIN do administrador.");
  return value;
};
function setStatus(element, message, type = "") {
  element.textContent = message; element.className = `status-line ${type}`.trim();
}
async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: "POST", redirect: "follow",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams(payload)
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.error || "Não foi possível concluir.");
  return data;
}
async function loadAdmin() {
  try {
    setStatus($("#adminStatus"), "Carregando...");
    const data = await apiPost({ action: "adminData", pin: pin() });
    state.pools = data.pools || []; state.matches = data.matches || []; state.registrations = data.registrations || [];
    $("#adminContent").hidden = false;
    setStatus($("#adminStatus"), "Painel liberado.", "success");
    render();
  } catch (error) { setStatus($("#adminStatus"), error.message, "error"); }
}
function render() {
  const poolOptions = state.pools.map((pool) => `<option value="${escapeHtml(pool.id)}">${escapeHtml(pool.name)}</option>`).join("");
  $("#matchPoolId").innerHTML = poolOptions || `<option value="">Crie um bolão primeiro</option>`;
  $("#resultMatchId").innerHTML = state.matches.map((match) =>
    `<option value="${escapeHtml(match.id)}">${escapeHtml(match.timeA)} x ${escapeHtml(match.timeB)} · ${formatDate(match.dataHora)}</option>`
  ).join("") || `<option value="">Nenhum jogo</option>`;
  $("#poolAdminList").innerHTML = state.pools.length ? state.pools.map((pool) => `<div class="participant-row">
    <div><strong>${escapeHtml(pool.name)}</strong><small>${escapeHtml(pool.phase)} · ${money(pool.fee)} · ${pool.confirmedPaid} pagos</small></div>
    <button class="mini-button" data-pool-status="${escapeHtml(pool.id)}" data-next-status="${pool.status === "ABERTO" ? "ENCERRADO" : "ABERTO"}">${pool.status === "ABERTO" ? "Encerrar" : "Reabrir"}</button>
  </div>`).join("") : `<div class="empty-state">Nenhum bolão.</div>`;

  const poolMap = Object.fromEntries(state.pools.map((pool) => [pool.id, pool.name]));
  $("#paymentBody").innerHTML = state.registrations.length ? state.registrations.map((item) => `<tr>
    <td>${escapeHtml(poolMap[item.poolId] || "Bolão")}</td><td><strong>${escapeHtml(item.name)}</strong></td>
    <td>${escapeHtml(item.pixName)}</td><td>${escapeHtml(item.registrationStatus)}</td><td>${escapeHtml(item.paymentStatus)}</td>
    <td><div class="action-row">
      <button class="mini-button confirm" data-registration="${escapeHtml(item.id)}" data-registration-status="APROVADO">Aprovar</button>
      <button class="mini-button reject" data-registration="${escapeHtml(item.id)}" data-registration-status="BLOQUEADO">Bloquear</button>
      ${item.mode === "PAGO" ? `
        <button class="mini-button confirm" data-payment="${escapeHtml(item.id)}" data-status="CONFIRMADO">Confirmar PIX</button>
        <button class="mini-button reject" data-payment="${escapeHtml(item.id)}" data-status="RECUSADO">Recusar PIX</button>` : ""}
      <button class="mini-button" data-reset-pin="${escapeHtml(item.id)}">Novo PIN</button>
    </div></td></tr>`).join("") : `<tr><td colspan="6" class="empty-state">Nenhuma inscrição.</td></tr>`;
  updateResultLabels();
}
function updateResultLabels() {
  const match = state.matches.find((item) => item.id === $("#resultMatchId").value);
  $("#resultLabelA").textContent = match?.timeA || "Time A"; $("#resultLabelB").textContent = match?.timeB || "Time B";
}
$("#loadAdminButton").addEventListener("click", loadAdmin);
$("#resultMatchId").addEventListener("change", updateResultLabels);
$("#poolForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus($("#poolStatus"), "Criando...");
    const data = await apiPost({
      action: "addPool", pin: pin(), name: $("#poolName").value.trim(), phase: $("#poolPhase").value.trim(),
      fee: $("#poolFee").value, deadline: $("#poolDeadline").value, pixKey: $("#pixKey").value.trim(), pixOwner: $("#pixOwner").value.trim()
    });
    setStatus($("#poolStatus"), data.message, "success"); event.target.reset(); await loadAdmin();
  } catch (error) { setStatus($("#poolStatus"), error.message, "error"); }
});
$("#matchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus($("#matchStatus"), "Cadastrando...");
    const data = await apiPost({
      action: "addMatch", pin: pin(), poolId: $("#matchPoolId").value, phase: $("#phase").value.trim(),
      teamA: $("#teamA").value.trim(), teamB: $("#teamB").value.trim(), matchDate: $("#matchDate").value
    });
    setStatus($("#matchStatus"), data.message, "success"); event.target.reset(); await loadAdmin();
  } catch (error) { setStatus($("#matchStatus"), error.message, "error"); }
});
$("#resultForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus($("#resultStatus"), "Publicando...");
    const data = await apiPost({
      action: "setResult", pin: pin(), matchId: $("#resultMatchId").value,
      resultA: $("#resultA").value, resultB: $("#resultB").value
    });
    setStatus($("#resultStatus"), data.message, "success"); $("#resultA").value = ""; $("#resultB").value = ""; await loadAdmin();
  } catch (error) { setStatus($("#resultStatus"), error.message, "error"); }
});
document.addEventListener("click", async (event) => {
  const paymentButton = event.target.closest("[data-payment]");
  const poolButton = event.target.closest("[data-pool-status]");
  const resetPinButton = event.target.closest("[data-reset-pin]");
  const registrationButton = event.target.closest("[data-registration]");
  try {
    if (paymentButton) {
      await apiPost({ action: "confirmPayment", pin: pin(), registrationId: paymentButton.dataset.payment, status: paymentButton.dataset.status });
      await loadAdmin();
    }
    if (poolButton) {
      await apiPost({ action: "setPoolStatus", pin: pin(), poolId: poolButton.dataset.poolStatus, status: poolButton.dataset.nextStatus });
      await loadAdmin();
    }
    if (resetPinButton) {
      const newPin = window.prompt("Digite um novo PIN de 4 a 8 números para este participante:");
      if (newPin === null) return;
      await apiPost({ action: "resetParticipantPin", pin: pin(), registrationId: resetPinButton.dataset.resetPin, newPin });
      setStatus($("#adminStatus"), "PIN pessoal redefinido.", "success");
    }
    if (registrationButton) {
      await apiPost({
        action: "setRegistrationStatus", pin: pin(),
        registrationId: registrationButton.dataset.registration,
        status: registrationButton.dataset.registrationStatus
      });
      await loadAdmin();
    }
  } catch (error) { setStatus($("#adminStatus"), error.message, "error"); }
});
