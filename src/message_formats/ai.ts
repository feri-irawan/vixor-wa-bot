import { WASocket } from "@adiwajshing/baileys";
import { log } from "console";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Configuration, OpenAIApi } from "openai";
import { resolve } from "path";
import { getBotId } from "../bot";

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_TOKEN,
});

const openai = new OpenAIApi(configuration);

const dir = resolve("data", "ai_messages.json");

/**
 * Mengambil pesan dari file
 */
export function getMessages(id?: string): any {
  if (!existsSync(dir)) writeFileSync(dir, "{}", "utf-8");

  let messages = JSON.parse(readFileSync(dir, "utf-8"));
  return id ? messages[id] : messages;
}

/**
 * Menyimpan pesan ke file
 */
function updateMessages(id: string, message: string) {
  let data = getMessages();
  let messages = data[id];

  if (messages) {
    if (messages.requestLength <= 20) {
      messages.requestLength += 1;
      messages.prompt += message;
    } else {
      messages.requestLength = 0;
      messages.prompt = message;
    }
  } else {
    data[id] = {
      requestLength: 1,
      prompt: message,
    };
  }

  writeFileSync(dir, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * clear prompt history
 */
export async function clearPromptHistory(sock: WASocket, id: string) {
  await sock.sendMessage(id, { text: "Membersihkan ingatan..." });

  let data = getMessages();
  delete data[id];
  writeFileSync(dir, JSON.stringify(data, null, 2), "utf-8");

  await new Promise((resolve) => setTimeout(() => resolve(true), 5000));
  await sock.sendMessage(id, { text: "Aduh.. kepalaku terasa agak aneh 😵‍💫" });
}

/**
 * Berkomunikasi dengan AI
 */
async function ask(sock: WASocket, prompt: string, id: string, message: any) {
  try {
    updateMessages(id, prompt);
    const messages = getMessages(id);

    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: messages.prompt.slice(-2048),
      max_tokens: 200,
      temperature: 0,
    });

    const text = completion.data.choices[0].text.trim();
    if (text.length === 0) {
      await sock.sendMessage(
        id,
        { text: "Yah, saya tidak tau." },
        { quoted: message }
      );
      return;
    }

    await sock.sendMessage(id, { text }, { quoted: message });

    updateMessages(id, text + "\n");
  } catch (err) {
    console.log(err);
  }
}

/**
 * Hendler AI
 */
export default async function ai(sock: WASocket, user: any, message: any) {
  const botId = getBotId(sock);

  // Gunakan AI hanya jika text tidak termasuk dalam bentuk command
  if (
    !user.text.startsWith("!") &&
    !["ping", "@all"].includes(user.text.toLowerCase())
  ) {
    const isGroup = user.id.endsWith("@g.us");

    // Ini hanya berlaku jika bot di dm
    if (!isGroup) {
      const conversation = message.message.conversation;
      let prompt = `Q:${conversation}\nA:`;

      // Jika tidak ada pesan yang dibalas
      if (!message.message?.extendedTextMessage) {
        log(prompt);
        await ask(sock, prompt, user.id, message);
      }

      // Jika ada pesan yang dibalas
      if (message.message?.extendedTextMessage) {
        const userText = message.message?.extendedTextMessage?.text;
        const contextInfo = message.message?.extendedTextMessage?.contextInfo;

        // Mengambil pesan yang dibalas
        const quotedMessage = contextInfo?.quotedMessage;
        if (quotedMessage) {
          log("Ada pesan yang dibalas");
          const conversation = quotedMessage?.conversation;

          prompt = `A:${conversation}\nQ:${userText}\nA:`;

          log(prompt);
          await ask(sock, prompt, user.id, message);
        }
      }
    }

    // Jika ada pesan yang dibalas ini hanya berlaku di grup
    if (message.message?.extendedTextMessage) {
      const userText = message.message?.extendedTextMessage?.text
        ?.replace(botId.short, "")
        .trim();
      const contextInfo = message.message?.extendedTextMessage?.contextInfo;
      const participant = contextInfo?.participant;

      const botMentioned =
        contextInfo?.mentionedJid.includes(botId.long) ||
        participant === botId.long;

      // Jika bot ditag
      if (botMentioned) {
        // Jika ada pesan yang dibalas dan bot ditag
        const quotedMessage = contextInfo?.quotedMessage;
        if (quotedMessage) {
          log("Ada pesan yang dibalas dan bot ditag di dalam pesan");

          const conversation = (
            quotedMessage?.conversation ||
            quotedMessage?.extendedTextMessage?.text
          ).replaceAll(botId.short, "");
          let prompt = `A:${conversation}\nQ:${userText}\nA:`;

          if (message.message?.extendedTextMessage?.text === botId.short) {
            log("Ada pesan yang dibalas dengan text yang sama dengan id bot");
            prompt = `Q:${conversation || "Halo bot"}\nA:`;
          }

          log(prompt);
          await ask(sock, prompt, user.id, message);
        }

        // Jika tidak ada pesan yang dibalas, tapi bot ditag di dalam pesan
        if (!quotedMessage) {
          log("Tidak ada pesan yang dibalas, tapi bot ditag di dalam pesan");
          let prompt = `Q:${userText}\nA:`;

          if (message.message?.extendedTextMessage?.text === botId.short) {
            log("pesan text sama dengan id bot");
            prompt = `Q:Halo bot\nA:`;
          }

          log(prompt);
          await ask(sock, prompt, user.id, message);
        }
      }
    }
  }
}
