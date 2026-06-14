"use strict";
const state = { pools: [], matches: [], registrations: [], teams: [] };
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
    state.pools = data.pools || []; state.matches = data.matches || [];
    state.registrations = data.registrations || []; state.teams = data.teams || [];
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
    <div class="action-row">
      <button class="mini-button" data-edit-pool="${escapeHtml(pool.id)}">Editar</button>
      <button class="mini-button" data-pool-status="${escapeHtml(pool.id)}" data-next-status="${pool.status === "ABERTO" ? "ENCERRADO" : "ABERTO"}">${pool.status === "ABERTO" ? "Encerrar" : "Reabrir"}</button>
    </div>
  </div>`).join("") : `<div class="empty-state">Nenhum bolão.</div>`;

  $("#knownTeams").innerHTML = state.teams.map((team) => `<option value="${escapeHtml(team)}"></option>`).join("");
  $("#matchAdminList").innerHTML = state.matches.length ? state.matches.map((match) => `<article class="match-card">
    <span class="phase">${escapeHtml(match.fase)}</span>
    <div class="teams"><strong>${escapeHtml(match.timeA)}</strong><span>VS</span><strong>${escapeHtml(match.timeB)}</strong></div>
    <div class="match-card-footer"><span class="match-time">${formatDate(match.dataHora)}${match.hasResult ? ` · ${match.resultA} x ${match.resultB}` : ""}</span>
    <button class="mini-button" data-edit-match="${escapeHtml(match.id)}" ${match.hasResult ? "disabled" : ""}>Editar</button></div>
  </article>`).join("") : `<div class="empty-state">Nenhum jogo cadastrado.</div>`;

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
  updateMatchRuleNotice();
}
function updateMatchRuleNotice() {
  const pool = state.pools.find((item) => item.id === $("#matchPoolId").value);
  if (!pool) {
    $("#matchRuleNotice").textContent = "Crie um bolão antes de cadastrar jogos.";
    return;
  }
  $("#matchRuleNotice").textContent = pool.fee > 0
    ? "Bolão pago: todos os jogos precisam começar depois do prazo final de inscrição."
    : "Bolão gratuito: novos participantes podem entrar até o prazo e palpitar apenas nos jogos que ainda não começaram.";
}
function updateResultLabels() {
  const match = state.matches.find((item) => item.id === $("#resultMatchId").value);
  $("#resultLabelA").textContent = match?.timeA || "Time A"; $("#resultLabelB").textContent = match?.timeB || "Time B";
}
function localDateTimeValue(value) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Recife", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
function startPoolEdit(poolId) {
  const pool = state.pools.find((item) => item.id === poolId);
  if (!pool) return;
  $("#editingPoolId").value = pool.id; $("#poolName").value = pool.name; $("#poolPhase").value = pool.phase;
  $("#poolFee").value = pool.fee; $("#poolDeadline").value = localDateTimeValue(pool.deadline);
  $("#pixKey").value = pool.pixKey || ""; $("#pixOwner").value = pool.pixOwner || "";
  $("#poolFormTitle").textContent = "Editar bolão"; $("#poolSubmitButton").textContent = "Salvar alterações";
  $("#cancelPoolEdit").hidden = false; $("#poolForm").scrollIntoView({ behavior: "smooth" });
}
function resetPoolForm() {
  $("#poolForm").reset(); $("#editingPoolId").value = ""; $("#poolFee").value = "5";
  $("#poolFormTitle").textContent = "Criar novo bolão"; $("#poolSubmitButton").textContent = "Criar Bolão";
  $("#cancelPoolEdit").hidden = true;
}
function startMatchEdit(matchId) {
  const match = state.matches.find((item) => item.id === matchId);
  if (!match || match.hasResult) return;
  $("#editingMatchId").value = match.id; $("#matchPoolId").value = match.poolId; $("#phase").value = match.fase;
  $("#teamA").value = match.timeA; $("#teamB").value = match.timeB; $("#matchDate").value = localDateTimeValue(match.dataHora);
  $("#matchFormTitle").textContent = "Editar jogo"; $("#matchSubmitButton").textContent = "Salvar alterações";
  $("#cancelMatchEdit").hidden = false; updateMatchRuleNotice(); $("#matchForm").scrollIntoView({ behavior: "smooth" });
}
function resetMatchForm() {
  $("#matchForm").reset(); $("#editingMatchId").value = "";
  $("#matchFormTitle").textContent = "Cadastrar jogo"; $("#matchSubmitButton").textContent = "Cadastrar Jogo";
  $("#cancelMatchEdit").hidden = true; updateMatchRuleNotice();
}
$("#loadAdminButton").addEventListener("click", loadAdmin);
$("#resultMatchId").addEventListener("change", updateResultLabels);
$("#matchPoolId").addEventListener("change", updateMatchRuleNotice);
$("#cancelPoolEdit").addEventListener("click", resetPoolForm);
$("#cancelMatchEdit").addEventListener("click", resetMatchForm);
$("#poolForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus($("#poolStatus"), "Criando...");
    const editingId = $("#editingPoolId").value;
    const data = await apiPost({
      action: editingId ? "updatePool" : "addPool", poolId: editingId, pin: pin(),
      name: $("#poolName").value.trim(), phase: $("#poolPhase").value.trim(),
      fee: $("#poolFee").value, deadline: $("#poolDeadline").value, pixKey: $("#pixKey").value.trim(), pixOwner: $("#pixOwner").value.trim()
    });
    setStatus($("#poolStatus"), data.message, "success"); resetPoolForm(); await loadAdmin();
  } catch (error) { setStatus($("#poolStatus"), error.message, "error"); }
});
$("#matchForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    setStatus($("#matchStatus"), "Cadastrando...");
    const editingId = $("#editingMatchId").value;
    const data = await apiPost({
      action: editingId ? "updateMatch" : "addMatch", matchId: editingId, pin: pin(),
      poolId: $("#matchPoolId").value, phase: $("#phase").value.trim(),
      teamA: $("#teamA").value.trim(), teamB: $("#teamB").value.trim(), matchDate: $("#matchDate").value
    });
    setStatus($("#matchStatus"), data.message, "success"); resetMatchForm(); await loadAdmin();
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
  const editPoolButton = event.target.closest("[data-edit-pool]");
  const editMatchButton = event.target.closest("[data-edit-match]");
  try {
    if (editPoolButton) return startPoolEdit(editPoolButton.dataset.editPool);
    if (editMatchButton) return startMatchEdit(editMatchButton.dataset.editMatch);
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
