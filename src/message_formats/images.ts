import axios from "axios";
import cheerio from "cheerio";
import { WASocket } from "@adiwajshing/baileys";

const urls = [
  "https://unsplash.com/s/photos/{QUERY}",
  "https://id.images.search.yahoo.com/search/images;_ylt=AwrPrCRlY6xjhJY8DqLLQwx.;_ylu=Y29sbwNzZzMEcG9zAzEEdnRpZAMEc2VjA3BpdnM-?p={QUERY}",
];
const BASE_URL = urls[1];

async function getContents(query: string) {
  return await axios
    .get(BASE_URL.replaceAll("{QUERY}", query), {
      headers: { "Accept-Encoding": "gzip,deflate,compress" },
    })
    .then(({ data }) => data)
    .catch(console.error);
}

function parseUnsplash(html) {
  const $ = cheerio.load(html);
  return $(".MorZF img")
    .map((_, element) => $(element).attr("src"))
    .toArray()
    .slice(0, 4);
}

function parseYahoo(html) {
  const $ = cheerio.load(html);
  return $("#sres")
    .find("a img")
    .map((_, element) => $(element).attr("data-src"))
    .toArray()
    .slice(0, 4);
}

export async function imageSearch(sock: WASocket, id: string, query: string) {
  if (query.length === 0) {
    await sock.sendMessage(id, {
      text: "Oops, jangan lupa masukan kata kunci!",
    });
    return;
  }

  try {
    const html = await getContents(encodeURI(query));

    const images =
      BASE_URL === urls[0] ? parseUnsplash(html) : parseYahoo(html);

    let i = 1;
    for (const image of images) {
      await sock.sendMessage(id, { image: { url: image }, viewOnce: true });

      if (i === images.length)
        await sock.sendMessage(id, {
          text: `Untuk melihat gambar *\`${query}\`* lainnya.\n\nSilakan buka link berikut!\n${BASE_URL.replaceAll(
            "{QUERY}",
            encodeURI(query)
          )}`,
        });

      i++;
    }

    i = 1;
  } catch (err) {
    await sock.sendMessage(id, { text: "Oops, gagal.." });
  }
}

export async function createTextSticker(
  sock: WASocket,
  id: string,
  query: string,
  message: any
) {
  const url =
    "https://2d8ge4-3000.preview.csb.app/create?" +
    encodeURI(query || "text=Teksnya apa?");

  await sock.sendMessage(id, { sticker: { url } }, { quoted: message });
}
