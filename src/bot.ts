import { WASocket } from "@adiwajshing/baileys";

export function getBotId(sock: WASocket) {
  const bot = sock.user;
  const id = bot.id.split(":")[0];

  return {
    short: "@" + id,
    long: id + "@s.whatsapp.net",
  };
}
