async function verifyCertificateToken(token) {
  const response = await fetch("/api/verify?token=" + encodeURIComponent(token), {
    headers: { "Accept": "application/json" }
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Certificate unavailable");
  }

  return data.certificate;
}

async function reportActivity(event, certificate) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        certificate_number: certificate?.certificate_number || null,
        participant_id: certificate?.participant_id || null,
        timestamp: new Date().toISOString()
      }),
      keepalive: true
    });
  } catch {
    // Activity reporting must never block certificate access.
  }
}
