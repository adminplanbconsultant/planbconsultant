# Enquiries → Google Sheet + email (free)

Every saved enquiry (popup, assessment, consultation, contact) is also sent to a Google Apps Script, which adds a row to a Google Sheet and emails the team. PostgreSQL stays the main record; the sheet and email are copies, so a Google outage never loses an enquiry.

## 1. Create the sheet and script (≈5 min)
1. In the company Google account create a new Google Sheet, e.g. **Plan B Enquiries**.
2. **Extensions → Apps Script**. Delete the sample code and paste all of `integrations/google-apps-script/Code.gs`.
3. **Project Settings (gear) → Script properties → Add**:
   - `WEBHOOK_SECRET` — a long random string (e.g. 40+ characters). Keep it private.
   - `NOTIFY_EMAIL` — recipients, comma-separated (e.g. `info@planbconsultant.com`).
4. Select the `setup` function and click **Run**. Accept the permission prompts (Sheets + send email). This creates the header row.
5. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone**. Copy the **Web app URL** (ends in `/exec`).

Whenever you edit the script later: **Deploy → Manage deployments → Edit → New version**, otherwise the live URL keeps running the old code.

## 2. Free database for Vercel (required)
The forms only show success after saving to PostgreSQL. Create a free database (e.g. Neon or Supabase) and copy its pooled connection string. Run `npm run db:setup` once with `DATABASE_URL` set (never on deploy builds).

## 3. Vercel environment variables
| Variable | Value |
|---|---|
| `DATABASE_URL` | pooled PostgreSQL URL (TLS) |
| `RATE_LIMIT_SECRET` | any long random string |
| `ENQUIRY_WEBHOOK_URL` | the Apps Script `/exec` URL |
| `ENQUIRY_WEBHOOK_TOKEN` | the **same** value as `WEBHOOK_SECRET` |

Redeploy after adding them.

## 4. Test before going live
```
curl -L -X POST "<WEB_APP_URL>" -H "Content-Type: application/json" \
  -d '{"event":"enquiry.created","secret":"<WEBHOOK_SECRET>","reference":"PB-TEST0001","name":"Test Person","phone":"+96550001234","email":"","service":"visit-visas","programme":"not-sure","destination":"Not sure yet","method":"not-specified","locale":"en","source":"popup-short-assessment","message":"","submittedAt":1760000000000}'
```
Expect `{"ok":true}`, a new row and an email. Send it again: you should get `"duplicate":true` and no second row. Then submit the real popup once on the deployed site. Delete test rows afterwards.

## Notes
- A wrong secret returns `unauthorized` and writes nothing. The secret travels in the HTTPS request body to your own script only.
- Free Gmail can send about 100 script emails/day (Workspace about 1,500). Rows are still written if email fails.
- Sheet cells are stored as plain text, so phone numbers keep their `+` and submitted text is never run as a formula.
- If the script is unreachable the visitor still sees success (the enquiry is saved); the server logs `Enquiry notification failed; saved reference PB-…`. Reconcile from the database.
- Enquiry details pass through Google. The privacy notice says details go to the company's enquiry system; name Google Sheets/Gmail there if you want it explicit.
- Vercel's free Hobby plan is meant for non-commercial use; a client business site may need Pro eventually.
