const crypto = require("crypto");

function getSecret() {
  const secret = process.env.CERT_TOKEN_SECRET;
  if (!secret) throw new Error("CERT_TOKEN_SECRET is not configured");
  return secret;
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function createToken(certificateNumber) {
  const payload = Buffer.from(JSON.stringify({
    certificate_number: certificateNumber,
    v: 1
  })).toString("base64url");

  return payload + "." + sign(payload);
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  const expected = sign(payload);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = { createToken, verifyToken };
