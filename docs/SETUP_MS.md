# Panduan Persediaan

Panduan ini menunjukkan cara menghasilkan dan menghantar sijil secara automatik menggunakan respons Google Form.

Tiada pengetahuan pengaturcaraan diperlukan. Ikuti langkah satu per satu.

English version: [Click here](SETUP.md)

---

## Sebelum Bermula

Anda memerlukan:

- Google Form untuk kehadiran atau pendaftaran.
- Google Sheet yang disambungkan kepada Form tersebut.
- Reka bentuk sijil dalam Google Slides.
- Folder Google Drive untuk menyimpan sijil yang siap.
- Akaun Google yang boleh menggunakan Google Apps Script.

Sistem ini berfungsi seperti berikut:

**Google Form → Google Sheet → Sijil PDF → Google Drive → E-mel**

---

## Langkah 1 — Sediakan Google Form

Sediakan borang kehadiran seperti biasa.

Ruangan yang disyorkan:

- Nama Penuh
- No. Kad Pengenalan
- Email
- Apa-apa maklumat lain yang diperlukan

Pastikan ruangan e-mel diwajibkan.

### Pilihan: Semakan nombor Kad Pengenalan Malaysia

Jika anda mahu Form menerima nombor Kad Pengenalan dengan atau tanpa tanda sempang, gunakan ungkapan berikut pada bahagian response validation:

```text
^\d{6}-?\d{2}-?\d{4}$
```

Contoh yang diterima:

```text
010203110123
010203-11-0123
```

Skrip boleh memaparkan kedua-dua format sebagai:

```text
010203-11-0123
```

---

## Langkah 2 — Sambungkan Form kepada Google Sheets

Dalam Google Form:

1. Buka **Responses**.
2. Klik **Link to Sheets**.
3. Cipta spreadsheet baharu atau pilih yang sedia ada.

Baris pertama akan mengandungi nama soalan dalam Form, contohnya:

```text
Timestamp | Nama Penuh | No. Kad Pengenalan | Email
```

Nama lajur ini penting kerana ia boleh digunakan terus dalam templat sijil.

---

## Langkah 3 — Sediakan Sijil dalam Google Slides

Cipta sijil anda dalam Google Slides.

Sediakan reka bentuk seperti biasa termasuk logo, tandatangan, latar belakang, teks dan maklumat lain.

### Maklumat peserta

Untuk memasukkan maklumat daripada Google Sheets ke dalam sijil, gunakan nama lajur Sheet yang tepat di dalam dua kurungan berlengkung.

Contoh lajur dalam Sheet:

```text
Nama Penuh
No. Kad Pengenalan
Email
Jawatan
```

Gunakan dalam Google Slides seperti berikut:

```text
{{Nama Penuh}}
{{No. Kad Pengenalan}}
{{Email}}
{{Jawatan}}
```

Ejaan mesti sama seperti nama lajur dalam Sheet.

Jika anda menambah soalan baharu dalam Form, anda juga boleh menggunakan nama lajur baharu itu sebagai placeholder tanpa mengubah skrip.

#### Contoh Templat - Google Slides
<img width="354" height="500" alt="Template Sijil" src="https://github.com/user-attachments/assets/473b34d3-6f75-41d6-91d7-646f7f17946b" />

---

## Langkah 4 — Tambah Maklumat Tetap Program

Sesetengah maklumat adalah sama untuk semua peserta, contohnya:

- Nama program
- Tarikh
- Tempat

Untuk maklumat seperti ini, gunakan format khas berikut:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

Nilai sebenar akan ditetapkan kemudian dalam skrip.

Maklumat tetap ini akan digunakan terlebih dahulu sebelum maklumat daripada lajur Sheet. Jadi, nilai tetap masih akan digunakan walaupun terdapat nama lajur Sheet yang sama.

---

## Langkah 5 — Cipta Folder Google Drive

Cipta satu folder dalam Google Drive untuk menyimpan sijil PDF yang siap.

Contoh:

```text
Sijil Program XYZ
```

Buka folder tersebut dan lihat alamat pada pelayar.

Contoh:

```text
https://drive.google.com/drive/folders/1AbCdEfGh123456
```

