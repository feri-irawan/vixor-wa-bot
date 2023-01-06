import { WASocket } from "@adiwajshing/baileys";

export default function call(sock: WASocket, data: any) {
  const { chatId, from, status } = data[0];

  if ((status === "timeout" || status === "reject") && from === chatId)
    sock.sendMessage(from, {
      text: "Tidak dapat menerima panggilan, ini adalah akun Bot.",
    });
}
