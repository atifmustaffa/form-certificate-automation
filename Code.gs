// ========================================
// CHANGE THESE SETTINGS ONLY
// ========================================

const CONFIG = {
  // Google Slides certificate template ID.
  templateId: 'YOUR_SLIDES_TEMPLATE_ID',

  // Google Drive folder ID for generated PDF certificates.
  outputFolderId: 'YOUR_OUTPUT_FOLDER_ID',

  // Exact Google Sheet column names.
  emailHeader: 'Email',
  nameHeader: 'Nama Penuh',
  icHeader: 'No. Kad Pengenalan',

  // Certificate number example: CERT-2026-0001.
  certificatePrefix: 'CERT-2026',

  // Display settings.
  uppercaseName: true,
  formatMalaysianIc: true,

  // Email settings.
  senderName: 'Urus Setia Program',
  emailSubject: 'Sijil Penyertaan Program'
};

// Fixed information shared by every certificate.
// Use these in Google Slides as {{@nama_program@}}, {{@tarikh@}}, etc.
const TEMPLATE_CONSTANTS = {
  nama_program: 'NAMA PROGRAM ANDA',
  tarikh: '1 September 2026',
  tempat: 'TEMPAT PROGRAM'
};

// Email message sent with every certificate.
const EMAIL_TEMPLATE = [
  'Assalamualaikum / Salam sejahtera,',
  '',
  'Tuan/Puan,',
  '',
  'Dilampirkan ialah sijil penyertaan bagi program:',
  '',
  `Program: ${TEMPLATE_CONSTANTS.nama_program}`,
  `Tarikh: ${TEMPLATE_CONSTANTS.tarikh}`,
  `Tempat: ${TEMPLATE_CONSTANTS.tempat}`,
  '',
  'Terima kasih.',
  '',
  CONFIG.senderName
].join('\n');

// ========================================
// NO CHANGES NEEDED BELOW THIS LINE
// ========================================

const SYSTEM_COLUMNS = {
  status: 'Certificate Status',
  certificateId: 'Certificate ID',
  certificateUrl: 'Certificate URL',
  sentAt: 'Certificate Sent At',
  error: 'Certificate Error',
  processingStartedAt: 'Certificate Processing Started At'
};

const CERTIFICATE_STATUS = {
  queued: 'QUEUED',
  processing: 'PROCESSING',
  sent: 'SENT',
  error: 'ERROR'
};

const QUEUE_CONFIG = {
  batchSize: 5,
  staleAfterMinutes: 15
};

const SCRIPT_PROPERTIES = {
  generationEnabled: 'CERTIFICATE_GENERATION_ENABLED',
  spreadsheetId: 'CERTIFICATE_SPREADSHEET_ID',
  sheetId: 'CERTIFICATE_SHEET_ID'
};

const GENERATION_INDICATOR = {
  runningBackground: '#b7e1cd',
  stoppedBackground: '#f4c7c3'
};

function setupCertificateAutomation() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  ensureSystemColumns(sheet);
  validateRequiredHeaders(getHeaders(sheet));
  rememberResponseSheet(sheet);

  const properties = PropertiesService.getScriptProperties();

  if (properties.getProperty(SCRIPT_PROPERTIES.generationEnabled) === null) {
    properties.setProperty(SCRIPT_PROPERTIES.generationEnabled, 'true');
  }

  updateCertificateStatusIndicator(sheet);

  const handlers = ScriptApp
    .getProjectTriggers()
    .map(trigger => trigger.getHandlerFunction());

  if (!handlers.includes('onFormSubmit')) {
    ScriptApp
      .newTrigger('onFormSubmit')
      .forSpreadsheet(spreadsheet)
      .onFormSubmit()
      .create();
  }

  if (!handlers.includes('processCertificateQueue')) {
    ScriptApp
      .newTrigger('processCertificateQueue')
      .timeBased()
      .everyMinutes(1)
      .create();
  }

  spreadsheet.toast(
    'Certificate automation is ready.',
    'Certificate',
    5
  );
}

function onOpen() {
  SpreadsheetApp
    .getUi()
    .createMenu('> Auto Certificate <')
    .addItem('▶️ Start Generating', 'startCertificateGeneration')
    .addItem('⏸️ Stop Generating', 'stopCertificateGeneration')
    .addSeparator()
    .addItem('⚡ Process Queue Now', 'processQueueNow')
    .addItem('📊 Queue Status', 'showQueueStatus')
    .addToUi();
}

