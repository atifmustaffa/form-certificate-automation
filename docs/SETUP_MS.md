# Panduan Persediaan

Hasilkan dan hantar sijil PDF secara automatik daripada respons Google Form.

Tiada pengetahuan pengaturcaraan diperlukan. Ikuti langkah mengikut turutan.

[English version](SETUP.md)

## Cara Sistem Berfungsi

**Google Form → Google Sheet → Baris gilir sijil → PDF → Google Drive → E-mel**

Anda memerlukan:

- Google Form
- Google Sheet yang disambungkan kepada Form
- Templat sijil Google Slides
- Folder Google Drive untuk sijil yang siap
- Akaun Google yang boleh menggunakan Apps Script

---

## Langkah 1 — Sediakan Form dan Sheet

Cipta Google Form anda. Soalan yang disyorkan:

- Nama Penuh
- No. Kad Pengenalan
- Email
- Maklumat lain yang diperlukan pada sijil

Wajibkan soalan e-mel.

Kemudian sambungkan Form kepada Sheet:

1. Buka tab **Responses** dalam Form.
2. Klik **Link to Sheets**.
3. Cipta spreadsheet baharu atau pilih yang sedia ada.

Baris pertama mengandungi nama soalan. Skrip menggunakan nama ini secara tepat.

### Pilihan: Semakan nombor Kad Pengenalan

Untuk menerima nombor Kad Pengenalan dengan atau tanpa tanda sempang, tambah corak response validation ini pada Form:

```text
^\d{6}-?\d{2}-?\d{4}$
```

Contoh yang diterima:

```text
010203110123
010203-11-0123
```

---

## Langkah 2 — Sediakan Templat Slides

Cipta sijil dalam Google Slides dengan reka bentuk, logo, tandatangan dan teks anda.

### Tambah maklumat peserta

Gunakan nama lajur Sheet yang tepat di dalam dua kurungan berlengkung:

| Lajur Sheet | Placeholder Slides |
|---|---|
| Nama Penuh | `{{Nama Penuh}}` |
| No. Kad Pengenalan | `{{No. Kad Pengenalan}}` |
| Email | `{{Email}}` |
| Jawatan | `{{Jawatan}}` |

Ejaan, ruang dan huruf besar mesti sama seperti pengepala Sheet.

### Tambah maklumat program

Gunakan placeholder ini untuk maklumat yang sama bagi semua peserta:

```text
{{@nama_program@}}
{{@tarikh@}}
{{@tempat@}}
```

Anda akan memasukkan nilainya dalam `Code.gs` kemudian.

### Contoh templat

<img width="354" height="500" alt="Template Sijil" src="https://github.com/user-attachments/assets/473b34d3-6f75-41d6-91d7-646f7f17946b" />

---

## Langkah 3 — Sediakan Google Drive

1. Cipta folder untuk menyimpan sijil PDF yang siap.
2. Salin ID folder daripada alamatnya:

```text
https://drive.google.com/drive/folders/FOLDER_ID
```

3. Buka templat Slides dan salin ID-nya:

```text
https://docs.google.com/presentation/d/SLIDES_TEMPLATE_ID/edit
```

Simpan kedua-dua ID untuk Langkah 5.

---

## Langkah 4 — Tambah Skrip

1. Buka Google Sheet yang disambungkan kepada Form.
2. Klik **Extensions → Apps Script**.
3. Padam kod contoh.
4. Salin seluruh kandungan [`Code.gs`](../Code.gs).
5. Tampal ke dalam Apps Script dan klik **Save**.

Jangan cipta deployment.

---

## Langkah 5 — Ubah Tetapan

Ubah hanya bahagian sebelum:

```javascript
// NO CHANGES NEEDED BELOW THIS LINE
```

### ID fail

Gantikan nilai contoh dengan ID daripada Langkah 3:

```javascript
templateId: 'YOUR_SLIDES_TEMPLATE_ID',
outputFolderId: 'YOUR_OUTPUT_FOLDER_ID',
```

### Nama lajur Sheet

Pastikan nilai berikut sama tepat dengan pengepala Sheet:

```javascript
emailHeader: 'Email',
nameHeader: 'Nama Penuh',
icHeader: 'No. Kad Pengenalan',
```

### Nombor dan format sijil

```javascript
certificatePrefix: 'CERT-2026',
uppercaseName: true,
formatMalaysianIc: true,
```

Ini menghasilkan ID sijil seperti `CERT-2026-0001`.

Gunakan `false` jika nama perlu dikekalkan seperti asal atau nombor Kad Pengenalan tidak perlu diformat.

### Maklumat program

Ubah nilai yang digunakan oleh placeholder tetap dalam Slides:

```javascript
const TEMPLATE_CONSTANTS = {
  nama_program: 'Kursus Pengurusan Data 2026',
  tarikh: '15 September 2026',
  tempat: 'Bilik Seminar Utama'
};
```

### E-mel

Ubah nama pengirim dan tajuk:

```javascript
senderName: 'Urus Setia Program',
emailSubject: 'Sijil Penyertaan Program'
```

