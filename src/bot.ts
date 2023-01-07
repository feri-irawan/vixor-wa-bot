import { WASocket } from "@adiwajshing/baileys";
import { getMessages } from "./message_formats/ai";

export function getBotId(sock: WASocket) {
  const bot = sock.user;
  const id = bot.id.split(":")[0];

  return {
    short: "@" + id,
    long: id + "@s.whatsapp.net",
  };
}

export function getAllChatsJid() {
  const chats = getMessages();
  return Object.keys(chats);
}
