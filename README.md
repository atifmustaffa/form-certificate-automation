# Form Certificate Automation

Automatically create and email certificates from Google Form responses.

When a participant submits the form, the system queues the response and automatically:

1. Reads the participant's details from Google Sheets.
2. Adds the details to a Google Slides certificate template.
3. Creates the certificate as a PDF.
4. Saves the PDF to Google Drive.
5. Emails the certificate to the participant.
6. Records the sending status in Google Sheets.

A time-driven worker processes the queue in small batches, so simultaneous submissions do not block each other.

No more copying names, creating PDFs, and sending certificates one by one.

## Start

Step-by-Step Setup Guide: [Click here for English](docs/SETUP.md) | [Click here for Bahasa Malaysia](docs/SETUP_MS.md)

The setup guide is written for normal Google users. No programming knowledge is required.

## What You Need

- Google Form
- Google Sheets
- Google Slides
- Google Drive
- A Google account that can use Google Apps Script

## Files

- [`Code.gs`](Code.gs) — the automation script to copy into Google Apps Script.
- [`docs/SETUP.md`](docs/SETUP.md) — English setup guide.
- [`docs/SETUP_MS.md`](docs/SETUP_MS.md) — Bahasa Malaysia setup guide.

## Main Features

- Queues every form submission for reliable background processing.
- Processes certificates in small batches every minute.
- Lets administrators start, stop, inspect, or manually process the queue from Google Sheets.
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

- Atif Mustaffa

---

# Automasi Penjanaan Sijil

Cipta dan hantar sijil secara automatik melalui e-mel berdasarkan respons Google Form.

Apabila peserta menghantar borang, sistem memasukkan respons ke dalam baris gilir dan secara automatik:

1. Membaca maklumat peserta daripada Google Sheets.
2. Memasukkan maklumat tersebut ke dalam templat sijil Google Slides.
3. Menghasilkan sijil dalam bentuk PDF.
4. Menyimpan PDF ke Google Drive.
5. Menghantar sijil kepada peserta melalui e-mel.
6. Merekod status penghantaran dalam Google Sheets.

Worker berjadual memproses baris gilir dalam kelompok kecil supaya penghantaran serentak tidak saling menyekat.

Tidak perlu lagi menyalin nama, menghasilkan PDF, dan menghantar sijil satu per satu.

## Mula

Panduan langkah demi langkah: [Klik di sini untuk Bahasa Inggeris](docs/SETUP.md) | [Klik di sini untuk Bahasa Malaysia](docs/SETUP_MS.md)

Panduan ini ditulis untuk pengguna Google biasa. Tiada pengetahuan pengaturcaraan diperlukan.

## Apa Yang Diperlukan

- Google Form
- Google Sheets
- Google Slides
- Google Drive
- Akaun Google yang boleh menggunakan Google Apps Script

## Fail

- [`Code.gs`](Code.gs) — skrip automasi untuk disalin ke Google Apps Script.
- [`docs/SETUP.md`](docs/SETUP.md) — panduan dalam Bahasa Inggeris.
- [`docs/SETUP_MS.md`](docs/SETUP_MS.md) — panduan dalam Bahasa Malaysia.

## Fungsi Utama

- Memasukkan setiap respons Form ke dalam baris gilir untuk pemprosesan latar yang lebih andal.
- Memproses sijil dalam kelompok kecil setiap minit.
- Membolehkan pentadbir memulakan, menghentikan, menyemak atau memproses baris gilir melalui Google Sheets.
- Menggunakan reka bentuk sijil Google Slides anda sendiri.
- Menghantar sijil PDF secara automatik melalui e-mel.
- Menyimpan salinan setiap sijil dalam Google Drive.
- Menggunakan nama lajur Google Sheet secara automatik.
- Menyokong maklumat tetap program seperti nama program, tarikh dan tempat.
- Boleh menukar nama peserta kepada huruf besar secara automatik.
- Boleh memformat nombor Kad Pengenalan Malaysia dengan tanda sempang secara automatik.
- Mengelakkan sijil yang telah ditanda sebagai dihantar daripada dihantar semula secara automatik.
- Merekod ralat dalam Sheet respons untuk memudahkan semakan.

## Kredit

- Atif Mustaffa
