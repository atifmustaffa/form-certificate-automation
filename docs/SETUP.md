# Setup Guide

This guide shows how to automatically create and email certificates using Google Form responses.

No programming knowledge is required. Follow the steps in order.

---

## Before You Start

You will need:

- A Google Form for attendance or registration.
- A Google Sheet linked to that Form.
- A Google Slides certificate design.
- A Google Drive folder for finished certificates.
- A Google account that can use Google Apps Script.

The system works like this:

**Google Form → Google Sheet → Certificate PDF → Google Drive → Email**

---

## Step 1 — Prepare the Google Form

Create your attendance Form as usual.

Recommended fields:

- Nama Penuh
- No. Kad Pengenalan
- Email
- Any other information you need

Make the email field required.

### Optional: Malaysian IC validation

If you want the Form to accept IC numbers with or without dashes, use this regular expression in response validation:

```text
^\d{6}-?\d{2}-?\d{4}$
```

Examples accepted:

```text
010203110123
010203-11-0123
```

The script can later display both formats as:

```text
010203-11-0123
```

---

## Step 2 — Connect the Form to Google Sheets

In Google Form:

1. Open **Responses**.
2. Click **Link to Sheets**.
3. Create a new spreadsheet, or choose an existing one.

Your first row will contain the Form question names, for example:

```text
Timestamp | Nama Penuh | No. Kad Pengenalan | Email
```

These column names are important because they can be used directly in the certificate template.

---

## Step 3 — Prepare the Certificate in Google Slides

Create your certificate in Google Slides.

Design it normally with your logo, signatures, background, wording, and other information.

### Participant information

To place information from Google Sheets onto the certificate, use the exact Sheet column name inside double curly brackets.

Example Sheet columns:

```text
Nama Penuh
No. Kad Pengenalan
Email
Jawatan
```

Use these in Google Slides:

```text
{{Nama Penuh}}
{{No. Kad Pengenalan}}
{{Email}}
{{Jawatan}}
```

The wording must match the Sheet column name exactly.

If you later add a new Form question, you can also use its Sheet column name as a new placeholder without changing the script.

---

## Step 4 — Add Fixed Event Information

Some information is the same for every participant, such as:

- Program name
- Date
- Venue

For these values, use the special fixed-information format:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

You will set the actual values later in the script.

These fixed values are checked before Sheet columns, so they will still be used even if a Sheet column accidentally has the same reserved name.

---

## Step 5 — Create a Google Drive Folder

Create a folder in Google Drive for the finished PDF certificates.

Example:

```text
Program XYZ Certificates
```

Open the folder and look at the browser address.

Example:

```text
https://drive.google.com/drive/folders/1AbCdEfGh123456
```

The part after `/folders/` is the **Folder ID**:

```text
1AbCdEfGh123456
```

Keep this ID for later.

---

## Step 6 — Copy the Google Slides Template ID

Open your certificate Google Slides file.

Example address:

```text
https://docs.google.com/presentation/d/1XyZAbCdEf123456/edit
```

The part between `/d/` and `/edit` is the **Slides Template ID**:

```text
1XyZAbCdEf123456
```

Keep this ID together with your Folder ID.

---

## Step 7 — Add the Automation Script

Open the Google Sheet linked to your Form.

Then:

1. Click **Extensions**.
2. Click **Apps Script**.
3. Delete the default sample code.
4. Open [`Code.gs`](../Code.gs) from this repository.
5. Copy the full contents.
6. Paste it into Google Apps Script.
7. Save the project.

You do **not** need to deploy the script.

---

## Step 8 — Change the Settings

At the top of `Code.gs`, you will see:

```javascript
// ========================================
// CHANGE THESE SETTINGS ONLY
// ========================================
```

For normal use, only change this section.

### Add your Google IDs

Replace:

```javascript
templateId: 'YOUR_SLIDES_TEMPLATE_ID',
outputFolderId: 'YOUR_OUTPUT_FOLDER_ID',
```

with the IDs copied earlier.

Example:

```javascript
templateId: '1XyZAbCdEf123456',
outputFolderId: '1AbCdEfGh123456',
```

### Check your Sheet column names

These must exactly match your Google Sheet:

```javascript
emailHeader: 'Email',
nameHeader: 'Nama Penuh',
icHeader: 'No. Kad Pengenalan',
```

If your Form uses different wording, change the settings to match it.

### Certificate number

Example:

```javascript
certificatePrefix: 'CERT-2026',
```

Certificates will look like:

```text
CERT-2026-0001
CERT-2026-0002
CERT-2026-0003
```

### Uppercase participant name

```javascript
uppercaseName: true,
```

Use `true` to display the participant name in uppercase.

Use `false` to keep the name as entered.

### Malaysian IC formatting

```javascript
formatMalaysianIc: true,
```

When enabled:

```text
010203110123
```

will be displayed as:

```text
010203-11-0123
```

Set it to `false` if you do not want automatic IC formatting.

---

## Step 9 — Set the Program Name, Date and Venue

