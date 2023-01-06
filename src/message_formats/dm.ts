import { WASocket } from "@adiwajshing/baileys";

export default async function dm(
  sock: WASocket,
  args: string,
  id: string,
  message: any
) {
  const targetId =
    args
      .slice(args.indexOf("(") + 2, args.indexOf(")"))
      .replaceAll("-", "")
      .replaceAll(" ", "") + "@s.whatsapp.net";
  const text = args.slice(args.indexOf(")") + 1).trim();

  await sock.sendMessage(targetId, { text }); // mengirim ke penerima

  await sock.sendMessage(id, { text: "Terkirim! 👍🏻" }, { quoted: message }); // mengirim ke pengirim
}
