async function loadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  await image.decode();
  return image;
}

function fitText(ctx, text, maxWidth, fontFamily, weight, baseSize, minSize) {
  let size = baseSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) {
      return size;
    }
    size -= 1;
  }
  return minSize;
}

async function renderCertificate(certificate) {
  const template = await loadImage(window.NG_CERT_CONFIG.templatePath);
  const canvas = document.createElement("canvas");
  canvas.width = template.naturalWidth || template.width;
  canvas.height = template.naturalHeight || template.height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

  // Dynamic fields will be positioned against the approved template
  // after the production template asset is installed.
  const centerX = canvas.width / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#14265C";

  const nameSize = fitText(
    ctx,
    certificate.certificate_display_name,
    canvas.width * 0.55,
    "Poppins, Arial, sans-serif",
    "700",
    Math.round(canvas.width * 0.032),
    Math.round(canvas.width * 0.018)
  );

  ctx.font = `700 ${nameSize}px Poppins, Arial, sans-serif`;
  ctx.fillText(certificate.certificate_display_name, centerX, canvas.height * 0.50);

  return canvas;
}
