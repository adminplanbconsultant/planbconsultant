# Enquiries → private Google Sheet + email (free)

```
Website form → same-origin API (/api/enquiries) → Google Apps Script web app → private Google Sheet
                                                         └→ notification email (MailApp) to info@planbconsultant.com
```

There is **no database**. A visitor sees "Thank you. We've received your enquiry." only after Apps Script confirms the row is in the sheet. If the sheet cannot be reached, the visitor sees an error, keeps what they typed, and can retry (the retry reuses the same submission ID, so it can never create a duplicate row).

Nothing in this repository has been deployed or tested against live Google services. Follow the steps below, then run the live checks in section 7.

---

## 1. Create the private spreadsheet

1. Sign in to the Google account that should own the leads (the account that will also *send* the notification emails — Apps Script sends from the account that authorises it; the site never spoofs `info@planbconsultant.com` as sender).
2. Create a new Google Sheet, e.g. **Plan B Enquiries**. Leave it empty.
3. Keep it private: **Share** → *General access: Restricted*. Add only the staff who must read leads.
4. Copy the spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**. Delete the sample code.
2. Paste the whole of [`integrations/google-apps-script/Code.gs`](integrations/google-apps-script/Code.gs). Save.
3. **Project Settings (gear icon) → Script properties → Add script property**, three times:

| Property | Value |
|---|---|
| `SHARED_SECRET` | A long random string, **at least 32 characters** (e.g. generate one with a password manager). Keep it private. |
| `SPREADSHEET_ID` | The ID from step 1.4 |
| `NOTIFY_EMAIL` | `info@planbconsultant.com` (comma-separate for several recipients) |

4. In the editor's function dropdown choose **`setup`** → **Run**. Google asks for authorisation (spreadsheets, send email, external request/triggers). Review and **Allow**. (On "Google hasn't verified this app", choose *Advanced → Go to … (unsafe)*: it is your own script.) `setup` creates the three tabs — **Quick Assessments**, **Full Assessments**, **Contact Enquiries** — and never overwrites a tab that already holds other data.
5. Choose **`setupRetryTrigger`** → **Run**. This installs the 15-minute trigger that retries unsent notification emails. (Check under the clock icon → *Triggers*.)

## 3. Deploy as a web app

1. **Deploy → New deployment → ⚙ Select type → Web app**.
2. *Description*: `Plan B enquiries v1`. **Execute as: Me**. **Who has access: Anyone**.
   *"Anyone" only means the URL can be called without a Google login. Every call without the shared secret is rejected, nothing is written, and the script never returns lead data.*
3. **Deploy**, copy the **Web app URL** (ends in `/exec`).

### Redeploying after code changes
Saving the script does **not** update the live URL. After any edit: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**. The URL stays the same. If services, programmes or destinations change on the website, run `node scripts/sync-apps-script-lists.mjs`, paste the updated `Code.gs`, and redeploy (`node scripts/sync-apps-script-lists.mjs --check` fails when they are out of sync).

## 4. Configure the website (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Public? |
|---|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | the `/exec` URL | **No** (server-only) |
| `GOOGLE_APPS_SCRIPT_SECRET` | exactly the same string as `SHARED_SECRET` | **No** (server-only) |
| `TURNSTILE_SECRET_KEY` | optional, see section 5 | **No** |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional, see section 5 | yes (site keys are public by design) |

Never commit real values; `.env.example` holds placeholders only. Redeploy the website after changing variables (`NEXT_PUBLIC_*` values are compiled in at build time). `DATABASE_URL` and `RATE_LIMIT_SECRET` are no longer used and can be deleted from Vercel.

## 5. Spam protection (no database needed)

Layers, all free:

