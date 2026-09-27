# NICEGENE TIS Certificate App

On-demand certificate access and rendering for NICEGENE Tech Insight Series (TIS).

## Architecture

- Google Sheet remains the certificate record source of truth.
- Make controls eligibility, approval, token creation, and participant email.
- Vercel serves the participant-facing certificate application.
- Certificates are rendered on demand; no certificate files are permanently stored.
- QR codes point to a certificate verification URL.
- Corrections are handled manually through NICEGENE WhatsApp support.

## Current status

Initial application scaffold created. The production certificate template asset and final social links are still pending.

## Required Vercel environment variables

- `CERT_TOKEN_SECRET`
- `MAKE_SHARED_SECRET`
- `CERTIFICATE_LOOKUP_URL`
- `MAKE_ACTIVITY_WEBHOOK_URL` (optional)

## Data contract

The certificate lookup endpoint should return:

```json
{
  "success": true,
  "certificate": {
    "participant_id": "NG-TIS02-...",
    "certificate_number": "NG-TIS02-CERT-0001",
    "certificate_display_name": "Example Participant",
    "issue_date": "2026-10-11",
    "verification_url": "https://nicegene.../verify/NG-TIS02-CERT-0001",
    "verification_message": "This certificate is valid and was issued by NICEGENE Technologies to Example Participant for actively participating in NICEGENE Tech Insight Series (TIS), Episode 002."
  }
}
```
