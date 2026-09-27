const { createToken } = require("../lib/token");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const sharedSecret = process.env.MAKE_SHARED_SECRET;
  if (!sharedSecret || req.headers["x-make-secret"] !== sharedSecret) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const certificateNumber = String(body.certificate_number || "").trim();

    if (!certificateNumber) {
      return res.status(400).json({ success: false, error: "certificate_number is required" });
    }

    const token = createToken(certificateNumber);

    return res.status(200).json({
      success: true,
      certificate_number: certificateNumber,
      certificate_token: token
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Unable to create certificate token" });
  }
};
