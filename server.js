// server.js
import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

/* ===== Messenger tokens ===== */
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN =
  "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

/* ===== Express ===== */
app.use(bodyParser.json());

/* ===== Verify Webhook ===== */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

/* ===== Webhook ===== */
app.post("/webhook", async (req, res) => {
  if (req.body.object !== "page") return res.sendStatus(404);

  for (const entry of req.body.entry) {
    const event = entry.messaging?.[0];
    if (!event) continue;

    const senderId = event.sender.id;

    // Persistent menu postback
    if (event.postback && event.postback.payload === "MENU_PAYLOAD") {
      await typing(senderId, true);
      await sendText(senderId, getMenuText());
      await typing(senderId, false);
      continue;
    }

    // Message text
    if (event.message && event.message.text) {
      const userMessage = event.message.text.trim();
      console.log("📩 User:", userMessage);

      await typing(senderId, true);

      let responded = false;
      const [firstWord, ...rest] = userMessage.split(" ");
      const cmd = (firstWord || "").toLowerCase();
      const query = rest.join(" ").trim();

      try {
        // Menu
        if (userMessage.toLowerCase() === "menu") {
          await sendText(senderId, getMenuText());
          responded = true;
        }

        // Identity Q&A
        if (!responded && userMessage.toLowerCase().includes("what is your name")) {
          await sendText(senderId, "🤍 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 created by 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 🤍");
          responded = true;
        }
        if (!responded && userMessage.toLowerCase().includes("who is your owner")) {
          await sendText(senderId, "💙 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙");
          responded = true;
        }

        /* ===== Commands (case-insensitive) ===== */

        // Lyrics <song>
        if (!responded && cmd === "lyrics" && query) {
          await handleLyrics(senderId, query);
          responded = true;
        }

        // Wiki <topic>  (e.g., Wiki Who is girlfriend of Rodgers)
        if (!responded && (cmd === "wiki" || cmd === "wikimedia") && query) {
          await handleWiki(senderId, query);
          responded = true;
        }

        // Pickup
        if (!responded && userMessage.toLowerCase().startsWith("pickup")) {
          await handlePickup(senderId);
          responded = true;
        }

        // Removebg <image-url>  -> send processed image (no link)
        if (!responded && cmd === "removebg" && query) {
          await handleRemoveBG(senderId, query);
          responded = true;
        }

        // YtMp3 <youtube-url>  -> send audio (attachment)
        if (!responded && (cmd === "ytmp3" || cmd === "download") && query) {
          await handleYtMp3(senderId, query);
          responded = true;
        }

        // TikTok <url> -> send video (attachment)
        if (!responded && cmd === "tiktok" && query) {
          await handleTikTok(senderId, query);
          responded = true;
        }

        // Playstore <app> -> app icon + caption (image + text)
        if (!responded && cmd === "playstore" && query) {
          await handlePlaystore(senderId, query);
          responded = true;
        }

        // Spotify <query> -> first track info (text)
        if (!responded && cmd === "spotify" && query) {
          await handleSpotify(senderId, query);
          responded = true;
        }

        // YouTube <query> -> first result title (text)
        if (!responded && (cmd === "youtube" || cmd === "yt") && query) {
          await handleYouTubeSearch(senderId, query);
          responded = true;
        }

        // Chord <song>
        if (!responded && cmd === "chord" && query) {
          await handleChord(senderId, query);
          responded = true;
        }

        // Weather <city>
        if (!responded && cmd === "weather" && query) {
          await handleWeather(senderId, query);
          responded = true;
        }

        // Npm <package>
        if (!responded && cmd === "npm" && query) {
          await handleNpm(senderId, query);
          responded = true;
        }

        // HappyMod <app>
        if (!responded && cmd === "happymod" && query) {
          await handleHappyMod(senderId, query);
          responded = true;
        }

        // ApkMirror <app>
        if (!responded && cmd === "apkmirror" && query) {
          await handleApkMirror(senderId, query);
          responded = true;
        }

        // Stickers <query> -> first sticker image
        if (!responded && cmd === "stickers" && query) {
          await handleStickers(senderId, query);
          responded = true;
        }

        // Google <query> -> top 3 results as text (no links)
        if (!responded && cmd === "google" && query) {
          await handleGoogle(senderId, query);
          responded = true;
        }

        // Unsplash <query> -> send first image (attachment)
        if (!responded && cmd === "unsplash" && query) {
          await handleUnsplash(senderId, query);
          responded = true;
        }

        // Wallpapers <query> -> send first image (attachment)
        if (!responded && cmd === "wallpapers" && query) {
          await handleWallpapers(senderId, query);
          responded = true;
        }

        // Force GPT via "gpt <query>"
        if (!responded && cmd === "gpt") {
          const q = query || userMessage;
          const g = await askPrinceGPT(q, true);
          await sendText(senderId, g);
          responded = true;
        }

        // Fallback → GPT for everything else
        if (!responded) {
          const g = await askPrinceGPT(userMessage, true);
          await sendText(senderId, g);
          responded = true;
        }

      } catch (err) {
        console.error("❌ Handler error:", err);
        await sendText(senderId, "⚠️ Something went wrong. Try again.");
      }

      await typing(senderId, false);
    }
  }

  res.sendStatus(200);
});

