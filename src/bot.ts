import { WASocket } from "@adiwajshing/baileys";

export function getBotId(sock: WASocket) {
  const bot = sock.user;
  return {
    short: "@" + bot.id.replace(":32@s.whatsapp.net", ""),
    long: bot.id.replace(":32", ""),
  };
}