Find this section:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'NAMA PROGRAM ANDA',
  tarikh: '1 September 2026',
  tempat: 'TEMPAT PROGRAM'
};
```

Change the values for your event.

Example:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama'
};
```

Then use these in Google Slides:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

You may add more fixed values if needed.

Example:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama',
  penganjur: 'Bahagian ABC'
};
```

Then use:

```text
{{@penganjur@}}
```

---

## Step 10 — Change the Email Message

Still inside the settings section, you can change:

```javascript
senderName: 'Urus Setia Program',
emailSubject: 'Sijil Penyertaan Program',
```

You may also edit the email message inside:

```javascript
emailBody: ({ name, certificateId }) => [
  ...
].join('\n')
```

If you are not comfortable changing this part, leave it as it is.

---

## Step 11 — Turn On Automatic Sending

Saving the script alone is not enough. You must tell Google to run it automatically when the Form is submitted.

In Google Apps Script:

1. Click the **Triggers** icon on the left.
2. Click **Add Trigger**.
3. Choose these settings:

```text
Function: onFormSubmit
Deployment: Head
Event source: From spreadsheet
Event type: On form submit
```

4. Click **Save**.
5. Google will ask for permission.
6. Sign in using the Google account that owns or manages the files.
7. Allow the required permissions.

You do **not** need to create a deployment.

This trigger tells Google to run the certificate system automatically whenever someone submits the Form.

---

## Step 12 — Test Before Using It for Participants

Do one test using your own email address.

1. Submit the Google Form.
2. Wait for the response to appear in Google Sheets.
3. Check the new certificate tracking columns.
4. Check your Google Drive certificate folder.
5. Check your Gmail **Sent** folder.
6. Check the email inbox you used for testing.
7. Open the PDF and check the certificate carefully.

Check especially:

- Participant name
- Long participant names
- IC formatting
- Program name
- Date
- Venue
- Certificate number
- Logos and signatures
- Text position

---

## Certificate Tracking Columns

The script automatically adds these columns to the Google Sheet:

```text
Certificate Status
Certificate ID
Certificate URL
Certificate Sent At
Certificate Error
```

You do not need to create them manually.

### What the status means

| Status | Meaning |
|---|---|
| `PROCESSING` | The certificate is currently being prepared. |
| `SENT` | The certificate was created and the email was sent successfully. |
| `ERROR` | Something went wrong. Check the `Certificate Error` column. |

Rows already marked `SENT` will not be automatically sent again.

---

## Email Sending Limit

Google limits how many email recipients can be sent through Apps Script each day.

The exact limit depends on your Google account.

To check your own account:

1. Open Apps Script.
2. Choose the function `checkEmailQuota`.
3. Click **Run**.
4. Open the execution log.

You will see something similar to:

```text
Remaining email quota: 1500
```

Use the number shown by your own account as the actual remaining limit for that day.

---

## Common Problems

### Certificate Status says `SENT`, but the participant says no email arrived

Check:

1. Gmail **Sent** folder.
2. The participant email address in Google Sheets.
3. The participant's Spam or Junk folder.
4. Whether the organisation's email system delayed or filtered the message.

If the email appears in your Sent folder, Google Apps Script successfully handed the email to Gmail.

### Name or other information is not appearing on the certificate

Check that the Google Slides placeholder exactly matches the Sheet column name.

Example:

Sheet:

```text
Nama Penuh
```

Slides:

```text
{{Nama Penuh}}
```

Even small spelling differences can stop the replacement.

### Fixed event information is not appearing

Check that the special format is correct.

Example:

```text
{{@nama_program@}}
```

Also check that `nama_program` exists inside `TEMPLATE_CONSTANTS`.

### Certificate Status says `ERROR`

Look at the `Certificate Error` column in the same row.

It normally tells you what went wrong.

Common causes include:

- Wrong Slides Template ID
- Wrong Drive Folder ID
- Missing Sheet column
- Invalid email address
- Google permission problem
- Daily email limit reached

### Google asks for permission

This is normal the first time the automation is set up.

The script needs permission to:

- Read the response Sheet
- Copy the Google Slides template
- Create PDF files in Google Drive
- Send certificate emails

If your organisation blocks one of these Google services, you may need to contact your Google Workspace administrator.

---

## Privacy Reminder

Attendance Forms may contain personal information such as:

- Full names
- Email addresses
- IC numbers
- Organisation details

For safety:

- Do not make the response Sheet public.
- Do not make the certificate Drive folder public unless necessary.
- Only give access to staff who need it.
- Avoid displaying full IC numbers on certificates unless your organisation requires it.
- Do not publish a repository containing real participant information, Google file IDs, or private event data.

The `Code.gs` file in this repository contains example settings only. Keep your real event IDs and participant information inside your own Google files.

---

## For the Next Event

Once the first setup works, future events are much easier.

Normally you only need to:

1. Prepare the new Form.
2. Prepare or copy the certificate Slides template.
3. Create a new certificate output folder.
4. Copy `Code.gs` into the new response Sheet.
5. Change the IDs and event information at the top.
6. Add the `onFormSubmit` trigger.
7. Submit one test response.

Then the certificate process can run automatically for the event.