Bahagian selepas `/folders/` ialah **Folder ID**:

```text
1AbCdEfGh123456
```

Simpan ID ini untuk digunakan kemudian.

---

## Langkah 6 — Salin Google Slides Template ID

Buka fail sijil Google Slides anda.

Contoh alamat:

```text
https://docs.google.com/presentation/d/1XyZAbCdEf123456/edit
```

Bahagian antara `/d/` dan `/edit` ialah **Slides Template ID**:

```text
1XyZAbCdEf123456
```

Simpan ID ini bersama Folder ID tadi.

---

## Langkah 7 — Tambah Skrip Automasi

Buka Google Sheet yang disambungkan kepada Form.

Kemudian:

1. Klik **Extensions**.
2. Klik **Apps Script**.
3. Padam kod contoh yang sedia ada.
4. Buka [`Code.gs`](../Code.gs) daripada repositori ini.
5. Salin keseluruhan kandungan.
6. Tampal ke dalam Google Apps Script.
7. Simpan projek.

Anda **tidak perlu deploy** skrip ini.

---

## Langkah 8 — Ubah Tetapan

Di bahagian atas `Code.gs`, anda akan nampak:

```javascript
// ========================================
// CHANGE THESE SETTINGS ONLY
// ========================================
```

Untuk penggunaan biasa, ubah bahagian ini sahaja.

### Masukkan Google ID anda

Gantikan:

```javascript
templateId: 'YOUR_SLIDES_TEMPLATE_ID',
outputFolderId: 'YOUR_OUTPUT_FOLDER_ID',
```

kepada ID yang disalin sebelum ini.

Contoh:

```javascript
templateId: '1XyZAbCdEf123456',
outputFolderId: '1AbCdEfGh123456',
```

### Semak nama lajur Sheet

Nama berikut mesti sama seperti dalam Google Sheet anda:

```javascript
emailHeader: 'Email',
nameHeader: 'Nama Penuh',
icHeader: 'No. Kad Pengenalan',
```

Jika Form anda menggunakan nama yang berbeza, ubah tetapan ini supaya sama.

### Nombor sijil

Contoh:

```javascript
certificatePrefix: 'CERT-2026',
```

Nombor sijil akan menjadi seperti:

```text
CERT-2026-0001
CERT-2026-0002
CERT-2026-0003
```

### Nama peserta dalam huruf besar

```javascript
uppercaseName: true,
```

Gunakan `true` untuk memaparkan nama peserta dalam huruf besar.

Gunakan `false` untuk mengekalkan nama seperti yang dimasukkan oleh peserta.

### Format Kad Pengenalan Malaysia

```javascript
formatMalaysianIc: true,
```

Apabila diaktifkan:

```text
010203110123
```

akan dipaparkan sebagai:

```text
010203-11-0123
```

Gunakan `false` jika anda tidak mahu format ini digunakan secara automatik.

---

## Langkah 9 — Tetapkan Nama Program, Tarikh dan Tempat

Cari bahagian berikut:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'NAMA PROGRAM ANDA',
  tarikh: '1 September 2026',
  tempat: 'TEMPAT PROGRAM'
};
```

Ubah nilai mengikut program anda.

Contoh:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama'
};
```

Kemudian gunakan dalam Google Slides:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

Anda boleh menambah maklumat tetap lain jika perlu.

Contoh:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama',
  penganjur: 'Bahagian ABC'
};
```

Kemudian gunakan:

```text
{{@penganjur@}}
```

---

## Langkah 10 — Semak Tetapan E-mel

Anda boleh mengubah:

```javascript
senderName: 'Urus Setia Program',
emailSubject: 'Sijil Penyertaan Program',
```

Ubah `EMAIL_TEMPLATE` berhampiran bahagian atas `Code.gs` untuk menukar mesej e-mel.

Mesej e-mel lalai ialah:

```text
Assalamualaikum / Salam sejahtera,

Tuan/Puan,

Dilampirkan ialah sijil penyertaan bagi program:

Program: [Nama Program]
Tarikh: [Tarikh]
Tempat: [Tempat]

Terima kasih.