1. **Honeypot, validation, body-size cap and same-origin check** on the website API (unchanged).
2. **Cloudflare Turnstile** (recommended): <https://dash.cloudflare.com> → *Turnstile* → *Add widget* → hostnames `planbconsultant.com` and `www.planbconsultant.com` → mode *Managed*. Put the **site key** in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **secret key** in `TURNSTILE_SECRET_KEY`, then redeploy. With both set, the widget appears on all three forms and the server verifies every token before saving. With `TURNSTILE_SECRET_KEY` unset the check is skipped (and no widget is shown if the site key is also unset).
3. **Throttling inside Apps Script** (`CacheService`): at most 8 new enquiries per visitor per hour and 5 per phone number per hour. The website sends only an HMAC of the visitor's IP address, never the raw address. Retries of an already-saved enquiry never count.

Limitations: Apps Script cache is best-effort (Google may evict entries early) and the visitor key is per IP, so it slows abuse but is not a hard limit; a determined attacker rotating IPs and phone numbers can still add rows. Turnstile is the primary defence. Gmail also caps script email (about 100/day for free accounts, about 1,500 for Workspace); a spam flood can therefore delay legitimate notification emails (rows are still saved).

## 6. What staff see

### Tabs and columns

Every tab starts with the same identity columns and ends with the same tracking columns:

| Column | Notes |
|---|---|
| Submission ID | UUID generated by the browser for each attempt; the duplicate-prevention key |
| Reference | `PB-` + first 8 characters of the ID; shown to the visitor |
| Received (UTC) / Received (Kuwait) | Stamped by Apps Script, `yyyy-MM-dd HH:mm:ss` |
| Form source | `popup-short-assessment`, `full-assessment` or `contact-form` |
| Page path | Path only (no query string) where the form was submitted |
| Language | English / Arabic |
| Full name, Phone, Email | Phone is international (`+` and digits), stored as text so `+` and zeros survive. Email may be blank |
| …form-specific columns… | see below |
| Consent | `Yes` (a form cannot be submitted without it) |
| Consent timestamp (UTC), Consent text version | version constant `consentVersion` in `lib/enquiry-schema.ts`; bump it when consent wording changes |
| Lead status | `New` initially; dropdown: New / Contacted / Qualified / Closed / Spam (edit freely) |
| Notification status / attempts / Last attempt (UTC) / Sent (UTC) / Last notification error | see section 8 |

Form-specific columns (only what each form actually collects; blanks mean "not provided", nothing is invented):

* **Quick Assessments** (popup): Category, Programme, Destination (derived from the chosen programme, blank if "not sure")
* **Full Assessments**: Category, Programme, Destination, Job offer, Preferred contact method, Age range, Highest education, Job designation, Nationality, Country of residence, Investment budget (USD, blank when not applicable), Additional information
* **Contact Enquiries**: Category, Message

Website field → column: `service`→Category, `programme`→Programme (title), `destination`→Destination, `offer`→Job offer, `method`→Preferred contact method, `age`→Age range, `education`→Highest education, `profession`→Job designation, `nationality`→Nationality, `residence`→Country of residence, `budget`→Investment budget (USD), `message`→Additional information / Message.

Safety: every cell is written as plain text, and any user value beginning with `=`, `+`, `-`, `@`, a tab or a carriage return (or an apostrophe) gets a visible `'` prefix so it can never run as a spreadsheet formula (also when exported to CSV/Excel). The notification email shows the original text.

**Do not** reorder, rename or delete the header row or the first two columns — the script finds columns by header name and rows by Submission ID. Sorting or filtering the data rows is fine. Do not publish the sheet or add "anyone with the link" access.

### The notification email

