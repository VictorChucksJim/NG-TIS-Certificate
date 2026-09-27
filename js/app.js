const state = {
  token: null,
  certificate: null,
  canvas: null
};

const $ = (id) => document.getElementById(id);

function getToken() {
  return new URLSearchParams(window.location.search).get("token");
}

function showError(message) {
  $("loading").hidden = true;
  $("certificate-view").hidden = true;
  $("error-view").hidden = false;
  $("error-message").textContent = message;
}

async function boot() {
  state.token = getToken();

  if (!state.token) {
    showError("This certificate link is incomplete or invalid.");
    return;
  }

  try {
    state.certificate = await verifyCertificateToken(state.token);
    $("loading").hidden = true;
    $("certificate-view").hidden = false;

    $("participant-name").textContent = state.certificate.certificate_display_name;
    $("participant-id").textContent = state.certificate.participant_id;
    $("certificate-number").textContent = state.certificate.certificate_number;

    state.canvas = await renderCertificate(state.certificate);
    $("certificate-preview").replaceChildren(state.canvas);

    $("download-png").onclick = downloadPNG;
    $("download-pdf").onclick = downloadPDF;
    $("correction-link").href = buildCorrectionLink(state.certificate);

    await reportActivity("CERTIFICATE_PAGE_OPENED", state.certificate);
  } catch (error) {
    showError(error.message || "Certificate unavailable.");
  }
}

function buildCorrectionLink(certificate) {
  const text =
    "Hello NICEGENE Technologies. I have an issue with my TIS Episode 002 certificate and would like to request a correction.\n\n" +
    "Participant ID: " + certificate.participant_id + "\n" +
    "Certificate Number: " + certificate.certificate_number + "\n\n" +
    "Issue: ";

  return window.NG_CERT_CONFIG.whatsappCorrectionUrl + "?text=" + encodeURIComponent(text);
}

async function downloadPNG() {
  if (!state.canvas) return;
  const link = document.createElement("a");
  link.download = state.certificate.certificate_number + ".png";
  link.href = state.canvas.toDataURL("image/png");
  link.click();
  await reportActivity("CERTIFICATE_PNG_DOWNLOADED", state.certificate);
  showSuccessState();
}

async function downloadPDF() {
  if (!state.canvas || !window.jspdf) return;

  const { jsPDF } = window.jspdf;
  const orientation = state.canvas.width >= state.canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [state.canvas.width, state.canvas.height]
  });

  pdf.addImage(
    state.canvas.toDataURL("image/png"),
    "PNG",
    0,
    0,
    state.canvas.width,
    state.canvas.height
  );

  pdf.save(state.certificate.certificate_number + ".pdf");
  await reportActivity("CERTIFICATE_PDF_DOWNLOADED", state.certificate);
  showSuccessState();
}

function showSuccessState() {
  $("success-view").hidden = false;
  $("success-view").scrollIntoView({ behavior: "smooth", block: "start" });
}

boot();
