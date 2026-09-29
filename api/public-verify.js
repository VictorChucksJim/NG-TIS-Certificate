module.exports = async function handler(req, res) {
  try {
    const certificateNumber = String(
      req.query?.certificate ||
      (typeof req.body === "string" ? JSON.parse(req.body || "{}").certificate_number : req.body?.certificate_number) ||
      ""
    ).trim();

    if (!certificateNumber) {
      return res.status(400).json({ success: false, error: "certificate_number is required" });
    }

    if (!/^NG-TIS02-CERT-\d{4,}$/.test(certificateNumber)) {
      return res.status(400).json({ success: false, error: "Invalid certificate number" });
    }

    const url = process.env.CERTIFICATE_LOOKUP_URL;
    const secret = process.env.CERTIFICATE_LOOKUP_SECRET;

    if (!url || !secret) {
      throw new Error("Certificate lookup is not configured");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-make-apikey": secret
      },
      body: JSON.stringify({
        certificate_number: certificateNumber,
        source: "NG-TIS-Certificate-Public-Verification"
      })
    });

    if (!response.ok) {
      throw new Error("Certificate lookup failed: " + response.status);
    }

    const result = await response.json();

    if (!result?.success || !result.certificate || result.certificate.approved !== true) {
      return res.status(404).json({
        success: false,
        error: "Certificate is not currently available"
      });
    }

    return res.status(200).json({
      success: true,
      certificate: {
        participant_id: result.certificate.participant_id,
        certificate_number: result.certificate.certificate_number,
        certificate_display_name: result.certificate.certificate_display_name,
        issue_date: result.certificate.issue_date,
        verification_message: result.certificate.verification_message
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "Verification service temporarily unavailable"
    });
  }
};
