import { WASocket } from "@adiwajshing/baileys";

export default async function call(sock: WASocket, data: any) {
  const { chatId, from, status, id } = data[0];

  await sock.rejectCall(id, from);

  if ((status === "timeout" || status === "reject") && from === chatId)
    sock.sendMessage(from, {
      text: "Tidak dapat menerima panggilan, ini adalah akun Bot.",
    });
}