function onFormSubmit(e) {
  if (!e?.range) {
    throw new Error(
      'This function must run from a Spreadsheet "On form submit" trigger.'
    );
  }

  const sheet = e.range.getSheet();
  const row = e.range.getRow();

  rememberResponseSheet(sheet);

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);
    ensureSystemColumns(sheet);

    const headers = getHeaders(sheet);
    validateRequiredHeaders(headers);

    const values = sheet
      .getRange(row, 1, 1, headers.length)
      .getDisplayValues()[0];

    const status = normalizeStatus(
      values[headers.indexOf(SYSTEM_COLUMNS.status)]
    );
    const sentAt = values[headers.indexOf(SYSTEM_COLUMNS.sentAt)];

    if (hasBeenSent(status, sentAt)) {
      setValue(
        sheet,
        headers,
        row,
        SYSTEM_COLUMNS.status,
        CERTIFICATE_STATUS.sent
      );
      return;
    }

    if (status && status !== CERTIFICATE_STATUS.queued) {
      return;
    }

    queueRow(sheet, headers, row);
  } finally {
    lock.releaseLock();
  }
}

function processCertificateQueue() {
  const summary = {
    processed: 0,
    sent: 0,
    failed: 0,
    quotaExhausted: false,
    stopped: false
  };

  const sheet = getResponseSheet();
  updateCertificateStatusIndicator(sheet);

  if (!isCertificateGenerationEnabled()) {
    summary.stopped = true;
    return summary;
  }

  for (let index = 0; index < QUEUE_CONFIG.batchSize; index++) {
    if (!isCertificateGenerationEnabled()) {
      summary.stopped = true;
      break;
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      summary.quotaExhausted = true;
      break;
    }

    const row = claimNextQueuedRow(sheet);

    if (!row) {
      break;
    }

    summary.processed++;

    try {
      const result = processRow(sheet, row);

      if (result === CERTIFICATE_STATUS.sent) {
        summary.sent++;
      } else if (result === 'QUOTA_EXHAUSTED') {
        summary.quotaExhausted = true;
        break;
      } else if (result === CERTIFICATE_STATUS.error) {
        summary.failed++;
      }
    } catch (error) {
      summary.failed++;
      console.error(`Row ${row} failed:`, getErrorMessage(error));
    }
  }

  console.log(`Queue worker: ${JSON.stringify(summary)}`);
  return summary;
}

function claimNextQueuedRow(sheet) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);
    ensureSystemColumns(sheet);

    const headers = getHeaders(sheet);
    validateRequiredHeaders(headers);

    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      return null;
    }

    const statusIndex = headers.indexOf(SYSTEM_COLUMNS.status);
    const sentAtIndex = headers.indexOf(SYSTEM_COLUMNS.sentAt);
    const startedAtIndex = headers.indexOf(
      SYSTEM_COLUMNS.processingStartedAt
    );
    const emailIndex = headers.indexOf(CONFIG.emailHeader);
    const nameIndex = headers.indexOf(CONFIG.nameHeader);

    const rows = sheet
      .getRange(2, 1, lastRow - 1, headers.length)
      .getValues();

    for (let index = 0; index < rows.length; index++) {
      const values = rows[index];
      const row = index + 2;
      const status = normalizeStatus(values[statusIndex]);
      const sentAt = values[sentAtIndex];
      const email = String(values[emailIndex] ?? '').trim();
      const name = String(values[nameIndex] ?? '').trim();

      if (!email && !name) {
        continue;
      }

      if (hasBeenSent(status, sentAt)) {
        if (status !== CERTIFICATE_STATUS.sent) {
          setValue(
            sheet,
            headers,
            row,
            SYSTEM_COLUMNS.status,
            CERTIFICATE_STATUS.sent
          );
        }

        continue;
      }

      const isQueued = status === CERTIFICATE_STATUS.queued || !status;
      const isStale =
        status === CERTIFICATE_STATUS.processing &&
        isStaleProcessing(values[startedAtIndex]);

      if (!isQueued && !isStale) {
        continue;
      }

      setValue(
        sheet,
        headers,
        row,
        SYSTEM_COLUMNS.status,
        CERTIFICATE_STATUS.processing
      );
      setValue(
        sheet,
        headers,
        row,
        SYSTEM_COLUMNS.processingStartedAt,
        new Date()
      );
      setValue(sheet, headers, row, SYSTEM_COLUMNS.error, '');

      return row;
    }

    return null;
  } finally {
    lock.releaseLock();
  }
}

