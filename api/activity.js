module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const url = process.env.MAKE_ACTIVITY_WEBHOOK_URL;

  // Activity reporting is intentionally non-blocking for the participant.
  if (url) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body || {})
      });
    } catch (error) {
      console.error("Activity reporting failed:", error);
    }
  }

  return res.status(200).json({ success: true });
};
