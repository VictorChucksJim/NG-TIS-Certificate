const { verifyToken } = require("../lib/token");

async function lookupCertificate(certificateNumber) {
  const url = process.env.CERTIFICATE_LOOKUP_URL;
  const secret = process.env.CERTIFICATE_LOOKUP_SECRET;

  if (!url) throw new Error("CERTIFICATE_LOOKUP_URL is not configured");
  if (!secret) throw new Error("CERTIFICATE_LOOKUP_SECRET is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-certificate-secret": secret
    },
    body: JSON.stringify({
      certificate_number: certificateNumber,
      source: "NG-TIS-Certificate"
    })
  });

  if (!response.ok) {
    throw new Error("Certificate lookup failed: " + response.status);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  try {
    let token = req.query?.token;

    if (!token && req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      token = body.token;
    }

    const payload = verifyToken(token);
    if (!payload?.certificate_number) {
      return res.status(401).json({ success: false, error: "Invalid certificate link" });
    }

    const result = await lookupCertificate(payload.certificate_number);

    if (!result?.success || !result.certificate || result.certificate.approved !== true) {
      return res.status(404).json({
        success: false,
        error: "Certificate is not currently available"
      });
    }

    return res.status(200).json({
      success: true,
      certificate: result.certificate
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Certificate service temporarily unavailable"
    });
  }
};