function processRow(sheet, row) {
  const headers = getHeaders(sheet);
  const values = sheet
    .getRange(row, 1, 1, headers.length)
    .getDisplayValues()[0];

  const data = Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ''])
  );

  validateRequiredHeaders(headers);

  const status = normalizeStatus(data[SYSTEM_COLUMNS.status]);
  const sentAt = data[SYSTEM_COLUMNS.sentAt];

  if (hasBeenSent(status, sentAt)) {
    setValue(
      sheet,
      headers,
      row,
      SYSTEM_COLUMNS.status,
      CERTIFICATE_STATUS.sent
    );
    return CERTIFICATE_STATUS.sent;
  }

  if (status !== CERTIFICATE_STATUS.processing) {
    return 'SKIPPED';
  }

  const rawName = String(data[CONFIG.nameHeader] ?? '').trim();
  const email = String(data[CONFIG.emailHeader] ?? '').trim();

  if (!rawName) {
    markError(
      sheet,
      headers,
      row,
      `Missing value for "${CONFIG.nameHeader}".`
    );
    return CERTIFICATE_STATUS.error;
  }

  if (!isValidEmail(email)) {
    markError(sheet, headers, row, `Invalid email: ${email}`);
    return CERTIFICATE_STATUS.error;
  }

  if (MailApp.getRemainingDailyQuota() < 1) {
    queueRow(sheet, headers, row);
    return 'QUOTA_EXHAUSTED';
  }

  const existingCertificateId = String(
    data[SYSTEM_COLUMNS.certificateId] ?? ''
  ).trim();

  const certificateId =
    existingCertificateId ||
    `${CONFIG.certificatePrefix}-${String(row - 1).padStart(4, '0')}`;

  data[SYSTEM_COLUMNS.certificateId] = certificateId;

  setValue(
    sheet,
    headers,
    row,
    SYSTEM_COLUMNS.certificateId,
    certificateId
  );
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, '');

  let temporarySlidesFile = null;
  let emailSent = false;

  try {
    const folder = DriveApp.getFolderById(CONFIG.outputFolderId);
    const template = DriveApp.getFileById(CONFIG.templateId);

    temporarySlidesFile = template.makeCopy(
      `TEMP - ${certificateId}`,
      folder
    );

    const presentation = SlidesApp.openById(temporarySlidesFile.getId());

    replaceTemplateConstants(presentation);
    replaceSheetPlaceholders(presentation, data);

    presentation.saveAndClose();
    Utilities.sleep(1000);

    const displayName = CONFIG.uppercaseName
      ? rawName.toUpperCase()
      : rawName;

    const filename = `${certificateId} - ${sanitizeFilename(displayName)}.pdf`;

    const pdfBlob = DriveApp
      .getFileById(temporarySlidesFile.getId())
      .getAs(MimeType.PDF)
      .setName(filename);

    const pdfFile = folder.createFile(pdfBlob);

    setValue(
      sheet,
      headers,
      row,
      SYSTEM_COLUMNS.certificateUrl,
      pdfFile.getUrl()
    );

    MailApp.sendEmail({
      to: email,
      subject: CONFIG.emailSubject,
      body: EMAIL_TEMPLATE,
      name: CONFIG.senderName,
      attachments: [pdfBlob]
    });

    emailSent = true;
    markSent(sheet, headers, row);

    return CERTIFICATE_STATUS.sent;
  } catch (error) {
    if (emailSent) {
      try {
        markSent(sheet, headers, row);
        return CERTIFICATE_STATUS.sent;
      } catch (trackingError) {
        console.error(
          `Email sent for row ${row}, but SENT could not be recorded:`,
          getErrorMessage(trackingError)
        );
        throw trackingError;
      }
    }

    try {
      markError(sheet, headers, row, getErrorMessage(error));
    } catch (trackingError) {
      console.error(
        `Unable to record the error for row ${row}:`,
        getErrorMessage(trackingError)
      );
    }

    throw error;
  } finally {
    if (temporarySlidesFile) {
      try {
        temporarySlidesFile.setTrashed(true);
      } catch (error) {
        console.error('Unable to delete temporary Slides file:', error);
      }
    }
  }
}

