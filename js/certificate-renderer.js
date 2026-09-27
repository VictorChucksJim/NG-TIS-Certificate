async function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

async function waitForFonts() {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
}

function fitHandwrittenName(ctx, text, maxWidth, baseSize, minSize) {
  let size = baseSize;

  while (size >= minSize) {
    ctx.font = `${size}px "Dancing Script", cursive`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }

  return minSize;
}

async function createQrImage(value) {
  if (!window.QRCode) {
    throw new Error("QR generator is unavailable.");
  }

  const dataUrl = await QRCode.toDataURL(value, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
    color: {
      dark: "#000000",
      light: "#ffffff"
    }
  });

  return loadImage(dataUrl);
}

/*
 * Coordinates are based on the approved 1536 × 1086 certificate template.
 * The template itself is never altered; these values only place dynamic data
 * on top of it.
 */
const LAYOUT = {
  name: {
    centerX: 768,
    baselineY: 604,
    maxWidth: 610,
    fontSize: 68,
    minFontSize: 42
  },
  certificateNumber: {
    rightX: 1460,
    labelY: 67,
    valueY: 99
  },
  qr: {
    x: 770,
    y: 835,
    size: 148
  }
};

async function renderCertificate(certificate) {
  await waitForFonts();

  const template = await loadImage(window.NG_CERT_CONFIG.templatePath);
  const canvas = document.createElement("canvas");

  canvas.width = template.naturalWidth || template.width;
  canvas.height = template.naturalHeight || template.height;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  // Participant name — handwritten style, centred in the original name area.
  const name = String(certificate.certificate_display_name || "").trim();
  if (!name) throw new Error("Certificate name is missing.");

  const nameSize = fitHandwrittenName(
    ctx,
    name,
    LAYOUT.name.maxWidth,
    LAYOUT.name.fontSize,
    LAYOUT.name.minFontSize
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#122A68";
  ctx.font = `${nameSize}px "Dancing Script", cursive`;
  ctx.fillText(name, LAYOUT.name.centerX, LAYOUT.name.baselineY);

  // Certificate number — top-right, deliberately separate from the participant name.
  const certificateNumber = String(certificate.certificate_number || "").trim();
  if (!certificateNumber) throw new Error("Certificate number is missing.");

  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#122A68";
  ctx.font = '20px "Poppins", Arial, sans-serif';
  ctx.fillText("Certificate No:", LAYOUT.certificateNumber.rightX, LAYOUT.certificateNumber.labelY);
  ctx.font = '700 24px "Poppins", Arial, sans-serif';
  ctx.fillText(certificateNumber, LAYOUT.certificateNumber.rightX, LAYOUT.certificateNumber.valueY);

  // QR code fills the existing white square between the two signatures.
  const verificationUrl =
    certificate.verification_url ||
    `${window.NG_CERT_CONFIG.verificationBaseUrl}/${encodeURIComponent(certificateNumber)}`;

  const qrImage = await createQrImage(verificationUrl);

  ctx.drawImage(
    qrImage,
    LAYOUT.qr.x,
    LAYOUT.qr.y,
    LAYOUT.qr.size,
    LAYOUT.qr.size
  );

  return canvas;
}
