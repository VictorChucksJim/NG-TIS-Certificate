const QRCode = require("qrcode");

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
    const buffer = await QRCode.toBuffer(value, {
      errorCorrectionLevel: "H",
      margin: 0,
      width: 300,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.status(200).send(buffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Unable to generate QR code" });
  }
};
