import { WASocket } from "@adiwajshing/baileys";
import { getBotId } from "../bot";

export async function inviteLink(sock: WASocket, id: string, message: any) {
  const inviteCode = await sock.groupInviteCode(id);
  await sock.sendMessage(
    id,
    { text: "Link grup:\nhttps://chat.whatsapp.com/" + inviteCode },
    { quoted: message }
  );
}

export async function tagAll(sock: WASocket, message: any) {
  const id = message.key.remoteJid;

  const participants = await sock.groupMetadata(id).then(({ participants }) =>
    participants
      .map(({ id }) => ({
        text: `@${id.replace("@s.whatsapp.net", "")}`,
        userId: id,
      }))
      // Hapus id bot dari array
      .filter(({ text }) => !sock.user.id.includes(text.slice(1)))
  );

  // Jika ada pesan yang dibalas user pen-tag, maka balas juga pesan tersebut dan tag semua user
  if (message.message.extendedTextMessage) {
    await sock.sendMessage(
      id,
      {
        // text: participants.map(({ text }) => text).join(" "),
        text: "*@all*, lihat ini 👆🏻",
        mentions: participants.map(({ userId }) => userId),
      },
      {
        quoted: {
          ...message,
          key: {
            ...message.key,
            id: message.message.extendedTextMessage.contextInfo.stanzaId, // Mengganti id target dengan id pesan yang dibalas user pen-tag
            participant:
              message.message.extendedTextMessage.contextInfo.participant, // Mengganti participant sesuai id pesan yang dibalas pen-tag
          },
        },
      }
    );
    return;
  }

  // Jika tidak ada pesan yang dibalas user, maka tag saja semua member
  // await sock.sendMessage(id, {
  //   text: participants.map(({ text }) => text).join(" "),
  //   mentions: participants.map(({ userId }) => userId),
  // });
}

export async function kickUser(
  sock: WASocket,
  id: string,
  args: string,
  message: any
) {
  if (args.startsWith("@")) {
    // User yang akan dikick
    const userTarget = args.split(" ").map((v) => v.replace("@", ""))[0];

    // Jika yang ditarget adalah admin maka batalkan
    if (userTarget === getBotId(sock).short.slice(1)) return;

    // Mendapatkan member group
    const participants = await sock
      .groupMetadata(id)
      .then(({ participants }) => participants);

    // Cek apakah yang mengguakan perintah adalah admin
    const isAdmin = participants.find(
      ({ id }) => id === message.key.participant
    ).admin;

    // List users yang akan dikick
    const usersWillRemove = participants
      .filter(({ id }) => id.includes(userTarget))
      .map(({ id }) => id);

    if (isAdmin) {
      await sock.groupParticipantsUpdate(id, usersWillRemove, "remove");
    }
  }
}
