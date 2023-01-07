import { config } from "dotenv";
config();

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import { log } from "console";
import sendHelp from "./message_formats/help";
import { inviteLink, tagAll } from "./message_formats/group";
import { createTextSticker, imageSearch } from "./message_formats/images";
import dm from "./message_formats/dm";
import ai from "./message_formats/ai";
import call from "./message_formats/call";
import reaction from "./message_formats/reaction";
import sendToAllChats from "./message_formats/toAllChats";

connectToWhatsApp();

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("wabot_auth_state");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      log(
        "connection closed due to ",
        lastDisconnect.error,
        ", reconnecting ",
        shouldReconnect
      );
      // reconnect if not logged out
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      log("opened connection");
    }
  });

  // Jika ada panggilan
  sock.ev.on("call", (data) => call(sock, data));

  // Jika ada pesan yang direaction
  sock.ev.on("messages.reaction", (messages) => reaction(sock, messages));

  sock.ev.on("messages.upsert", async (m) => {
    // log(JSON.stringify(m, null, 2));

    // Message
    const message = m.messages[0];

    // User
    const user = {
      id: message.key.remoteJid!,
      text:
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text ||
        "",
    };

    if (m.type === "notify" && !message.key.fromMe) {
      // Ping
      if (user.text.toLowerCase() === "ping")
        await sock.sendMessage(user.id, { text: "Pong!" }, { quoted: message });

      // Tag semua member grup
      if (user.text.toLowerCase().includes("@all")) tagAll(sock, message);

      // Dengan commands
      if (user.text.startsWith("!")) {
        const command = user.text.split(" ").slice(0, 1)[0].slice(1);
        const args = user.text.slice(command.length + 1).trim();

        switch (command) {
          case "help":
            await sendHelp(sock, user.id);
            break;

          case "image":
            await imageSearch(sock, user.id, args);
            break;

          case "textSticker":
            await createTextSticker(sock, user.id, args, message);
            break;

          case "dm":
            await dm(sock, args, user.id, message);
            break;

          case "link":
            await inviteLink(sock, user.id, message);
            break;

          case "toAll":
            await sendToAllChats(sock, args);
            break;

          default:
            break;
        }
      }

      await ai(sock, user, message);
    }

    const dontDeleteFrom = process.env.DONT_REMOVE_USER_CHAT.split(",").map(
      (v) => v + "@s.whatsapp.net"
    );

    if (!dontDeleteFrom.includes(user.id))
      await sock.chatModify({ delete: true, lastMessages: [message] }, user.id);
  });
}
