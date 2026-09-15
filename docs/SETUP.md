# Setup Guide

Create and email PDF certificates automatically from Google Form responses.

No programming knowledge is required. Follow the steps in order.

[Bahasa Malaysia version](SETUP_MS.md)

## How It Works

**Google Form → Google Sheet → Certificate queue → PDF → Google Drive → Email**

You need:

- A Google Form
- Its linked Google Sheet
- A Google Slides certificate template
- A Google Drive folder for finished certificates
- A Google account with access to Apps Script

---

## Step 1 — Prepare the Form and Sheet

Create your Google Form. Recommended questions:

- Nama Penuh
- No. Kad Pengenalan
- Email
- Any other information needed on the certificate

Make the email question required.

Then connect the Form to a Sheet:

1. Open the Form's **Responses** tab.
2. Click **Link to Sheets**.
3. Create a new spreadsheet or select an existing one.

The first row contains the question names. The script uses these names exactly.

### Optional: Malaysian IC validation

To accept IC numbers with or without dashes, add this response validation pattern to the Form:

```text
^\d{6}-?\d{2}-?\d{4}$
```

Accepted examples:

```text
010203110123
010203-11-0123
```

---

## Step 2 — Prepare the Slides Template

Create your certificate in Google Slides with your preferred design, logos, signatures, and wording.

### Add participant information

Use the exact Sheet column name inside double curly brackets:

| Sheet column | Slides placeholder |
|---|---|
| Nama Penuh | `{{Nama Penuh}}` |
| No. Kad Pengenalan | `{{No. Kad Pengenalan}}` |
| Email | `{{Email}}` |
| Jawatan | `{{Jawatan}}` |

Spelling, spaces, and capital letters must match the Sheet header.

### Add program information

Use these placeholders for information shared by every participant:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

You will enter their values in `Code.gs` later.

### Example template

<img width="354" height="500" alt="Template Sijil" src="https://github.com/user-attachments/assets/473b34d3-6f75-41d6-91d7-646f7f17946b" />

---

## Step 3 — Prepare Google Drive

1. Create a folder for the finished PDF certificates.
2. Copy the folder ID from its address:

```text
https://drive.google.com/drive/folders/FOLDER_ID
```

3. Open the Slides template and copy its ID:

```text
https://docs.google.com/presentation/d/SLIDES_TEMPLATE_ID/edit
```

Keep both IDs for Step 5.

---

## Step 4 — Add the Script

1. Open the Google Sheet linked to the Form.
2. Click **Extensions → Apps Script**.
3. Delete the sample code.
4. Copy the full contents of [`Code.gs`](../Code.gs).
5. Paste it into Apps Script and click **Save**.

Do not create a deployment.

---

## Step 5 — Change the Settings

Only edit the section above:

```javascript
// NO CHANGES NEEDED BELOW THIS LINE
```

### File IDs

Replace the example values with the IDs from Step 3:

```javascript
templateId: 'YOUR_SLIDES_TEMPLATE_ID',
outputFolderId: 'YOUR_OUTPUT_FOLDER_ID',
```

### Sheet column names

Make these values match your Sheet headers exactly:

```javascript
emailHeader: 'Email',
nameHeader: 'Nama Penuh',
icHeader: 'No. Kad Pengenalan',
```

### Certificate number and formatting

```javascript
certificatePrefix: 'CERT-2026',
uppercaseName: true,
formatMalaysianIc: true,
```

This produces certificate IDs such as `CERT-2026-0001`.

Use `false` if names should keep their original case or IC numbers should not be formatted.

### Program information

Update the values used by the fixed Slides placeholders:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama'
};
```

### Email

Update the sender name and subject:

```javascript
senderName: 'Urus Setia Program',
emailSubject: 'Sijil Penyertaan Program'
```

Edit the text inside `EMAIL_TEMPLATE` to change the email message. Keep the brackets, commas, and dynamic program lines unless you intentionally want to remove them.

Save the script when finished.

---

## Step 6 — Set Up the Automation

1. Return to the response Sheet and select its tab.
2. Open **Extensions → Apps Script**.
3. Select `setupCertificateAutomation` from the function list.
4. Click **Run**.
5. Sign in and allow the requested permissions.

This installs the Form submission trigger and the one-minute queue worker. It is safe to run the setup function again; duplicate triggers are not created.

Reload the spreadsheet to display the **> Auto Certificate <** menu.

---

## Step 7 — Test Before Going Live

Submit one response using your own email address.

Check that:

1. The response appears in the Sheet as `QUEUED`.
2. Its status changes to `SENT` after the worker runs.
3. The PDF appears in the selected Drive folder.
4. The email appears in Gmail **Sent** and in the test inbox.
5. Names, certificate numbers, dates, and layout look correct in the PDF.

Allow a few minutes for the queue worker to finish.

---

## Using the Automation

### Generation indicator

The `Certificate Status` header shows the current generation setting:

- Green — generation is running
- Red — generation is stopped

Form submissions are accepted and queued in both states.

### Auto Certificate menu

| Menu item | Action |
|---|---|
| **▶️ Start Generating** | Starts processing queued responses. |
| **⏸️ Stop Generating** | Pauses new processing. The current certificate finishes first. |
| **⚡ Process Queue Now** | Processes one batch without waiting for the next scheduled run. |
| **📊 Queue Status** | Shows the generation state and queue totals. |

### Certificate statuses

| Status | Meaning |
|---|---|
| `QUEUED` | Waiting to be processed. |
| `PROCESSING` | Certificate generation is in progress. |
| `SENT` | PDF created and email sent. |
| `ERROR` | Processing failed. Read `Certificate Error`. |

The script also records the certificate ID, PDF URL, sent time, error, and processing start time. A certificate recorded as sent is not sent again automatically.

### Retry failed or missing certificates

After fixing the cause of an error:

1. Open Apps Script.
2. Select `regenerateMissingCertificates`.
3. Click **Run**.

The function returns failed, missing, and stale rows to `QUEUED`. It does not requeue certificates already recorded as sent.

### Email quota

Google limits daily email recipients. To check the remaining quota, run `checkEmailQuota` in Apps Script and open the execution log.

When the quota is exhausted, unsent responses remain queued for a later run.

---

## Quick Troubleshooting

| Problem | Check |
|---|---|
| Status is `ERROR` | Read the `Certificate Error` cell in that row. |
| Name or field is missing from the PDF | Confirm the Slides placeholder exactly matches the Sheet header. |
| Program information is missing | Confirm the placeholder and `TEMPLATE_CONSTANTS` key match. |
| No PDF is created | Check the template ID, folder ID, permissions, and error cell. |
| Status is `SENT`, but no email arrived | Check Gmail **Sent**, the recipient address, and Spam/Junk. |
| Menu is missing | Reload the spreadsheet after running setup. |
| Rows remain `QUEUED` | Start generation, then check **Queue Status**. |

---

## Privacy

Form responses may contain names, email addresses, IC numbers, and other personal information.

- Keep the response Sheet and certificate folder private.
- Give access only to authorised staff.
- Avoid placing full IC numbers on certificates unless required.
- Never publish real participant data or private Google file IDs.

---

## For the Next Event

1. Prepare the new Form, Slides template, and output folder.
2. Copy `Code.gs` into the new response Sheet.
3. Update the IDs, column names, program information, and email.
4. Run `setupCertificateAutomation` from the response Sheet.
5. Submit one test response before sharing the Form.
