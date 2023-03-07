import { WASocket } from "@adiwajshing/baileys";

export default async function donate(sock: WASocket, id: string) {
  await sock.sendMessage(id, {
    text: `*Ingin donasi?*
Donasi yang terkumpul akan digunakan untuk keperluan server bot agar semakin lebih baik.
    
Link donasi:
https://saweria.co/feriirawans`,
  });
}
