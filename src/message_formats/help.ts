import { WASocket } from "@adiwajshing/baileys";

export default async function sendHelp(sock: WASocket, id: string) {
  const text = `
Hai, saya *Vixor Bot* 🤖👋
Dibuat pada 26/12/2022

Berikut perintah yang saya pahami:

> *!help*
Minta bantuan

> *!image* [kata kunci]
Mencari gambar

> *!textSticker* text=[text]
Membuat text gambar

> *!link*
Link grup ini
   
> *!ask* [pertanyaan]
Bertanya dengan robot AI (Kecerdasan Buatan)
   
> *@all*
Tag semua anggota grup (balas satu pesan)

> *!clear*
Membersihkan ingatan Bot

*Khusus Admin*
> *!kick* [tag kontaknya]
Mengeluarkan member group
`;

  await sock.sendMessage(id, { text });
}
