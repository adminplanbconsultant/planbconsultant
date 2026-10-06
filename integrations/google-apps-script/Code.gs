/**
 * Plan B Consultant — enquiry intake (Google Sheet + notification email).
 *
 * Website form -> same-origin Next.js API -> THIS web app -> private Google Sheet.
 * Setup: see GOOGLE-SHEET-SETUP.md. Script Properties (Project Settings -> Script properties):
 *   SHARED_SECRET   same value as GOOGLE_APPS_SCRIPT_SECRET on the website (server-only)
 *   SPREADSHEET_ID  id of the private spreadsheet (the long string in its URL)
 *   NOTIFY_EMAIL    recipient(s), comma-separated, e.g. info@planbconsultant.com
 *
 * The web app must be deployed "Execute as: Me" and "Who has access: Anyone".
 * That only means the URL can be called; every call without the shared secret is rejected
 * and nothing in this script ever returns lead data.
 */

var TZ = 'Asia/Kuwait';
var MAX_BODY = 15000;
var MAX_NOTIFY_ATTEMPTS = 5;
var SENDING_STALE_MS = 10 * 60 * 1000;   // a claimed "Sending" row is retried after this long
var RETRY_BATCH = 15;                    // notifications retried per trigger run
var LOCK_WAIT_MS = 20000;
var THROTTLE = { ip: { limit: 8, ttl: 3600 }, phone: { limit: 5, ttl: 3600 } };
var LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Closed', 'Spam'];

var TABS = { quick: 'Quick Assessments', full: 'Full Assessments', contact: 'Contact Enquiries' };
var FORM_LABELS = { quick: 'Quick Assessment', full: 'Full Assessment', contact: 'Contact Enquiry' };
var SOURCES = { quick: 'popup-short-assessment', full: 'full-assessment', contact: 'contact-form' };

var COMMON_HEAD = ['Submission ID', 'Reference', 'Received (UTC)', 'Received (Kuwait)', 'Form source', 'Page path', 'Language', 'Full name', 'Phone', 'Email'];
var TAIL = ['Consent', 'Consent timestamp (UTC)', 'Consent text version', 'Lead status', 'Notification status', 'Notification attempts', 'Last attempt (UTC)', 'Sent (UTC)', 'Last notification error'];
var EXTRA = {
  quick: ['Category', 'Programme', 'Destination'],
  full: ['Category', 'Programme', 'Destination', 'Job offer', 'Preferred contact method', 'Age range', 'Highest education', 'Job designation', 'Nationality', 'Country of residence', 'Investment budget (USD)', 'Additional information'],
  contact: ['Category', 'Message']
};

// <generated:lists> (run `node scripts/sync-apps-script-lists.mjs` after changing services, programmes or countries)
var SERVICES = {
  "residency-by-investment": "Residency through investment",
  "citizenship-by-investment": "Citizenship by investment",
  "skilled-immigration": "Skilled immigration",
  "work-visas": "Work visas & permits",
  "visit-visas": "Visit visas",
  "study-abroad": "Study visas",
  "global-job-search": "Global job search",
  "business-immigration": "Business immigration",
  "family-visas": "Family & dependent visas",
  "permanent-residency": "Permanent residency support",
  "ielts-preparation": "IELTS preparation",
  "settlement-support": "Pre-departure & settlement"
};
var PROGRAMMES = {
  "canada-express-entry": "Canada Express Entry",
  "australia-skilled-migration": "Australia skilled migration",
  "australia-work-visas": "Australia work visas",
  "germany-nursing": "Nursing careers in Germany",
  "germany-car-mechanics": "Car mechanic careers in Germany",
  "sweden-work-permit": "Sweden work permits",
  "portugal-work-residence": "Portugal work & residence",
  "canada-c11": "Canada C11 business owners",
  "usa-eb5": "USA EB-5 investor programme",
  "usa-e2": "USA E-2 treaty investor",
  "citizenship-investment": "Citizenship by investment",
  "study-visas": "Study abroad & student visas",
  "visit-visas": "Visit visas"
};
var DESTINATIONS = ["Canada","Australia","United Kingdom","United States","New Zealand","Schengen","Thailand","Japan","Turkey","China","South Korea","Saudi Arabia","Malaysia","Singapore","Ireland","Cyprus","Russia","Italy","France","Switzerland","Germany","Greece","Finland","Netherlands","Spain","Sweden","Austria","Iceland","Poland","Czech Republic","Lithuania","Latvia","Estonia","Monaco","San Marino","Liechtenstein","Luxembourg","Vatican City","Slovakia","Bulgaria","Slovenia","Hungary","Portugal","Norway","Tanzania","Brazil"];
// </generated:lists>

