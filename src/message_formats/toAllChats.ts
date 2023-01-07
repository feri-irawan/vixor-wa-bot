import { WASocket } from "@adiwajshing/baileys";
import { getAllChatsJid } from "../bot";

export default async function sendToAllChats(sock: WASocket, message: string) {
  const jids = getAllChatsJid();

  for (const id of jids) {
    await sock.sendMessage(id, { text: message });
  }
}