/* ================= Utilities ================= */

async function getJsonOrText(url) {
  const res = await fetch(url);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ===== GPT (footer only here) ===== */
async function askPrinceGPT(message, withFooter = true) {
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(
      message
    )}`;
    const data = await getJsonOrText(url);
    const body =
      (data && (data.response || data.result || data.answer)) ||
      (typeof data === "string" ? data : JSON.stringify(data)) ||
      "No reply";
    return withFooter
      ? `💠 ${body}\n\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐑𝐨𝐲𝟒`
      : body;
  } catch (e) {
    console.error("GPT error:", e);
    return "⚠️ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (AI unreachable)";
  }
}

/* ===== Messenger send helpers ===== */
async function sendText(psid, text) {
  return fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: psid }, message: { text } }),
  }).catch((e) => console.error("Send text error:", e));
}

async function sendImage(psid, imageUrl) {
  return fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: psid },
      message: { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } },
    }),
  }).catch((e) => console.error("Send image error:", e));
}

async function sendAudio(psid, audioUrl) {
  return fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: psid },
      message: { attachment: { type: "audio", payload: { url: audioUrl, is_reusable: true } } },
    }),
  }).catch((e) => console.error("Send audio error:", e));
}

async function sendVideo(psid, videoUrl) {
  return fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: psid },
      message: { attachment: { type: "video", payload: { url: videoUrl, is_reusable: true } } },
    }),
  }).catch((e) => console.error("Send video error:", e));
}

async function typing(psid, isOn) {
  const sender_action = isOn ? "typing_on" : "typing_off";
  return fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: psid }, sender_action }),
  }).catch((e) => console.error("Typing error:", e));
}

/* ================= Command handlers ================= */

// Lyrics: send cover image (if present) + full lyrics as text
async function handleLyrics(psid, query) {
  const url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const title = data.title || data.song || query;
  const artist = data.artist || data.author || data.singer || "Unknown";
  const lyrics =
    data.lyrics ||
    data.result ||
    data.response ||
    (typeof data === "string" ? data : JSON.stringify(data));
  const cover =
    data.image || data.thumbnail || data.cover || null;

  if (cover) await sendImage(psid, cover);

  const caption =
    `🎶 𝐋𝐲𝐫𝐢𝐜𝐬 — ${title}\n👨‍🎤 𝐀𝐫𝐭𝐢𝐬𝐭: ${artist}\n\n${lyrics}\n\n𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗦𝗶𝗿 𝗥𝗼𝗱𝗴𝗲𝗿𝘀 𝗧𝗲𝗰𝗵`;
  await sendText(psid, caption);
}

// Wiki: clean text, no links; if image present, show it before text
async function handleWiki(psid, query) {
  const url = `https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const title = data.title || query;
  const desc =
    data.description || data.extract || data.summary ||
    (typeof data === "string" ? data : JSON.stringify(data));
  const thumb = data.image || data.thumbnail || null;

  if (thumb) await sendImage(psid, thumb);
  await sendText(psid, `📖 𝐖𝐢𝐤𝐢 — ${title}\n\n${desc}`);
}

// Pickup: plain text
async function handlePickup(psid) {
  const url = `https://api.princetechn.com/api/fun/pickupline?apikey=prince`;
  const data = await getJsonOrText(url);
  const line = data.result || data.response || (typeof data === "string" ? data : "");
  await sendText(psid, `💘 𝐏𝐢𝐜𝐤𝐮𝐩 𝐋𝐢𝐧𝐞\n${line}`);
}