/* ------------------------------------------------------------------ web app */

function doGet() {
  return json_({ ok: true, service: 'plan-b-enquiries' }); // health only; never returns lead data
}

function doPost(e) {
  try {
    var secret = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    var raw = e && e.postData && e.postData.contents;
    if (!secret) return json_({ ok: false, code: 'unauthorized' });
    if (typeof raw !== 'string' || !raw || raw.length > MAX_BODY) return json_({ ok: false, code: 'invalid' });
    var data;
    try { data = JSON.parse(raw); } catch (parseError) { return json_({ ok: false, code: 'invalid' }); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json_({ ok: false, code: 'invalid' });
    if (typeof data.secret !== 'string' || !safeEqual_(data.secret, secret)) return json_({ ok: false, code: 'unauthorized' });
    var rec = validate_(data);
    if (!rec) return json_({ ok: false, code: 'invalid' });

    var saved = save_(rec);
    if (!saved.ok) return json_({ ok: false, code: saved.code });
    var notification = 'Pending';
    try { notification = notify_(saved.tab, rec.id) || 'Pending'; } catch (notifyError) { notification = 'Pending'; }
    return json_({ ok: true, saved: true, id: rec.id, reference: saved.reference, duplicate: saved.duplicate, notification: notification });
  } catch (error) {
    return json_({ ok: false, code: 'server' }); // never echo error text: it can contain request data
  }
}

function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}

