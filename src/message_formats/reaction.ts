import { WASocket } from "@adiwajshing/baileys";

export default function reaction(sock: WASocket, messages: any) {
  const { key, reaction } = messages[0];

  if (!reaction.key.fromMe)
    sock.sendMessage(reaction.key.remoteJid, {
      react: { text: reaction.text, key },
    });
}
