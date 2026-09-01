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
  emailSubject: 'Sijil Penyertaan Program',
  emailBody: ({ name, certificateId }) => [
    `Assalamualaikum / Salam sejahtera ${name},`,
    '',
    'Dilampirkan sijil penyertaan anda bagi program yang telah dihadiri.',
    '',
    `No. Sijil: ${certificateId}`,
    '',
    'Terima kasih.',
    '',
    'Urus Setia Program'
  ].join('\n')
};

// Fixed information shared by every certificate.
// Use these in Google Slides as {{@nama_program@}}, {{@tarikh@}}, etc.
const TEMPLATE_CONSTANTS = {
  nama_program: 'NAMA PROGRAM ANDA',
  tarikh: '1 September 2026',
  tempat: 'TEMPAT PROGRAM'
};

// ========================================
// NO CHANGES NEEDED BELOW THIS LINE
// ========================================

const SYSTEM_COLUMNS = {
  status: 'Certificate Status',
  certificateId: 'Certificate ID',
  certificateUrl: 'Certificate URL',
  sentAt: 'Certificate Sent At',
  error: 'Certificate Error'
};

/**
 * Runs automatically when a Google Form response is submitted.
 */
function onFormSubmit(e) {
  if (!e?.range) {
    throw new Error(
      'This function must run from a Spreadsheet "On form submit" trigger.'
    );
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000);
    processRow(e.range.getSheet(), e.range.getRow());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generates and emails one certificate from one response row.
 */
function processRow(sheet, row) {
  ensureSystemColumns(sheet);

  const headers = getHeaders(sheet);
  const values = sheet
    .getRange(row, 1, 1, headers.length)
    .getDisplayValues()[0];

  const data = Object.fromEntries(
    headers.map((header, index) => [header, values[index] ?? ''])
  );

  validateRequiredHeaders(headers);

  const status = String(data[SYSTEM_COLUMNS.status] ?? '').trim();

  // Do not automatically resend completed or currently processing rows.
  if (status === 'SENT' || status === 'PROCESSING') {
    return;
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
    return;
  }

  if (!isValidEmail(email)) {
    markError(sheet, headers, row, `Invalid email: ${email}`);
    return;
  }

  if (MailApp.getRemainingDailyQuota() < 1) {
    markError(sheet, headers, row, 'Daily email quota exhausted.');
    return;
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
  setValue(sheet, headers, row, SYSTEM_COLUMNS.status, 'PROCESSING');
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, '');

  let temporarySlidesFile = null;

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

    // Give Google Slides a short moment to finish saving before PDF export.
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

    MailApp.sendEmail({
      to: email,
      subject: CONFIG.emailSubject,
      body: CONFIG.emailBody({
        name: displayName,
        certificateId
      }),
      name: CONFIG.senderName,
      attachments: [pdfBlob]
    });

    setValue(
      sheet,
      headers,
      row,
      SYSTEM_COLUMNS.certificateUrl,
      pdfFile.getUrl()
    );
    setValue(sheet, headers, row, SYSTEM_COLUMNS.sentAt, new Date());
    setValue(sheet, headers, row, SYSTEM_COLUMNS.status, 'SENT');
  } catch (error) {
    markError(
      sheet,
      headers,
      row,
      error instanceof Error ? error.message : String(error)
    );

    throw error;
  } finally {
    // Keep only the finished PDF, not the temporary Slides copy.
    if (temporarySlidesFile) {
      try {
        temporarySlidesFile.setTrashed(true);
      } catch (error) {
        console.error('Unable to delete temporary Slides file:', error);
      }
    }
  }
}

/**
 * Replaces fixed event information first.
 * Constants have priority over Sheet placeholders with the same reserved name.
 */
function replaceTemplateConstants(presentation) {
  Object.entries(TEMPLATE_CONSTANTS).forEach(([key, value]) => {
    presentation.replaceAllText(
      `{{@${key}@}}`,
      String(value ?? ''),
      true
    );
  });
}

/**
 * Replaces placeholders using Google Sheet column headers.
 */
function replaceSheetPlaceholders(presentation, data) {
  Object.entries(data).forEach(([header, value]) => {
    if (!header) {
      return;
    }

    // Constants are processed first and always win on collisions.
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

/**
 * Automatically adds the tracking columns used by the script.
 */
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

function markError(sheet, headers, row, message) {
  setValue(sheet, headers, row, SYSTEM_COLUMNS.status, 'ERROR');
  setValue(sheet, headers, row, SYSTEM_COLUMNS.error, message);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Converts either 010203110123 or 010203-11-0123 to 010203-11-0123.
 * Invalid/unexpected values are left unchanged.
 */
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

/**
 * Run manually to check the account's remaining daily email quota.
 */
function checkEmailQuota() {
  console.log(
    `Remaining email quota: ${MailApp.getRemainingDailyQuota()}`
  );
}

/**
 * Manual test helper.
 * WARNING: this really generates and emails a certificate for the last row.
 */
function testLastRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  processRow(sheet, sheet.getLastRow());
}