function startCertificateGeneration() {
  PropertiesService
    .getScriptProperties()
    .setProperty(SCRIPT_PROPERTIES.generationEnabled, 'true');

  updateCertificateStatusIndicator(getResponseSheet());

  SpreadsheetApp
    .getActiveSpreadsheet()
    .toast('Certificate generation started.', 'Certificate', 5);
}

function stopCertificateGeneration() {
  PropertiesService
    .getScriptProperties()
    .setProperty(SCRIPT_PROPERTIES.generationEnabled, 'false');

  updateCertificateStatusIndicator(getResponseSheet());

  SpreadsheetApp
    .getActiveSpreadsheet()
    .toast('Certificate generation stopped.', 'Certificate', 5);
}

function processQueueNow() {
  const ui = SpreadsheetApp.getUi();

  if (!isCertificateGenerationEnabled()) {
    ui.alert('Certificate generation is currently stopped.');
    return;
  }

  const summary = processCertificateQueue();

  SpreadsheetApp
    .getActiveSpreadsheet()
    .toast(formatQueueSummary(summary), 'Certificate', 8);
}

function showQueueStatus() {
  const sheet = getResponseSheet();
  const counts = getQueueCounts(sheet);
  const state = isCertificateGenerationEnabled() ? 'ON ✅' : 'OFF 🛑';

  SpreadsheetApp.getUi().alert(
    [
      `Certificate Generation: ${state}`,
      '',
      `Queued: ${counts.queued}`,
      `Processing: ${counts.processing}`,
      `Sent: ${counts.sent}`,
      `Errors: ${counts.error}`
    ].join('\n')
  );
}

function regenerateMissingCertificates() {
  const sheet = getResponseSheet();
  const lock = LockService.getScriptLock();
  let queued = 0;
  let skipped = 0;

  try {
    lock.waitLock(30000);
    ensureSystemColumns(sheet);

    const headers = getHeaders(sheet);
    validateRequiredHeaders(headers);

    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      console.log('No submissions found.');
      return;
    }

    const statusIndex = headers.indexOf(SYSTEM_COLUMNS.status);
    const sentAtIndex = headers.indexOf(SYSTEM_COLUMNS.sentAt);
    const startedAtIndex = headers.indexOf(
      SYSTEM_COLUMNS.processingStartedAt
    );
    const emailIndex = headers.indexOf(CONFIG.emailHeader);
    const nameIndex = headers.indexOf(CONFIG.nameHeader);

    const rows = sheet
      .getRange(2, 1, lastRow - 1, headers.length)
      .getValues();

    rows.forEach((values, index) => {
      const row = index + 2;
      const status = normalizeStatus(values[statusIndex]);
      const email = String(values[emailIndex] ?? '').trim();
      const name = String(values[nameIndex] ?? '').trim();

      if (!email && !name) {
        skipped++;
        return;
      }

      if (hasBeenSent(status, values[sentAtIndex])) {
        if (status !== CERTIFICATE_STATUS.sent) {
          setValue(
            sheet,
            headers,
            row,
            SYSTEM_COLUMNS.status,
            CERTIFICATE_STATUS.sent
          );
        }

        skipped++;
        return;
      }

      const recoverable =
        !status ||
        status === CERTIFICATE_STATUS.error ||
        (status === CERTIFICATE_STATUS.processing &&
          isStaleProcessing(values[startedAtIndex]));

      if (!recoverable) {
        skipped++;
        return;
      }

      queueRow(sheet, headers, row);
      queued++;
    });
  } finally {
    lock.releaseLock();
  }

  const message = `Recovery finished. Queued: ${queued}, Skipped: ${skipped}`;
  console.log(message);
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'Certificate', 8);
}