* To `NOTIFY_EMAIL`, sent from the authorising Google account (display name "Plan B Website"), **Reply-To** = the visitor's email when they gave a valid one.
* Subject: `New Quick Assessment — Plan B Consultant — PB-XXXXXXXX` (likewise *Full Assessment*, *Contact Enquiry*).
* Body (HTML with plain-text fallback, all user content escaped): reference, Kuwait time, form and language, contact details, programme/destination and supplied fields, consent confirmation, a link to the private sheet, and **Contact this lead on WhatsApp** (`https://wa.me/<digits>` with a short pre-filled greeting in the visitor's language).
* No automatic customer emails and no automatic WhatsApp messages are sent. WhatsApp follow-up is a manual tap on that link (free).

## 7. Live checks (still to be done — nothing below has been run against real Google services)

Use obviously fake test data and delete the test rows afterwards. These will send real emails to `NOTIFY_EMAIL`.

1. **Health**: open the `/exec` URL in a browser → `{"ok":true,"service":"plan-b-enquiries"}`.
2. **Wrong secret** (replace `<URL>`):
   ```
   curl -L -X POST "<URL>" -H "Content-Type: text/plain" -d '{"secret":"wrong"}'
   ```
   Expect `{"ok":false,"code":"unauthorized"}`.
3. On the deployed site submit each form once, in English and Arabic: popup (wait for it or use the "Free consultation" actions), `/en/consultation`, `/en/contact`. Confirm for each: success message and reference, one new row in the correct tab with correct values, one email with working WhatsApp and sheet links, Reply-To set when an email was entered.
4. Refresh/resubmit quickly: still one row. Disconnect the network mid-submit: the form keeps its values and shows an error.
5. Submit `=1+1` as the name: the cell shows `'=1+1` (text), not `2`.
6. Failure path: temporarily set `NOTIFY_EMAIL` to something invalid or remove the `MailApp` permission → the enquiry is still saved, notification shows `Failed`; fix it and run `retryPendingNotifications` from the editor → `Sent`.
7. If Turnstile is enabled, confirm the widget appears and submissions succeed on desktop and mobile.

## 8. Notification retries and failure modes

Status values in **Notification status**:

| Status | Meaning |
|---|---|
| Pending | Saved, email not sent yet (never attempted, or Gmail quota exhausted — retried automatically, attempts not consumed) |
| Sending | An execution has claimed the row; if it is still "Sending" after 10 minutes it is treated as crashed and retried |
| Sent | Delivered to Gmail's send queue |
| Failed | The last attempt failed; the trigger retries every 15 minutes |
| Exhausted | 5 failed attempts. Staff must send manually (the data is in the sheet) and may reset the row to `Pending` + attempts `0` after fixing the cause |

Inspect problems: filter **Notification status** for anything other than `Sent`, or open Apps Script → **Executions**. **Last notification error** holds only a short code (`mail_error`, `quota`, `config`), never personal data. Apps Script logs no personal data.

Remaining failure modes:

* **Residual duplicate email**: rows are claimed under a lock so two executions never send at once. If an execution dies *after* Gmail accepted the message but *before* it recorded `Sent`, the row is retried after 10 minutes and one duplicate email is possible. No duplicate sheet row can result.
* **Gmail quota** (free ≈ 100 emails/day): leads are still saved; notifications stay `Pending` and go out after the quota resets.
* **Apps Script outage / slow response**: the website waits at most about 20 seconds (two attempts), then tells the visitor to retry. If the first attempt actually saved the row, the retry with the same ID returns the existing reference — no duplicate.
* **Authorisation expiry**: if Google revokes the script's permission (password change, security review) saving fails and visitors see the retry message. Re-run `setup` in the editor and re-authorise, then redeploy.
* **Shared-secret mismatch** between Vercel and Script Properties: all submissions fail with the generic error; check both values and redeploy.
* **Spreadsheet limits**: a Google Sheet holds up to 10 million cells; archive old rows before then. Lead lookup by Submission ID slows slightly with very large sheets.
* **Data location**: enquiry details pass through Google (Sheets and Gmail). The website's privacy notice says so. Decide your own retention policy for old leads.

## 9. Local testing without Google

```
npm run build
npm run test:enquiries            # Apps Script logic + website API against MOCK Google services
node scripts/mock-enquiry-stack.mjs   # leaves :3107 (mock sheet) and :3000 (unconfigured) running, then in another terminal:
node scripts/enquiry-ui-qa.mjs        # forms in a real browser
QA_SHORT=1 node scripts/assessment-popup-qa.mjs
```

These are **mocked** tests: they run `Code.gs` in a Node sandbox with in-memory fakes of the Google services. They cannot prove real Google behaviour (cross-execution locking, quotas, the real redirect, authorisation). Section 7 is the live verification.