// Remove BG: send processed image as attachment
async function handleRemoveBG(psid, imageUrl) {
  const finalUrl = `https://api.princetechn.com/api/tools/removebg?apikey=prince&url=${encodeURIComponent(
    imageUrl
  )}`;
  await sendImage(psid, finalUrl);
  await sendText(psid, "🖼 𝐑𝐞𝐦𝐨𝐯𝐞𝐝 𝐁𝐚𝐜𝐤𝐠𝐫𝐨𝐮𝐧𝐝");
}

// YT MP3: send audio file as attachment (no link)
async function handleYtMp3(psid, ytUrl) {
  const url = `https://api.princetechn.com/api/download/mp3?apikey=prince&url=${encodeURIComponent(
    ytUrl
  )}`;
  const data = await getJsonOrText(url);

  const title = data.title || "YouTube Audio";
  const audioUrl = data.url || data.result || data.download || data.link || "";
  if (audioUrl) await sendAudio(psid, audioUrl);
  await sendText(psid, `🎧 𝐘𝐓 𝐌𝐏𝟑 — ${title}`);
}

// TikTok: send video as attachment (no link)
async function handleTikTok(psid, ttUrl) {
  const url = `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(
    ttUrl
  )}`;
  const data = await getJsonOrText(url);

  const title = data.title || "TikTok Video";
  const videoUrl = data.video || data.nowm || data.url || data.result || "";
  if (videoUrl) await sendVideo(psid, videoUrl);
  await sendText(psid, `🎥 𝐓𝐢𝐤𝐓𝐨𝐤 — ${title}`);
}

// Playstore: show icon then caption
async function handlePlaystore(psid, query) {
  const url = `https://api.princetechn.com/api/search/playstore?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const name = data.title || data.name || query;
  const dev = data.developer || data.dev || "Unknown developer";
  const desc = data.description || data.summary || "";
  const icon = data.icon || data.image || null;

  if (icon) await sendImage(psid, icon);
  await sendText(psid, `📱 𝐏𝐥𝐚𝐲𝐬𝐭𝐨𝐫𝐞 — ${name}\n👤 ${dev}\n\n${desc}`);
}

// Spotify: first track info
async function handleSpotify(psid, query) {
  const url = `https://api.princetechn.com/api/search/spotify?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const name = data.title || data.name || query;
  const artist = data.artist || data.author || "Unknown";
  const cover = data.image || data.thumbnail || null;

  if (cover) await sendImage(psid, cover);
  await sendText(psid, `🎵 𝐒𝐩𝐨𝐭𝐢𝐟𝐲 — ${name}\n👨‍🎤 ${artist}`);
}

// YouTube search: first result title + optional thumbnail
async function handleYouTubeSearch(psid, query) {
  const url = `https://api.princetechn.com/api/search/youtube?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  let title = query;
  let thumb = null;

  if (Array.isArray(data) && data.length) {
    title = data[0].title || title;
    thumb = data[0].thumbnail || data[0].image || null;
  } else {
    title = data.title || title;
    thumb = data.thumbnail || data.image || null;
  }

  if (thumb) await sendImage(psid, thumb);
  await sendText(psid, `▶️ 𝐘𝐨𝐮𝐓𝐮𝐛𝐞 — ${title}`);
}

// Chord: plain text
async function handleChord(psid, query) {
  const url = `https://api.princetechn.com/api/search/chord?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const title = data.title || query;
  const artist = data.artist || "Unknown";
  const chord =
    data.chord || data.chords || data.result || (typeof data === "string" ? data : "");

  await sendText(psid, `🎸 𝐂𝐡𝐨𝐫𝐝 — ${title}\n👨‍🎤 ${artist}\n\n${chord}`);
}

// Weather: plain text
async function handleWeather(psid, city) {
  const url = `https://api.princetechn.com/api/tools/weather?apikey=prince&city=${encodeURIComponent(
    city
  )}`;
  const data = await getJsonOrText(url);

  const loc = data.location || city;
  const temp = data.temperature || data.temp || "";
  const cond = data.condition || data.desc || data.weather || "";

  await sendText(psid, `☁️ 𝐖𝐞𝐚𝐭𝐡𝐞𝐫 — ${loc}\n🌡️ ${temp}\n📝 ${cond}`);
}

// NPM: plain text
async function handleNpm(psid, pkg) {
  const url = `https://api.princetechn.com/api/search/npm?apikey=prince&query=${encodeURIComponent(
    pkg
  )}`;
  const data = await getJsonOrText(url);

  const name = data.name || pkg;
  const ver = data.version || data.latest || "";
  const desc = data.description || "";

  await sendText(psid, `📦 𝐍𝐏𝐌 — ${name}\n🔖 ${ver}\n\n${desc}`);
}

