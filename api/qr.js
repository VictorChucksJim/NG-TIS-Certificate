const QRCode = require("qrcode");
const { PNG } = require("pngjs");

const OUTPUT_SIZE = 293;
const QUIET_ZONE_MODULES = 4;

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const value = String(req.query?.value || "").trim();

  if (!value) {
    return res.status(400).json({ success: false, error: "QR value is required" });
  }

  if (!/^https:\/\/ng-tis-certificate\.vercel\.app\/verify\?certificate=NG-TIS02-CERT-\d{4,}$/.test(value)) {
    return res.status(400).json({ success: false, error: "Invalid QR value" });
  }

  try {
    const qr = QRCode.create(value, {
      errorCorrectionLevel: "H"
    });

    const moduleCount = qr.modules.size;
    const quiet = QUIET_ZONE_MODULES;
    const totalModules = moduleCount + quiet * 2;
    const moduleScale = Math.floor(OUTPUT_SIZE / totalModules);
    const symbolSize = moduleCount * moduleScale;
    const quietPixels = Math.floor((OUTPUT_SIZE - symbolSize) / 2);

    const png = new PNG({
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE
    });

    // White background.
    for (let y = 0; y < OUTPUT_SIZE; y += 1) {
      for (let x = 0; x < OUTPUT_SIZE; x += 1) {
        const index = (y * OUTPUT_SIZE + x) * 4;
        png.data[index] = 255;
        png.data[index + 1] = 255;
        png.data[index + 2] = 255;
        png.data[index + 3] = 255;
      }
    }

    // Render the QR matrix at an integer module scale.
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        if (!qr.modules.data[row * moduleCount + col]) continue;

        const startX = quietPixels + col * moduleScale;
        const startY = quietPixels + row * moduleScale;

        for (let py = startY; py < startY + moduleScale; py += 1) {
          for (let px = startX; px < startX + moduleScale; px += 1) {
            const index = (py * OUTPUT_SIZE + px) * 4;
            png.data[index] = 0;
            png.data[index + 1] = 0;
            png.data[index + 2] = 0;
            png.data[index + 3] = 255;
          }
        }
      }
    }

    const buffer = PNG.sync.write(png);

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Unable to generate QR code" });
  }
};