function getQueueCounts(sheet) {
  ensureSystemColumns(sheet);

  const headers = getHeaders(sheet);
  validateRequiredHeaders(headers);

  const counts = {
    queued: 0,
    processing: 0,
    sent: 0,
    error: 0
  };

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return counts;
  }

  const statusIndex = headers.indexOf(SYSTEM_COLUMNS.status);
  const sentAtIndex = headers.indexOf(SYSTEM_COLUMNS.sentAt);
  const emailIndex = headers.indexOf(CONFIG.emailHeader);
  const nameIndex = headers.indexOf(CONFIG.nameHeader);

  const rows = sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getDisplayValues();

  rows.forEach(values => {
    const status = normalizeStatus(values[statusIndex]);
    const email = String(values[emailIndex] ?? '').trim();
    const name = String(values[nameIndex] ?? '').trim();

    if (!email && !name) {
      return;
    }

    if (hasBeenSent(status, values[sentAtIndex])) {
      counts.sent++;
    } else if (!status || status === CERTIFICATE_STATUS.queued) {
      counts.queued++;
    } else if (status === CERTIFICATE_STATUS.processing) {
      counts.processing++;
    } else if (status === CERTIFICATE_STATUS.error) {
      counts.error++;
    }
  });

  return counts;
}

function replaceTemplateConstants(presentation) {
  Object.entries(TEMPLATE_CONSTANTS).forEach(([key, value]) => {
    presentation.replaceAllText(
      `{{@${key}@}}`,
      String(value ?? ''),
      true
    );
  });
}

function replaceSheetPlaceholders(presentation, data) {
  Object.entries(data).forEach(([header, value]) => {
    if (!header) {
      return;
    }

    const constantMatch = header.match(/^@(.+)@$/);
    if (
      constantMatch &&
      Object.hasOwn(TEMPLATE_CONSTANTS, constantMatch[1])
    ) {
      return;
    }

    let output = String(value ?? '');

    if (CONFIG.uppercaseName && header === CONFIG.nameHeader) {
      output = output.toUpperCase();
    }

    if (CONFIG.formatMalaysianIc && header === CONFIG.icHeader) {
      output = formatMalaysianIc(output);
    }

    presentation.replaceAllText(`{{${header}}}`, output, true);
  });
}

function ensureSystemColumns(sheet) {
  const existingHeaders = getHeaders(sheet);

  Object.values(SYSTEM_COLUMNS).forEach(header => {
    if (existingHeaders.includes(header)) {
      return;
    }

    sheet
      .getRange(1, sheet.getLastColumn() + 1)
      .setValue(header);

    existingHeaders.push(header);
  });
}

function getHeaders(sheet) {
  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(header => String(header).trim());
}

function validateRequiredHeaders(headers) {
  const required = [CONFIG.emailHeader, CONFIG.nameHeader];
  const missing = required.filter(header => !headers.includes(header));

  if (missing.length) {
    throw new Error(`Missing Sheet header(s): ${missing.join(', ')}`);
  }
}

function setValue(sheet, headers, row, header, value) {
  const columnIndex = headers.indexOf(header);

  if (columnIndex === -1) {
    throw new Error(`Sheet column not found: ${header}`);
  }

  sheet.getRange(row, columnIndex + 1).setValue(value);
}

function queueRow(sheet, headers, row) {
  setValue(
    sheet,
    headers,
    row,
    SYSTEM_COLUMNS.status,
    CERTIFICATE_STATUS.queued
  );
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, '');
  setValue(sheet, headers, row, SYSTEM_COLUMNS.processingStartedAt, '');
}

function markSent(sheet, headers, row) {
  setValue(sheet, headers, row, SYSTEM_COLUMNS.sentAt, new Date());
  setValue(
    sheet,
    headers,
    row,
    SYSTEM_COLUMNS.status,
    CERTIFICATE_STATUS.sent
  );
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, '');
  setValue(sheet, headers, row, SYSTEM_COLUMNS.processingStartedAt, '');
  SpreadsheetApp.flush();
}

function markError(sheet, headers, row, message) {
  setValue(
    sheet,
    headers,
    row,
    SYSTEM_COLUMNS.status,
    CERTIFICATE_STATUS.error
  );
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, message);
  setValue(sheet, headers, row, SYSTEM_COLUMNS.processingStartedAt, '');
}