// HappyMod: plain text
async function handleHappyMod(psid, query) {
  const url = `https://api.princetechn.com/api/search/happymod?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const name = data.title || data.name || query;
  const ver = data.version || "";
  await sendText(psid, `🎮 𝐇𝐚𝐩𝐩𝐲𝐌𝐨𝐝 — ${name}\n🔖 ${ver}`);
}

// ApkMirror: plain text
async function handleApkMirror(psid, query) {
  const url = `https://api.princetechn.com/api/search/apkmirror?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  const name = data.title || data.name || query;
  const ver = data.version || "";
  await sendText(psid, `📥 𝐀𝐏𝐊𝐌𝐢𝐫𝐫𝐨𝐫 — ${name}\n🔖 ${ver}`);
}

// Stickers: send first sticker image
async function handleStickers(psid, query) {
  const url = `https://api.princetechn.com/api/search/stickers?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  let img = null;
  if (Array.isArray(data) && data.length) img = data[0].url || data[0].link || null;
  if (!img) img = data.url || data.link || data.result || null;

  if (img) await sendImage(psid, img);
  await sendText(psid, `💟 𝐒𝐭𝐢𝐜𝐤𝐞𝐫𝐬 — ${query}`);
}

// Google: show top 3 titles only (no links)
async function handleGoogle(psid, query) {
  const url = `https://api.princetechn.com/api/search/google?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  let text = "";
  if (Array.isArray(data) && data.length) {
    const top = data.slice(0, 3);
    text = top.map((x, i) => `${i + 1}. ${x.title || x.name || "Result"}`).join("\n");
  } else {
    text = typeof data === "string" ? data : JSON.stringify(data);
  }
  await sendText(psid, `🔎 𝐆𝐨𝐨𝐠𝐥𝐞 — ${query}\n\n${text}`);
}

// Unsplash: send first image
async function handleUnsplash(psid, query) {
  const url = `https://api.princetechn.com/api/search/unsplash?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  let img = null;
  if (Array.isArray(data) && data.length) img = data[0].url || data[0].link || null;
  if (!img) img = data.url || data.link || data.result || null;

  if (img) await sendImage(psid, img);
  await sendText(psid, `🖼 𝐔𝐧𝐬𝐩𝐥𝐚𝐬𝐡 — ${query}`);
}

// Wallpapers: send first image
async function handleWallpapers(psid, query) {
  const url = `https://api.princetechn.com/api/search/wallpapers?apikey=prince&query=${encodeURIComponent(
    query
  )}`;
  const data = await getJsonOrText(url);

  let img = null;
  if (Array.isArray(data) && data.length) img = data[0].url || data[0].link || null;
  if (!img) img = data.url || data.link || data.result || null;

  if (img) await sendImage(psid, img);
  await sendText(psid, `🌆 𝐖𝐚𝐥𝐥𝐩𝐚𝐩𝐞𝐫𝐬 — ${query}`);
}

/* ===== Styled Menu (text) ===== */
function getMenuText() {
  return (
`╔═══════════════════╗
   💠 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 💠
╚═══════════════════╝

📀 𝐌𝐔𝐒𝐈𝐂
• Lyrics <song>
• Chord <song>
• Spotify <song/artist>
• YouTube <query>
• YtMp3 <youtube-url>

📚 𝐊𝐍𝐎𝐖𝐋𝐄𝐃𝐆𝐄
• Wiki <topic/question>
• Google <query>
• Npm <package>
• Weather <city>

😂 𝐅𝐔𝐍
• Pickup

🎨 𝐌𝐄𝐃𝐈𝐀 / 𝐓𝐎𝐎𝐋𝐒
• TikTok <url>
• Removebg <image-url>
• Unsplash <query>
• Wallpapers <query>
• Playstore <app>
• HappyMod <app>
• ApkMirror <app>
• Stickers <query>

━━━━━━━━━━━━━━━
📌 𝐇𝐨𝐰 𝐭𝐨 𝐔𝐬𝐞
- Just start with the command name
- Example: Lyrics Dusuma
- Example: Wiki Who is the girlfriend of Rodgers?
𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘
━━━━━━━━━━━━━━━`
  );
}

/* ===== Persistent Menu (button) ===== */
async function setPersistentMenu() {
  const url = `https://graph.facebook.com/v16.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`;
  const body = {
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [{ type: "postback", title: "📜 Show Menu", payload: "MENU_PAYLOAD" }],
      },
    ],
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.s
