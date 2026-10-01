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
  const qrUrl = `/api/qr?value=${encodeURIComponent(value)}&v=3`;
  return loadImage(qrUrl);
}

const LAYOUT = {
  name: {
    centerX: 1160,
    baselineY: 870,
    maxWidth: 900,
    fontSize: 90,
    minFontSize: 52
  },
  certificateNumber: {
    rightX: 1880,
    labelY: 256,
    valueY: 294
  },
  qrArea: {
    x: 1048,
    y: 1148,
    size: 293
  },
  qr: {
    size: 160
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

  const certificateNumber = String(certificate.certificate_number || "").trim();
  if (!certificateNumber) throw new Error("Certificate number is missing.");

  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#122A68";
  ctx.font = '24px "Poppins", Arial, sans-serif';
  ctx.fillText("Certificate No:", LAYOUT.certificateNumber.rightX, LAYOUT.certificateNumber.labelY);
  ctx.font = '700 28px "Poppins", Arial, sans-serif';
  ctx.fillText(certificateNumber, LAYOUT.certificateNumber.rightX, LAYOUT.certificateNumber.valueY);

  const verificationUrl = String(certificate.verification_url || "").trim();
  if (!verificationUrl) {
    throw new Error("Verification URL is missing.");
  }

  const qrImage = await createQrImage(verificationUrl);

  const qrX = LAYOUT.qrArea.x + (LAYOUT.qrArea.size - LAYOUT.qr.size) / 2;
  const qrY = LAYOUT.qrArea.y + (LAYOUT.qrArea.size - LAYOUT.qr.size) / 2;

  ctx.drawImage(
    qrImage,
    qrX,
    qrY,
    LAYOUT.qr.size,
    LAYOUT.qr.size
  );

  return canvas;
}
