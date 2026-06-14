"use strict";
const state = { pools: [], matches: [], registrations: [], teams: [], guesses: [], audit: [] };
let activePoolId = "";
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
function showAdminFeedback(message, type = "success") {
  const toast = $("#adminToast");
  toast.textContent = message;
  toast.className = `admin-toast visible ${type}`.trim();
  window.clearTimeout(showAdminFeedback.timer);
  showAdminFeedback.timer = window.setTimeout(() => { toast.className = "admin-toast"; }, 4500);
}
function setButtonBusy(button) {
  if (!button) return () => {};
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Processando...";
  return () => {
    button.disabled = false;
    button.textContent = originalText;
  };
}
function askConfirmation({ title, message, acceptLabel = "Confirmar", danger = false }) {
  const dialog = $("#actionConfirmDialog");
  $("#confirmDialogTitle").textContent = title;
  $("#confirmDialogMessage").textContent = message;
  $("#confirmDialogAccept").textContent = acceptLabel;
  $("#confirmDialogAccept").className = `button ${danger ? "danger-button" : ""}`.trim();
  $("#confirmDialogIcon").className = `confirm-dialog-icon ${danger ? "danger" : ""}`.trim();
  dialog.showModal();
  return new Promise((resolve) => {
    const finish = (answer) => {
      dialog.close();
      $("#confirmDialogAccept").onclick = null;
      $("#confirmDialogCancel").onclick = null;
      dialog.oncancel = null;
      resolve(answer);
    };
    $("#confirmDialogAccept").onclick = () => finish(true);
    $("#confirmDialogCancel").onclick = () => finish(false);
    dialog.oncancel = (event) => { event.preventDefault(); finish(false); };
  });
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
    state.guesses = data.guesses || []; state.audit = data.audit || [];
    $("#adminContent").hidden = false;
    setStatus($("#adminStatus"), "Painel liberado.", "success");
    render();
  } catch (error) { setStatus($("#adminStatus"), error.message, "error"); }
}
function render() {
  const previousPool = activePoolId || $("#adminPoolFilter").value;
  const poolOptions = state.pools.map((pool) => `<option value="${escapeHtml(pool.id)}">${escapeHtml(pool.name)}</option>`).join("");
  $("#adminPoolFilter").innerHTML = poolOptions || `<option value="">Crie um bolão primeiro</option>`;
  activePoolId = state.pools.some((pool) => pool.id === previousPool) ? previousPool : (state.pools[0]?.id || "");
  $("#adminPoolFilter").value = activePoolId;
  $("#matchPoolId").innerHTML = poolOptions || `<option value="">Crie um bolão primeiro</option>`;
  if (!$("#editingMatchId").value && activePoolId) $("#matchPoolId").value = activePoolId;

  const filteredMatches = state.matches.filter((match) => match.poolId === activePoolId);
  const filteredRegistrations = state.registrations.filter((item) => item.poolId === activePoolId);
  const resultMatches = filteredMatches.filter((match) => !match.hasResult && match.status === "ATIVO");
  $("#resultMatchId").innerHTML = resultMatches.map((match) =>
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
  $("#matchAdminList").innerHTML = filteredMatches.length ? filteredMatches.map((match) => `<article class="match-card">
    <span class="phase">${escapeHtml(match.fase)}</span>
    <div class="teams"><strong>${escapeHtml(match.timeA)}</strong><span>VS</span><strong>${escapeHtml(match.timeB)}</strong></div>
    <div class="match-card-footer"><span class="match-time">${formatDate(match.dataHora)}${match.hasResult ? ` · ${match.resultA} x ${match.resultB}` : match.status === "CANCELADO" ? " · CANCELADO" : ""}</span>
    <div class="action-row"><button class="mini-button" data-edit-match="${escapeHtml(match.id)}" ${match.hasResult ? "disabled" : ""}>Editar</button>
    ${!match.hasResult ? `<button class="mini-button ${match.status === "CANCELADO" ? "confirm" : "reject"}" data-match-status="${escapeHtml(match.id)}" data-next-match-status="${match.status === "CANCELADO" ? "ATIVO" : "CANCELADO"}">${match.status === "CANCELADO" ? "Reativar" : "Cancelar jogo"}</button>` : ""}</div></div>
  </article>`).join("") : `<div class="empty-state">Nenhum jogo cadastrado.</div>`;

  renderPayments(filteredRegistrations);
  $("#auditList").innerHTML = state.audit.length ? state.audit.slice(0, 50).map((item) => `<div class="audit-row">
    <span>${formatDate(item.dateTime)}</span><strong>${escapeHtml(item.action)}</strong><small>${escapeHtml(item.details)}</small>
  </div>`).join("") : `<div class="empty-state">Nenhuma ação registrada.</div>`;
  updateResultLabels();
  updateMatchRuleNotice();
}
function normalizeSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function renderPayments(registrations = state.registrations.filter((item) => item.poolId === activePoolId)) {
  const poolMap = Object.fromEntries(state.pools.map((pool) => [pool.id, pool.name]));
  const search = normalizeSearch($("#adminParticipantFilter").value);
  const filtered = registrations.filter((item) =>
    !search || normalizeSearch(item.name).includes(search) || normalizeSearch(item.pixName).includes(search)
  );
  $("#paymentBody").innerHTML = filtered.length ? filtered.map((item) => `<tr>
    <td>${escapeHtml(poolMap[item.poolId] || "Bolão")}</td><td><strong>${escapeHtml(item.name)}</strong></td>
    <td>${escapeHtml(item.pixName)}</td><td>${registrationLabel(item)}</td><td>${paymentLabel(item.paymentStatus)}</td>
    <td><div class="action-row">
      ${item.registrationStatus === "BLOQUEADO" ? `
        <button class="mini-button confirm" data-registration="${escapeHtml(item.id)}" data-registration-status="PENDENTE">Reabrir análise</button>` : `
      ${item.mode === "DIVERSAO" && item.registrationStatus !== "APROVADO" ? `<button class="mini-button confirm" data-registration="${escapeHtml(item.id)}" data-registration-status="APROVADO">Aprovar participação</button>` : ""}
      <button class="mini-button reject" data-registration="${escapeHtml(item.id)}" data-registration-status="BLOQUEADO">Bloquear</button>
      ${item.mode === "PAGO" && item.paymentStatus !== "CONFIRMADO" ? `
        <button class="mini-button confirm" data-payment="${escapeHtml(item.id)}" data-status="CONFIRMADO">Confirmar PIX recebido</button>
        ${item.paymentStatus !== "RECUSADO" ? `<button class="mini-button reject" data-payment="${escapeHtml(item.id)}" data-status="RECUSADO">Recusar PIX</button>` : ""}` : ""}
      ${item.mode === "PAGO" && item.paymentStatus === "CONFIRMADO" ? `<span class="action-complete">Pagamento concluído</span>` : ""}`}
      <button class="mini-button" data-reset-pin="${escapeHtml(item.id)}">Novo PIN</button>
    </div></td></tr>`).join("") : `<tr><td colspan="6" class="empty-state">Nenhuma inscrição encontrada.</td></tr>`;
}
function paymentLabel(status) {
  if (status === "CONFIRMADO") return `<span class="pill">Confirmado</span>`;
  if (status === "PIX_ENVIADO") return `<span class="pill waiting">Participante informou PIX</span>`;
  if (status === "RECUSADO") return `<span class="pill danger">Não localizado</span>`;
  if (status === "DIVERSAO") return `<span class="pill neutral">Só diversão</span>`;
  return `<span class="pill waiting">Ainda não informou PIX</span>`;
}
function registrationLabel(item) {
  if (item.registrationStatus === "BLOQUEADO") return `<span class="pill danger">Bloqueado</span>`;
  if (item.registrationStatus === "APROVADO") {
    return item.mode === "PAGO" ? `<span class="pill">Valendo prêmio</span>` : `<span class="pill">Aprovado</span>`;
  }
  return `<span class="pill waiting">Em análise</span>`;
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
$("#refreshAdminButton").addEventListener("click", loadAdmin);
$("#adminParticipantFilter").addEventListener("input", () => renderPayments());
$("#resultMatchId").addEventListener("change", updateResultLabels);
$("#matchPoolId").addEventListener("change", updateMatchRuleNotice);
$("#adminPoolFilter").addEventListener("change", () => {
  activePoolId = $("#adminPoolFilter").value;
  resetMatchForm();
  render();
});
$("#cancelPoolEdit").addEventListener("click", resetPoolForm);
$("#cancelMatchEdit").addEventListener("click", resetMatchForm);
$("#backupButton").addEventListener("click", downloadBackup);
function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
function downloadBackup() {
  const pool = state.pools.find((item) => item.id === activePoolId);
  const registrations = state.registrations.filter((item) => item.poolId === activePoolId);
  const matches = state.matches.filter((item) => item.poolId === activePoolId);
  const guesses = state.guesses.filter((item) => item.poolId === activePoolId);
  const rows = [["tipo", "id", "bolao", "nome", "detalhe1", "detalhe2", "status"]];
  if (pool) rows.push(["BOLAO", pool.id, pool.name, pool.phase, pool.fee, pool.deadline, pool.status]);
  registrations.forEach((item) => rows.push(["INSCRICAO", item.id, item.poolId, item.name, item.pixName, item.mode, `${item.registrationStatus}/${item.paymentStatus}`]));
  matches.forEach((item) => rows.push(["JOGO", item.id, item.poolId, `${item.timeA} x ${item.timeB}`, item.dataHora, item.hasResult ? `${item.resultA} x ${item.resultB}` : "", item.status]));
  guesses.forEach((item) => rows.push(["PALPITE", item.id, item.poolId, item.name, `${item.timeA} x ${item.timeB}`, `${item.guessA} x ${item.guessB}`, ""]));
  const csv = "\ufeff" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `backup-${(pool?.name || "bolao").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
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
  let restoreButton = () => {};
  try {
    const match = state.matches.find((item) => item.id === $("#resultMatchId").value);
    const confirmed = await askConfirmation({
      title: "Publicar resultado?",
      message: `${match?.timeA || "Time A"} ${$("#resultA").value} x ${$("#resultB").value} ${match?.timeB || "Time B"}. O ranking será recalculado imediatamente.`,
      acceptLabel: "Publicar resultado"
    });
    if (!confirmed) return;
    restoreButton = setButtonBusy(event.submitter);
    setStatus($("#resultStatus"), "Publicando...");
    const data = await apiPost({
      action: "setResult", pin: pin(), matchId: $("#resultMatchId").value,
      resultA: $("#resultA").value, resultB: $("#resultB").value
    });
    setStatus($("#resultStatus"), data.message, "success"); $("#resultA").value = ""; $("#resultB").value = "";
    showAdminFeedback(data.message || "Resultado publicado e ranking atualizado."); await loadAdmin();
  } catch (error) {
    setStatus($("#resultStatus"), error.message, "error");
    showAdminFeedback(error.message, "error");
  } finally { restoreButton(); }
});
document.addEventListener("click", async (event) => {
  const paymentButton = event.target.closest("[data-payment]");
  const poolButton = event.target.closest("[data-pool-status]");
  const resetPinButton = event.target.closest("[data-reset-pin]");
  const registrationButton = event.target.closest("[data-registration]");
  const editPoolButton = event.target.closest("[data-edit-pool]");
  const editMatchButton = event.target.closest("[data-edit-match]");
  const matchStatusButton = event.target.closest("[data-match-status]");
  let restoreButton = () => {};
  try {
    if (editPoolButton) return startPoolEdit(editPoolButton.dataset.editPool);
    if (editMatchButton) return startMatchEdit(editMatchButton.dataset.editMatch);
    if (matchStatusButton) {
      const match = state.matches.find((item) => item.id === matchStatusButton.dataset.matchStatus);
      const isCancel = matchStatusButton.dataset.nextMatchStatus === "CANCELADO";
      const confirmed = await askConfirmation({
        title: isCancel ? "Cancelar este jogo?" : "Reativar este jogo?",
        message: `${match?.timeA || "Time A"} x ${match?.timeB || "Time B"}. ${isCancel ? "Ele deixará de aceitar palpites e não contará no ranking." : "Ele voltará a aceitar palpites se o horário ainda permitir."}`,
        acceptLabel: isCancel ? "Cancelar jogo" : "Reativar jogo",
        danger: isCancel
      });
      if (!confirmed) return;
      restoreButton = setButtonBusy(matchStatusButton);
      await apiPost({
        action: "setMatchStatus", pin: pin(), matchId: matchStatusButton.dataset.matchStatus,
        status: matchStatusButton.dataset.nextMatchStatus
      });
      showAdminFeedback(isCancel ? "Jogo cancelado com sucesso." : "Jogo reativado com sucesso.");
      return loadAdmin();
    }
    if (paymentButton) {
      const registration = state.registrations.find((item) => item.id === paymentButton.dataset.payment);
      const isConfirm = paymentButton.dataset.status === "CONFIRMADO";
      const confirmed = await askConfirmation({
        title: isConfirm ? "Confirmar recebimento do PIX?" : "Marcar PIX como não localizado?",
        message: isConfirm
          ? `${registration?.name || "Participante"} será aprovado e passará a disputar o prêmio deste bolão. Confirme somente depois de conferir o dinheiro na sua conta.`
          : `${registration?.name || "Participante"} verá que o pagamento não foi localizado e poderá informar o PIX novamente.`,
        acceptLabel: isConfirm ? "Sim, recebi o PIX" : "Marcar como não localizado",
        danger: !isConfirm
      });
      if (!confirmed) return;
      restoreButton = setButtonBusy(paymentButton);
      await apiPost({ action: "confirmPayment", pin: pin(), registrationId: paymentButton.dataset.payment, status: paymentButton.dataset.status });
      showAdminFeedback(isConfirm ? `${registration?.name || "Participante"} agora está valendo prêmio.` : "Pagamento marcado como não localizado.");
      await loadAdmin();
    }
    if (poolButton) {
      const pool = state.pools.find((item) => item.id === poolButton.dataset.poolStatus);
      const isClosing = poolButton.dataset.nextStatus === "ENCERRADO";
      const confirmed = await askConfirmation({
        title: isClosing ? "Encerrar este bolão?" : "Reabrir este bolão?",
        message: `${pool?.name || "Bolão"}. ${isClosing ? "Novas inscrições deixarão de ser aceitas." : "Novas inscrições voltarão a ser aceitas enquanto o prazo permitir."}`,
        acceptLabel: isClosing ? "Encerrar bolão" : "Reabrir bolão",
        danger: isClosing
      });
      if (!confirmed) return;
      restoreButton = setButtonBusy(poolButton);
      await apiPost({ action: "setPoolStatus", pin: pin(), poolId: poolButton.dataset.poolStatus, status: poolButton.dataset.nextStatus });
      showAdminFeedback(isClosing ? "Bolão encerrado." : "Bolão reaberto.");
      await loadAdmin();
    }
    if (resetPinButton) {
      const newPin = window.prompt("Digite um novo PIN de 4 a 8 números para este participante:");
      if (newPin === null) return;
      await apiPost({ action: "resetParticipantPin", pin: pin(), registrationId: resetPinButton.dataset.resetPin, newPin });
      setStatus($("#adminStatus"), "PIN pessoal redefinido.", "success");
    }
    if (registrationButton) {
      const registration = state.registrations.find((item) => item.id === registrationButton.dataset.registration);
      const nextStatus = registrationButton.dataset.registrationStatus;
      const isBlock = nextStatus === "BLOQUEADO";
      const isApprove = nextStatus === "APROVADO";
      const confirmed = await askConfirmation({
        title: isBlock ? "Bloquear participante?" : isApprove ? "Aprovar participante?" : "Reabrir análise?",
        message: isBlock
          ? `${registration?.name || "Participante"} ficará impedido de enviar novos palpites e continuará fora da exibição pública. O histórico não será apagado.`
          : isApprove
            ? `${registration?.name || "Participante"} será incluído normalmente neste bolão.`
            : `${registration?.name || "Participante"} voltará para análise, mas ainda não estará valendo prêmio.`,
        acceptLabel: isBlock ? "Bloquear participante" : isApprove ? "Aprovar participante" : "Reabrir análise",
        danger: isBlock
      });
      if (!confirmed) return;
      restoreButton = setButtonBusy(registrationButton);
      await apiPost({
        action: "setRegistrationStatus", pin: pin(),
        registrationId: registrationButton.dataset.registration,
        status: registrationButton.dataset.registrationStatus
      });
      showAdminFeedback(isBlock ? `${registration?.name || "Participante"} foi bloqueado.` : isApprove ? "Participante aprovado." : "Inscrição reaberta para análise.");
      await loadAdmin();
    }
  } catch (error) {
    setStatus($("#adminStatus"), error.message, "error");
    showAdminFeedback(error.message, "error");
  } finally { restoreButton(); }
});