Ubah teks dalam `EMAIL_TEMPLATE` untuk menukar mesej e-mel. Kekalkan kurungan, koma dan baris maklumat program dinamik kecuali anda memang mahu membuangnya.

Simpan skrip selepas selesai.

---

## Langkah 6 — Sediakan Automasi

1. Kembali ke Sheet respons dan pilih tabnya.
2. Buka **Extensions → Apps Script**.
3. Pilih `setupCertificateAutomation` daripada senarai fungsi.
4. Klik **Run**.
5. Log masuk dan benarkan akses yang diminta.

Fungsi ini memasang trigger penghantaran Form dan worker baris gilir setiap satu minit. Fungsi persediaan selamat dijalankan semula; trigger pendua tidak akan dicipta.

Muat semula spreadsheet untuk memaparkan menu **> Auto Certificate <**.

---

## Langkah 7 — Uji Sebelum Digunakan

Hantar satu respons menggunakan alamat e-mel anda sendiri.

Pastikan:

1. Respons muncul dalam Sheet dengan status `QUEUED`.
2. Status berubah kepada `SENT` selepas worker berjalan.
3. PDF muncul dalam folder Drive yang dipilih.
4. E-mel muncul dalam folder **Sent** Gmail dan peti masuk ujian.
5. Nama, nombor sijil, tarikh dan susun atur PDF adalah betul.

Berikan beberapa minit untuk worker menyelesaikan proses.

---

## Menggunakan Automasi

### Penunjuk penjanaan

Pengepala `Certificate Status` menunjukkan tetapan penjanaan semasa:

- Hijau — penjanaan sedang berjalan
- Merah — penjanaan dihentikan

Respons Form tetap diterima dan dimasukkan ke dalam baris gilir dalam kedua-dua keadaan.

### Menu Auto Certificate

| Menu | Tindakan |
|---|---|
| **▶️ Start Generating** | Mula memproses respons dalam baris gilir. |
| **⏸️ Stop Generating** | Jeda pemprosesan baharu. Sijil semasa akan diselesaikan dahulu. |
| **⚡ Process Queue Now** | Proses satu kelompok tanpa menunggu jadual seterusnya. |
| **📊 Queue Status** | Paparkan keadaan penjanaan dan jumlah baris gilir. |

### Status sijil

| Status | Maksud |
|---|---|
| `QUEUED` | Menunggu untuk diproses. |
| `PROCESSING` | Sijil sedang dihasilkan. |
| `SENT` | PDF telah dicipta dan e-mel telah dihantar. |
| `ERROR` | Proses gagal. Semak `Certificate Error`. |

Skrip turut merekodkan ID sijil, URL PDF, masa penghantaran, ralat dan masa mula diproses. Sijil yang direkodkan sebagai telah dihantar tidak akan dihantar semula secara automatik.

### Cuba semula sijil yang gagal atau terlepas

Selepas membetulkan punca ralat:

1. Buka Apps Script.
2. Pilih `regenerateMissingCertificates`.
3. Klik **Run**.

Fungsi ini mengembalikan baris yang gagal, terlepas atau tergendala kepada `QUEUED`. Sijil yang telah direkodkan sebagai dihantar tidak akan dimasukkan semula.

### Had e-mel

Google mengehadkan jumlah penerima e-mel harian. Untuk menyemak baki, jalankan `checkEmailQuota` dalam Apps Script dan buka execution log.

Apabila had habis, respons yang belum dihantar kekal dalam baris gilir untuk diproses kemudian.

---

## Penyelesaian Masalah Ringkas

| Masalah | Semakan |
|---|---|
| Status ialah `ERROR` | Baca sel `Certificate Error` pada baris tersebut. |
| Nama atau maklumat tiada dalam PDF | Pastikan placeholder Slides sama tepat dengan pengepala Sheet. |
| Maklumat program tiada | Pastikan placeholder dan kekunci `TEMPLATE_CONSTANTS` adalah sama. |
| PDF tidak dicipta | Semak ID templat, ID folder, kebenaran dan sel ralat. |
| Status ialah `SENT`, tetapi e-mel tidak diterima | Semak folder **Sent** Gmail, alamat penerima dan Spam/Junk. |
| Menu tidak dipaparkan | Muat semula spreadsheet selepas menjalankan persediaan. |
| Baris kekal `QUEUED` | Mulakan penjanaan, kemudian semak **Queue Status**. |

---

## Privasi

Respons Form mungkin mengandungi nama, alamat e-mel, nombor Kad Pengenalan dan maklumat peribadi lain.

- Pastikan Sheet respons dan folder sijil tidak dikongsi kepada umum.
- Berikan akses hanya kepada kakitangan yang dibenarkan.
- Elakkan meletakkan nombor Kad Pengenalan penuh pada sijil kecuali diperlukan.
- Jangan terbitkan data peserta sebenar atau ID fail Google peribadi.

---

## Untuk Program Seterusnya

1. Sediakan Form, templat Slides dan folder output baharu.
2. Salin `Code.gs` ke dalam Sheet respons baharu.
3. Ubah ID, nama lajur, maklumat program dan e-mel.
4. Jalankan `setupCertificateAutomation` daripada Sheet respons.
5. Hantar satu respons ujian sebelum berkongsi Form.
