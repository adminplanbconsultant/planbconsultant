/**
 * Plan B Consultant — enquiry copy to Google Sheets + email.
 * Paste into a Google Apps Script project (see GOOGLE-SHEET-SETUP.md).
 * Script properties required:  WEBHOOK_SECRET  (same value as ENQUIRY_WEBHOOK_TOKEN on Vercel)
 *                              NOTIFY_EMAIL    (comma-separated recipients)
 */
var SHEET_NAME = 'Enquiries';
var TIMEZONE = 'Asia/Kuwait';
var HEADERS = ['Received', 'Reference', 'Name', 'Phone', 'Email', 'Service', 'Programme', 'Destination', 'Preferred contact', 'Language', 'Source', 'Message'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('WEBHOOK_SECRET');
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!secret || data.secret !== secret) return reply({ ok: false, error: 'unauthorized' });
    if (data.event !== 'enquiry.created' || !data.reference) return reply({ ok: false, error: 'bad event' });

    var sheet = getSheet();
    // Idempotent: the site may retry; never add the same reference twice.
    if (sheet.getLastRow() > 1 && sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).createTextFinder(String(data.reference)).matchEntireCell(true).findNext()) {
      return reply({ ok: true, duplicate: true });
    }
    var received = Utilities.formatDate(new Date(Number(data.submittedAt) || Date.now()), TIMEZONE, 'yyyy-MM-dd HH:mm');
    var row = [received, data.reference, data.name, data.phone, data.email, data.service, data.programme, data.destination, data.method, data.locale, data.source, data.message].map(function (v) { return v == null ? '' : String(v); });
    var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    target.setNumberFormat('@'); // plain text: phone numbers keep their "+", and nothing is ever evaluated as a formula
    target.setValues([row]);

    var recipients = props.getProperty('NOTIFY_EMAIL');
    if (recipients) {
      try { sendEmail(recipients, data, received); } catch (err) { console.error('Email failed for ' + data.reference + ': ' + err); }
    }
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: 'server error' });
  } finally {
    lock.releaseLock();
  }
}

function getSheet() {
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#164a2a').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sendEmail(recipients, d, received) {
  var lines = [['Reference', d.reference], ['Received', received + ' (Kuwait time)'], ['Name', d.name], ['Phone / WhatsApp', d.phone], ['Email', d.email || '—'], ['Service', d.service], ['Programme', d.programme], ['Destination', d.destination], ['Language', d.locale], ['Source', d.source], ['Message', d.message || '—']];
  var html = '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
    lines.map(function (l) { return '<tr><td style="color:#555"><b>' + esc(l[0]) + '</b></td><td>' + esc(l[1]) + '</td></tr>'; }).join('') + '</table>';
  var options = { to: recipients, subject: 'New enquiry ' + d.reference + ' — ' + d.name, htmlBody: html, name: 'Plan B Website' };
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) options.replyTo = d.email;
  MailApp.sendEmail(options);
}

function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor to grant permissions and create the header row. */
function setup() {
  getSheet();
  MailApp.getRemainingDailyQuota();
}