function safeEqual_(a, b) {
  var diff = a.length === b.length ? 0 : 1;
  var length = Math.max(a.length, b.length);
  for (var i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/* --------------------------------------------------------------- validation */

function clean_(value, max) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  var text = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return text.length > max ? null : text;
}

function validate_(d) {
  var form = d.formType;
  if (!TABS.hasOwnProperty(form)) return null;
  if (d.source !== SOURCES[form]) return null;
  var rec = { formType: form, source: d.source };
  var fields = { id: 40, pagePath: 200, locale: 5, name: 100, phone: 30, email: 200, service: 60, programme: 60, destination: 60, offer: 20, method: 20, age: 30, education: 100, profession: 100, nationality: 100, residence: 100, budget: 100, message: 2000, consentVersion: 40, clientKey: 64 };
  for (var key in fields) {
    var value = clean_(d[key], fields[key]);
    if (value === null) return null;
    rec[key] = value;
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(rec.id)) return null;
  if (rec.locale !== 'en' && rec.locale !== 'ar') return null;
  if (d.consent !== true || !/^[a-z0-9.\-]{1,40}$/.test(rec.consentVersion)) return null;
  if (rec.name.length < 2) return null;
  if (!/^\+[0-9]{8,15}$/.test(rec.phone)) return null;
  if (rec.email && !/^[A-Za-z0-9_][^\s@<>,;]*@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(rec.email)) return null;
  if (rec.pagePath && !/^\/[A-Za-z0-9\/_\-.%]*$/.test(rec.pagePath)) return null;
  if (rec.clientKey && !/^[0-9a-f]{64}$/.test(rec.clientKey)) return null;
  if (rec.service !== 'not-sure' && !SERVICES.hasOwnProperty(rec.service)) return null;
  if (form === 'contact') {
    rec.programme = ''; rec.destination = ''; rec.offer = ''; rec.method = '';
    rec.age = ''; rec.education = ''; rec.profession = ''; rec.nationality = ''; rec.residence = ''; rec.budget = '';
  } else {
    if (rec.programme !== 'not-sure' && !PROGRAMMES.hasOwnProperty(rec.programme)) return null;
    if (rec.destination && rec.destination !== 'Not sure yet' && DESTINATIONS.indexOf(rec.destination) < 0) return null;
    if (form === 'quick') {
      rec.offer = ''; rec.method = ''; rec.age = ''; rec.education = ''; rec.profession = ''; rec.nationality = ''; rec.residence = ''; rec.budget = ''; rec.message = '';
    } else {
      if (['', 'yes', 'no', 'not-sure'].indexOf(rec.offer) < 0) return null;
      if (['phone', 'whatsapp', 'email'].indexOf(rec.method) < 0) return null;
      if (rec.method === 'email' && !rec.email) return null;
    }
  }
  rec.reference = 'PB-' + rec.id.slice(0, 8).toUpperCase(); // recomputed, never trusted from the request
  return rec;
}

/** Spreadsheet formula-injection defence: a leading = + - @ tab CR (or our own apostrophe) gets a visible ' prefix. Reversible by unneutralize_. */
function neutralize_(text) {
  text = String(text);
  return /^['=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function unneutralize_(text) {
  text = String(text);
  return text.charAt(0) === "'" ? text.slice(1) : text;
}

/* ------------------------------------------------------------------ sheets */

function headersFor_(form) {
  return COMMON_HEAD.concat(EXTRA[form], TAIL);
}

function spreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('config');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(form) {
  var ss = spreadsheet_();
  var sheet = ss.getSheetByName(TABS[form]) || ss.insertSheet(TABS[form]);
  var headers = headersFor_(form);
  if (sheet.getLastRow() === 0) {
    var head = sheet.getRange(1, 1, 1, headers.length);
    head.setNumberFormat('@');
    head.setValues([headers]);
    try { head.setFontWeight('bold'); sheet.setFrozenRows(1); } catch (cosmetic) { /* cosmetic only */ }
    try {
      if (typeof SpreadsheetApp.newDataValidation === 'function') {
        var statusCol = headers.indexOf('Lead status') + 1;
        sheet.getRange(2, statusCol, 1000, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(LEAD_STATUSES, true).setAllowInvalid(true).build());
      }
    } catch (cosmetic2) { /* cosmetic only */ }
  } else if (String(sheet.getRange(1, 1, 1, 1).getValue()) !== headers[0]) {
    throw new Error('schema'); // never overwrite a sheet that already holds something else
  }
  return sheet;
}

function colIndex_(headers, name) {
  var index = headers.indexOf(name);
  if (index < 0) throw new Error('schema');
  return index;
}

function findRow_(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var hit = sheet.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function findExisting_(id) {
  var ss = spreadsheet_();
  for (var form in TABS) {
    var sheet = ss.getSheetByName(TABS[form]);
    if (!sheet) continue;
    var row = findRow_(sheet, id);
    if (row) {
      var headers = headersFor_(form);
      return { form: form, row: row, reference: String(sheet.getRange(row, colIndex_(headers, 'Reference') + 1, 1, 1).getValue()) };
    }
  }
  return null;
}

function stamp_(date, zone) {
  return Utilities.formatDate(date, zone, 'yyyy-MM-dd HH:mm:ss');
}

function rowValues_(rec, now) {
  var form = rec.formType;
  var map = {
    'Submission ID': rec.id, 'Reference': rec.reference,
    'Received (UTC)': stamp_(now, 'UTC'), 'Received (Kuwait)': stamp_(now, TZ),
    'Form source': rec.source, 'Page path': neutralize_(rec.pagePath), 'Language': rec.locale === 'ar' ? 'Arabic' : 'English',
    'Full name': neutralize_(rec.name), 'Phone': rec.phone, 'Email': neutralize_(rec.email),
    'Category': rec.service === 'not-sure' ? 'Not sure' : SERVICES[rec.service],
    'Programme': rec.programme === 'not-sure' ? 'Not sure' : (rec.programme ? PROGRAMMES[rec.programme] : ''),
    'Destination': rec.destination, 'Job offer': rec.offer, 'Preferred contact method': rec.method,
    'Age range': neutralize_(rec.age), 'Highest education': neutralize_(rec.education), 'Job designation': neutralize_(rec.profession),
    'Nationality': neutralize_(rec.nationality), 'Country of residence': neutralize_(rec.residence), 'Investment budget (USD)': neutralize_(rec.budget),
    'Additional information': neutralize_(rec.message), 'Message': neutralize_(rec.message),
    'Consent': 'Yes', 'Consent timestamp (UTC)': stamp_(now, 'UTC'), 'Consent text version': rec.consentVersion,
    'Lead status': 'New', 'Notification status': 'Pending', 'Notification attempts': '0', 'Last attempt (UTC)': '', 'Sent (UTC)': '', 'Last notification error': ''
  };
  return headersFor_(form).map(function (name) { return map.hasOwnProperty(name) ? String(map[name]) : ''; });
}

/* ---------------------------------------------------------------- save + throttle */

function hashHex_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function throttleKeys_(rec) {
  var keys = [];
  if (rec.clientKey) keys.push({ key: 'th-ip-' + rec.clientKey, limit: THROTTLE.ip.limit, ttl: THROTTLE.ip.ttl });
  keys.push({ key: 'th-ph-' + hashHex_(rec.phone), limit: THROTTLE.phone.limit, ttl: THROTTLE.phone.ttl });
  return keys;
}

/** Best-effort: CacheService can evict early, so this slows abuse; it is not a hard guarantee. */
function isThrottled_(rec) {
  var cache = CacheService.getScriptCache();
  return throttleKeys_(rec).some(function (k) { return Number(cache.get(k.key) || 0) >= k.limit; });
}
function countThrottle_(rec) {
  var cache = CacheService.getScriptCache();
  throttleKeys_(rec).forEach(function (k) { cache.put(k.key, String(Number(cache.get(k.key) || 0) + 1), k.ttl); });
}

function save_(rec) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return { ok: false, code: 'busy' };
  try {
    var existing = findExisting_(rec.id);
    if (existing) return { ok: true, duplicate: true, tab: existing.form, reference: existing.reference };
    if (isThrottled_(rec)) return { ok: false, code: 'throttled' };
    var sheet = ensureSheet_(rec.formType);
    var values = rowValues_(rec, new Date());
    var range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length);
    range.setNumberFormat('@'); // plain text: "+" and leading zeros survive and nothing is evaluated
    range.setValues([values]);
    countThrottle_(rec);
    return { ok: true, duplicate: false, tab: rec.formType, reference: rec.reference };
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------ notifications */

function parseAttempts_(value) {
  var n = parseInt(String(value), 10);
  return isNaN(n) || n < 0 ? 0 : n;
}

function setCells_(sheet, row, headers, changes) {
  for (var name in changes) {
    var cell = sheet.getRange(row, colIndex_(headers, name) + 1, 1, 1);
    cell.setNumberFormat('@');
    cell.setValue(String(changes[name]));
  }
}

/** Marks the row "Sending" under the lock so two executions never email the same lead at once. Returns a snapshot, or null when there is nothing to send. */
function claim_(form, id) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return null;
  try {
    var sheet = spreadsheet_().getSheetByName(TABS[form]);
    if (!sheet) return null;
    var row = findRow_(sheet, id);
    if (!row) return null;
    var headers = headersFor_(form);
    var values = sheet.getRange(row, 1, 1, headers.length).getValues()[0].map(String);
    var get = function (name) { return values[colIndex_(headers, name)]; };
    var status = get('Notification status');
    var attempts = parseAttempts_(get('Notification attempts'));
    if (status === 'Sent' || status === 'Exhausted') return null;
    if (status === 'Sending') {
      var last = Date.parse(get('Last attempt (UTC)').replace(' ', 'T') + 'Z');
      if (!isNaN(last) && Date.now() - last < SENDING_STALE_MS) return null;
    }
    if (attempts >= MAX_NOTIFY_ATTEMPTS) {
      setCells_(sheet, row, headers, { 'Notification status': 'Exhausted' });
      return null;
    }
    setCells_(sheet, row, headers, { 'Notification status': 'Sending', 'Notification attempts': attempts + 1, 'Last attempt (UTC)': stamp_(new Date(), 'UTC') });
    return { form: form, id: id, attemptsBefore: attempts, values: values, headers: headers, spreadsheetUrl: spreadsheet_().getUrl(), gid: sheet.getSheetId() };
  } finally {
    lock.releaseLock();
  }
}

function finalize_(form, id, outcome, attemptsBefore) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) return;
  try {
    var sheet = spreadsheet_().getSheetByName(TABS[form]);
    var row = sheet && findRow_(sheet, id);
    if (!row) return;
    var headers = headersFor_(form);
    if (outcome.ok) {
      setCells_(sheet, row, headers, { 'Notification status': 'Sent', 'Sent (UTC)': stamp_(new Date(), 'UTC'), 'Last notification error': '' });
    } else if (outcome.error === 'quota') {
      // Not the lead's fault and not a real attempt: wait for the daily quota to reset without burning retries.
      setCells_(sheet, row, headers, { 'Notification status': 'Pending', 'Notification attempts': attemptsBefore, 'Last notification error': 'quota' });
    } else {
      var attempts = attemptsBefore + 1;
      setCells_(sheet, row, headers, { 'Notification status': attempts >= MAX_NOTIFY_ATTEMPTS ? 'Exhausted' : 'Failed', 'Last notification error': outcome.error });
    }
  } finally {
    lock.releaseLock();
  }
}