Urus Setia Program
```

Nama program, tarikh dan tempat akan diambil secara automatik daripada `TEMPLATE_CONSTANTS`.

---

## Langkah 11 — Sediakan Automasi

Menyimpan skrip sahaja belum mencukupi. Jalankan fungsi persediaan sekali untuk menghubungkan Sheet respons dan memasang trigger yang diperlukan.

1. Kembali ke Sheet respons dan pastikan tabnya dipilih.
2. Buka **Extensions → Apps Script**.
3. Pilih `setupCertificateAutomation` daripada senarai fungsi.
4. Klik **Run**.
5. Log masuk menggunakan akaun Google yang memiliki atau mengurus fail tersebut.
6. Benarkan akses yang diminta.

Fungsi persediaan akan mencipta trigger berikut jika trigger tersebut belum wujud:

```text
onFormSubmit             → apabila Form dihantar
processCertificateQueue  → setiap 1 minit
```

Anda boleh menjalankan fungsi persediaan semula tanpa mencipta trigger pendua. Anda **tidak perlu membuat deployment** atau menambah trigger secara manual.

Respons baharu akan ditanda `QUEUED` serta-merta. Worker satu minit kemudian menghasilkan dan menghantar sijil dalam kelompok lima.

---

## Langkah 12 — Uji Sebelum Digunakan untuk Peserta

Lakukan satu ujian menggunakan alamat e-mel anda sendiri.

1. Hantar Google Form.
2. Tunggu respons muncul dalam Google Sheets.
3. Pastikan `Certificate Status` mula-mula menunjukkan `QUEUED`.
4. Tunggu sehingga beberapa minit untuk status berubah kepada `SENT`.
5. Semak lajur status sijil.
6. Semak folder sijil dalam Google Drive.
7. Semak folder **Sent** dalam Gmail.
8. Semak inbox e-mel yang digunakan untuk ujian.
9. Buka PDF dan semak sijil dengan teliti.

Semak terutamanya:

- Nama peserta
- Nama peserta yang panjang
- Format Kad Pengenalan
- Nama program
- Tarikh
- Tempat
- Nombor sijil
- Logo dan tandatangan
- Kedudukan teks

---

## Lajur Status Sijil

Skrip akan menambah lajur berikut secara automatik dalam Google Sheet:

```text
Certificate Status
Certificate ID
Certificate URL
Certificate Sent At
Certificate Error
Certificate Processing Started At
```

Anda tidak perlu menambahnya secara manual.

### Maksud status

| Status | Maksud |
|---|---|
| `QUEUED` | Respons sedang menunggu worker. |
| `PROCESSING` | Sijil sedang disediakan. |
| `SENT` | Sijil telah dihasilkan dan e-mel telah dihantar. |
| `ERROR` | Berlaku masalah. Semak lajur `Certificate Error`. |

Baris yang telah ditanda `SENT`, atau mempunyai masa penghantaran yang direkodkan, tidak akan dihantar semula secara automatik.

Pengepala `Certificate Status` berwarna hijau semasa penjanaan berjalan dan merah apabila dihentikan. Respons masih diterima dan dimasukkan ke dalam baris gilir dalam kedua-dua keadaan.

### Menu Auto Certificate

Muat semula spreadsheet selepas persediaan untuk melihat menu **> Auto Certificate <**:

- **▶️ Start Generating** — membenarkan worker memproses baris yang menunggu.
- **⏸️ Stop Generating** — menjeda pemprosesan baharu; sijil semasa dibenarkan selesai.
- **⚡ Process Queue Now** — menjalankan satu kelompok dengan segera apabila penjanaan diaktifkan.
- **📊 Queue Status** — menunjukkan keadaan penjanaan dan jumlah setiap status.

Menghentikan penjanaan tidak menolak respons baharu. Respons tersebut kekal `QUEUED` sehingga penjanaan dimulakan semula.

---

## Had Penghantaran E-mel

Google mengehadkan jumlah penerima e-mel yang boleh dihantar melalui Apps Script setiap hari.

Had sebenar bergantung pada akaun Google anda.

Untuk menyemak had akaun sendiri:

1. Buka Apps Script.
2. Pilih fungsi `checkEmailQuota`.
3. Klik **Run**.
4. Buka execution log.

Anda akan nampak sesuatu seperti:

```text
Remaining email quota: 1500
```

Gunakan nombor yang dipaparkan oleh akaun anda sebagai baki had sebenar untuk hari tersebut.

---

## Masalah Biasa

### Certificate Status menunjukkan `SENT`, tetapi peserta tidak menerima e-mel

Semak:

1. Folder **Sent** dalam Gmail.
2. Alamat e-mel peserta dalam Google Sheets.
3. Folder Spam atau Junk peserta.
4. Sama ada sistem e-mel organisasi melambatkan atau menapis mesej tersebut.

Jika e-mel muncul dalam folder Sent anda, Google Apps Script telah menyerahkan e-mel tersebut kepada Gmail.

### Nama atau maklumat lain tidak muncul pada sijil

Pastikan placeholder dalam Google Slides sama tepat dengan nama lajur Sheet.

Contoh:

Sheet:

```text
Nama Penuh
```

Slides:

```text
{{Nama Penuh}}
```

Perbezaan ejaan yang kecil juga boleh menyebabkan maklumat tidak diganti.

### Maklumat tetap program tidak muncul

Pastikan format khas digunakan dengan betul.

Contoh:

```text
{{@nama_program@}}
```

Pastikan juga `nama_program` wujud dalam `TEMPLATE_CONSTANTS`.

### Certificate Status menunjukkan `ERROR`

Semak lajur `Certificate Error` pada baris yang sama.

Punca biasa termasuk:

- Slides Template ID salah
- Drive Folder ID salah
- Lajur Sheet tiada
- Alamat e-mel tidak sah
- Masalah kebenaran Google

Selepas membetulkan masalah, jalankan `regenerateMissingCertificates` melalui Apps Script. Fungsi ini menukar baris yang gagal, terlepas atau tergendala kembali kepada `QUEUED`; worker biasa akan melakukan percubaan semula. Baris yang telah direkodkan sebagai dihantar tidak akan dimasukkan semula.

Jika had e-mel harian telah habis, worker akan berhenti dan membiarkan respons yang masih ada dalam baris gilir untuk diproses kemudian.

### Google meminta kebenaran

Ini adalah perkara biasa semasa persediaan kali pertama.

Skrip memerlukan kebenaran untuk:

- Membaca Sheet respons
- Menyalin templat Google Slides
- Mencipta fail PDF dalam Google Drive
- Menghantar e-mel sijil

Jika organisasi anda menyekat salah satu perkhidmatan Google ini, anda mungkin perlu menghubungi pentadbir Google Workspace organisasi.

---

## Peringatan Privasi

Borang kehadiran mungkin mengandungi maklumat peribadi seperti:

- Nama penuh
- Alamat e-mel
- Nombor Kad Pengenalan
- Maklumat organisasi

Untuk keselamatan:

- Jangan jadikan Sheet respons sebagai public.
- Jangan jadikan folder sijil dalam Google Drive sebagai public kecuali diperlukan.
- Berikan akses hanya kepada pegawai yang memerlukannya.
- Elakkan memaparkan nombor penuh Kad Pengenalan pada sijil kecuali diwajibkan oleh organisasi.
- Jangan terbitkan repositori yang mengandungi maklumat peserta sebenar, Google file ID sebenar atau data program yang sulit.

Fail `Code.gs` dalam repositori ini hanya mengandungi tetapan contoh. Simpan ID program sebenar dan maklumat peserta di dalam fail Google anda sendiri.

---

## Untuk Program Seterusnya

Selepas persediaan pertama berjaya, program seterusnya menjadi lebih mudah.

Biasanya anda hanya perlu:

1. Sediakan Form baharu.
2. Sediakan atau salin templat sijil Google Slides.
3. Cipta folder output sijil baharu.
4. Salin `Code.gs` ke Apps Script bagi Sheet respons baharu.
5. Ubah ID dan maklumat program di bahagian atas.
6. Jalankan `setupCertificateAutomation` sekali daripada Sheet respons.
7. Hantar satu respons ujian.

Selepas itu, proses sijil boleh berjalan secara automatik untuk program tersebut.
