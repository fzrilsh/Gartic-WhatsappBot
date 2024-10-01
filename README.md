
# Gartic-WhatsappBot

Gartic-WhatsappBot adalah bot WhatsApp yang memungkinkan Anda bermain Gartic.io langsung di WhatsApp! Pengalaman bermain hampir sama seperti di situs web [gartic.io](https://gartic.io), tetapi melalui antarmuka percakapan WhatsApp.

## Fitur
- Bermain Gartic.io di WhatsApp
- Antarmuka sederhana melalui perintah bot
- Pengalaman bermain seperti di website Gartic.io

## Instalasi

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan bot ini:

1. **Clone repository ini** ke komputer Anda:
   ```bash
   git clone https://github.com/fzrilsh/Gartic-WhatsappBot
   ```

2. **Masuk ke direktori project**:
   ```bash
   cd Gartic-WhatsappBot
   ```

3. **Install dependencies** yang diperlukan:
   ```bash
   npm install
   ```

4. **Download Chromium** yang dibutuhkan oleh Puppeteer:
   ```bash
   node node_modules/puppeteer/install.js
   ```

5. **Install nodemon secara global** untuk memudahkan pengembangan:
   ```bash
   npm install nodemon -g
   ```

6. **Jalankan project** dengan menggunakan nodemon:
   ```bash
   nodemon
   ```

7. **Scan QR code** yang muncul di terminal untuk menghubungkan WhatsApp dengan bot.

## Cara Bermain
- Setelah WhatsApp terhubung dengan bot melalui QR code, Anda dapat mulai bermain dengan mengirimkan pesan .start di dalam group dan mengikuti instruksi yang diberikan oleh bot di dalam chat WhatsApp.

## Kontribusi
Kontribusi sangat kami hargai! Silakan lakukan fork repository ini, buat perubahan yang Anda inginkan, dan kirimkan pull request.

## Lisensi
Proyek ini dilisensikan di bawah [MIT License](./LICENSE).
