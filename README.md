# Form Certificate Automation

Automatically create and email certificates from Google Form responses.

When a participant submits the form, the system can automatically:

1. Read the participant's details from Google Sheets.
2. Add the details to a Google Slides certificate template.
3. Create the certificate as a PDF.
4. Save the PDF to Google Drive.
5. Email the certificate to the participant.
6. Record the sending status in Google Sheets.

No more copying names, creating PDFs, and sending certificates one by one.

## Start Here

➡️ **[Open the Step-by-Step Setup Guide](docs/SETUP.md)**

The setup guide is written for normal Google users. No programming knowledge is required.

## What You Need

- Google Form
- Google Sheets
- Google Slides
- Google Drive
- A Google account that can use Google Apps Script

## Files

- [`Code.gs`](Code.gs) — the automation script to copy into Google Apps Script.
- [`docs/SETUP.md`](docs/SETUP.md) — complete setup instructions.

## Main Features

- Automatically generates certificates after a form submission.
- Uses your own Google Slides certificate design.
- Automatically emails the PDF certificate.
- Saves a copy of every certificate in Google Drive.
- Works with your Google Sheet column names automatically.
- Supports fixed event information such as program name, date, and venue.
- Can automatically display participant names in uppercase.
- Can automatically format Malaysian IC numbers with dashes.
- Prevents certificates already marked as sent from being sent again automatically.
- Records errors in the response Sheet for easier checking.

## Credits

Created and maintained by [Atif Mustaffa (@atifmustaffa)](https://github.com/atifmustaffa).