function escapeHtml_(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildEmail_(claim) {
  var h = claim.headers, v = claim.values;
  var get = function (name) { var i = h.indexOf(name); return i < 0 ? '' : unneutralize_(v[i]); };
  var form = claim.form, reference = get('Reference');
  var phone = get('Phone'), digits = phone.replace(/[^0-9]/g, '');
  var ar = get('Language') === 'Arabic';
  var greeting = ar ? 'مرحباً ' + get('Full name') + '، معك فريق بلان بي للاستشارات بخصوص استفسارك رقم ' + reference + '.'
                    : 'Hello ' + get('Full name') + ', this is Plan B Consultant about your enquiry ' + reference + '.';
  var whatsapp = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(greeting);
  var sheetLink = claim.spreadsheetUrl + '#gid=' + claim.gid;
  var skip = { 'Submission ID': 1, 'Reference': 1, 'Received (UTC)': 1, 'Received (Kuwait)': 1, 'Lead status': 1, 'Notification status': 1, 'Notification attempts': 1, 'Last attempt (UTC)': 1, 'Sent (UTC)': 1, 'Last notification error': 1, 'Consent': 1, 'Consent timestamp (UTC)': 1, 'Consent text version': 1 };
  var rows = [['Reference', reference], ['Received (Kuwait)', get('Received (Kuwait)')], ['Form', FORM_LABELS[form]]];
  h.forEach(function (name) { var value = get(name); if (!skip[name] && value) rows.push([name, value]); });
  rows.push(['Consent', 'Given (' + get('Consent timestamp (UTC)') + ' UTC, text version ' + get('Consent text version') + ')']);
  var text = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n\nContact on WhatsApp: ' + whatsapp + '\nSpreadsheet (private): ' + sheetLink + '\n';
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1c2b21;max-width:640px">' +
    '<h2 style="margin:0 0 12px;color:#1c472a">New ' + escapeHtml_(FORM_LABELS[form]) + ' — Plan B Consultant</h2>' +
    '<table style="border-collapse:collapse;width:100%">' + rows.map(function (r) {
      return '<tr><td style="padding:6px 12px 6px 0;color:#5d6a5f;vertical-align:top;white-space:nowrap">' + escapeHtml_(r[0]) + '</td><td style="padding:6px 0;white-space:pre-wrap">' + escapeHtml_(r[1]) + '</td></tr>';
    }).join('') + '</table>' +
    '<p style="margin:20px 0 8px"><a href="' + escapeHtml_(whatsapp) + '" style="background:#1c472a;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:4px;display:inline-block">Contact this lead on WhatsApp</a></p>' +
    '<p style="margin:8px 0"><a href="' + escapeHtml_(sheetLink) + '">Open the private spreadsheet</a></p></div>';
  var email = get('Email');
  return {
    to: PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL'),
    subject: 'New ' + FORM_LABELS[form] + ' — Plan B Consultant — ' + reference,
    body: text, htmlBody: html, name: 'Plan B Website',
    replyTo: /^[A-Za-z0-9_][^\s@<>,;]*@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(email) ? email : ''
  };
}

function send_(claim) {
  try {
    if (!PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL')) return { ok: false, error: 'config' };
    if (MailApp.getRemainingDailyQuota() <= 0) return { ok: false, error: 'quota' };
    var message = buildEmail_(claim);
    if (!message.replyTo) delete message.replyTo;
    MailApp.sendEmail(message);
    return { ok: true };
  } catch (error) {
    var text = String(error && error.message || error);
    return { ok: false, error: /quota|too many times|limit exceeded/i.test(text) ? 'quota' : 'mail_error' }; // code only: error text may contain addresses
  }
}

function currentStatus_(form, id) {
  var sheet = spreadsheet_().getSheetByName(TABS[form]);
  var row = sheet && findRow_(sheet, id);
  if (!row) return 'Pending';
  var headers = headersFor_(form);
  return String(sheet.getRange(row, colIndex_(headers, 'Notification status') + 1, 1, 1).getValue()) || 'Pending';
}

function notify_(form, id) {
  var claim = claim_(form, id);
  if (claim) finalize_(form, id, send_(claim), claim.attemptsBefore);
  return currentStatus_(form, id);
}

/* ------------------------------------------------- scheduled retry + setup */

/** Run by the time-driven trigger (every 15 minutes). Retries Pending/Failed rows and rows stuck in "Sending". */
function retryPendingNotifications() {
  if (MailApp.getRemainingDailyQuota() <= 0) return;
  var budget = RETRY_BATCH;
  var ss = spreadsheet_();
  for (var form in TABS) {
    var sheet = ss.getSheetByName(TABS[form]);
    if (!sheet || sheet.getLastRow() < 2) continue;
    var headers = headersFor_(form);
    var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    var iStatus = colIndex_(headers, 'Notification status'), iId = 0;
    for (var r = 0; r < rows.length && budget > 0; r++) {
      var status = String(rows[r][iStatus]);
      if (status === 'Pending' || status === 'Failed' || status === 'Sending') {
        notify_(form, String(rows[r][iId]));
        budget--;
      }
    }
  }
}

/** Run once from the editor: creates the three tabs (never overwrites existing data) and checks the Script Properties. */
function setup() {
  var props = PropertiesService.getScriptProperties();
  ['SHARED_SECRET', 'SPREADSHEET_ID', 'NOTIFY_EMAIL'].forEach(function (name) {
    if (!props.getProperty(name)) throw new Error('Missing Script Property: ' + name);
  });
  if (props.getProperty('SHARED_SECRET').length < 32) throw new Error('SHARED_SECRET must be at least 32 characters.');
  for (var form in TABS) ensureSheet_(form);
  Logger.log('Sheets ready: ' + Object.keys(TABS).map(function (k) { return TABS[k]; }).join(', '));
}

/** Run once from the editor: installs the 15-minute retry trigger (replacing any previous one). */
function setupRetryTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'retryPendingNotifications') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('retryPendingNotifications').timeBased().everyMinutes(15).create();
  Logger.log('Retry trigger installed (every 15 minutes).');
}