function rememberResponseSheet(sheet) {
  PropertiesService.getScriptProperties().setProperties({
    [SCRIPT_PROPERTIES.spreadsheetId]: sheet.getParent().getId(),
    [SCRIPT_PROPERTIES.sheetId]: String(sheet.getSheetId())
  });
}

function getResponseSheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty(
    SCRIPT_PROPERTIES.spreadsheetId
  );
  const sheetId = Number(properties.getProperty(SCRIPT_PROPERTIES.sheetId));

  if (!spreadsheetId || !sheetId) {
    throw new Error(
      'Certificate automation is not configured. Run setupCertificateAutomation() from the response sheet.'
    );
  }

  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet
    .getSheets()
    .find(candidate => candidate.getSheetId() === sheetId);

  if (!sheet) {
    throw new Error(
      'The configured response sheet was not found. Run setupCertificateAutomation() again.'
    );
  }

  return sheet;
}

function isCertificateGenerationEnabled() {
  return PropertiesService
    .getScriptProperties()
    .getProperty(SCRIPT_PROPERTIES.generationEnabled) !== 'false';
}

function updateCertificateStatusIndicator(sheet) {
  const headers = getHeaders(sheet);
  const statusIndex = headers.indexOf(SYSTEM_COLUMNS.status);

  if (statusIndex === -1) {
    throw new Error(
      `Sheet column not found: ${SYSTEM_COLUMNS.status}`
    );
  }

  const enabled = isCertificateGenerationEnabled();
  const background = enabled
    ? GENERATION_INDICATOR.runningBackground
    : GENERATION_INDICATOR.stoppedBackground;
  const note = enabled
    ? 'Certificate generation is RUNNING.'
    : 'Certificate generation is STOPPED.';
  const cell = sheet.getRange(1, statusIndex + 1);

  if (cell.getBackground() !== background) {
    cell.setBackground(background);
  }

  if (cell.getNote() !== note) {
    cell.setNote(note);
  }
}

function hasBeenSent(status, sentAt) {
  return (
    normalizeStatus(status) === CERTIFICATE_STATUS.sent || Boolean(sentAt)
  );
}

function normalizeStatus(value) {
  return String(value ?? '').trim().toUpperCase();
}

function isStaleProcessing(startedAt) {
  if (!startedAt) {
    return true;
  }

  const timestamp = startedAt instanceof Date
    ? startedAt.getTime()
    : new Date(startedAt).getTime();

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  const staleAfterMilliseconds =
    QUEUE_CONFIG.staleAfterMinutes * 60 * 1000;

  return Date.now() - timestamp >= staleAfterMilliseconds;
}

function formatQueueSummary(summary) {
  if (summary.quotaExhausted) {
    return `Sent: ${summary.sent}. Email quota exhausted; remaining rows stay queued.`;
  }

  if (summary.stopped) {
    return `Sent: ${summary.sent}. Generation was stopped.`;
  }

  return `Processed: ${summary.processed}, Sent: ${summary.sent}, Failed: ${summary.failed}`;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatMalaysianIc(value) {
  const original = String(value ?? '').trim();
  const digits = original.replace(/\D/g, '');

  if (digits.length !== 12) {
    return original;
  }

  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

function sanitizeFilename(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkEmailQuota() {
  console.log(
    `Remaining email quota: ${MailApp.getRemainingDailyQuota()}`
  );
}

function testLastRow() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const row = sheet.getLastRow();
  const lock = LockService.getScriptLock();

  rememberResponseSheet(sheet);

  try {
    lock.waitLock(30000);
    ensureSystemColumns(sheet);

    const headers = getHeaders(sheet);
    validateRequiredHeaders(headers);

    const values = sheet
      .getRange(row, 1, 1, headers.length)
      .getDisplayValues()[0];
    const status = normalizeStatus(
      values[headers.indexOf(SYSTEM_COLUMNS.status)]
    );
    const sentAt = values[headers.indexOf(SYSTEM_COLUMNS.sentAt)];

    if (
      hasBeenSent(status, sentAt) ||
      status === CERTIFICATE_STATUS.processing
    ) {
      return { processed: 0, sent: 0, failed: 0, skipped: true };
    }

    queueRow(sheet, headers, row);
  } finally {
    lock.releaseLock();
  }

  return processCertificateQueue();
}
