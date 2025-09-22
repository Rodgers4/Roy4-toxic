// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// INLINE tokens (no .env)
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

// ---- Helpers ----
async function fetchJSON(url, label = "") {
  try {
    const res = await fetch(url, { timeout: 15000 });
    const data = await res.json();
    console.log(`[fetchJSON] ${label} url=${url} -> OK`);
    return data;
  } catch (err) {
    console.error(`[fetchJSON] ${label} url=${url} -> ERROR`, err?.message || err);
    throw err;
  }
}

function parseApiResponse(data) {
  if (!data) return "No data returned";
  if (typeof data === "string") return data;
  if (Array.isArray(data) && data.length) return parseApiResponse(data[0]);

  // common possible fields
  const tryFields = [
    "result",
    "response",
    "quote",
    "advice",
    "lyrics",
    "data",
    "text",
    "description",
    "summary",
  ];

  for (const f of tryFields) {
    if (data[f]) {
      return typeof data[f] === "string" ? data[f] : parseApiResponse(data[f]);
    }
  }

  // spotify-like structures
  if (data.tracks && Array.isArray(data.tracks) && data.tracks.length) {
    const t = data.tracks[0];
    return `${t.name || t.title || "Track"}${t.artists ? " — " + (Array.isArray(t.artists) ? t.artists.map(a => a.name || a).join(", ") : t.artists) : ""}${t.url ? " • " + t.url : ""}`;
  }
  if (data.track) {
    const t = data.track;
    return `${t.name || t.title || "Track"}${t.artist ? " — " + (t.artist.name || t.artist) : ""}${t.url ? " • " + t.url : ""}`;
  }

  // wiki-like
  if (data.title || data.extract || data.description) {
    return `${data.title || ""}${data.description ? " — " + data.description : ""}${data.extract ? "\n\n" + data.extract : ""}`.trim();
  }

  // fallback to short JSON
  try {
    const s = JSON.stringify(data);
    return s.length > 800 ? s.slice(0, 800) + " ... (truncated)" : s;
  } catch {
    return "Unable to parse API response";
  }
}

// reuse for simple endpoints
async function getPlain(url, label) {
  try {
    const data = await fetchJSON(url, label);
    return `${label}: ${parseApiResponse(data)}`;
  } catch (err) {
    return `⚠️ Failed to fetch ${label} (${err?.message || "unknown error"})`;
  }
}

// ---- Messenger senders ----
function callSendAPI(senderPsid, response) {
  const footer = `\n\nType Menu to see cmds\n━━━━━━━━━━━━━━━\nᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴏʏ4`;
  const body = {
    recipient: { id: senderPsid },
    message: { text: (response || "") + footer },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Unable to send:", err?.message || err));
}

function sendImage(senderPsid, imageUrl) {
  const bodyImg = {
    recipient: { id: senderPsid },
    message: { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyImg),
  })
    .then(() => {
      callSendAPI(senderPsid, "");
    })
    .catch((err) => console.error("Unable to send image:", err?.message || err));
}

// ---- GPT fallback ----
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(message)}`;
    const data = await fetchJSON(url, "GPT");
    return parseApiResponse(data) || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑";
  } catch (err) {
    console.error("GPT API error:", err?.message || err);
    return "⚠️ Error reaching GPT API";
  }
}

// ---- Webhook verify + message handling ----
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  try {
    if (req.body.object === "page") {
      for (const entry of req.body.entry) {
        const event = entry.messaging[0];
        const senderId = event.sender.id;

        if (event.message && event.message.text) {
          const userMessage = event.message.text.trim();
          console.log("[incoming]", userMessage);

          // parse command + args
          const parts = userMessage.split(/\s+/);
          const cmd = parts.shift() || "";
          const args = parts.join(" ");

          // command handling (case-insensitive)
          const lc = cmd.toLowerCase();

          if (userMessage.toLowerCase().includes("menu") || lc === "menu") {
            const reply = await commandMenu();
            callSendAPI(senderId, reply);
            continue;
          }

          // fixed commands
          if (lc === "advice") {
            const r = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
            callSendAPI(senderId, r);
            continue;
          }
          if (lc === "pickupline") {
            const r = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickupline");
            callSendAPI(senderId, r);
            continue;
          }
          if (lc === "quote") {
            const r = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
            callSendAPI(senderId, r);
            continue;
          }
          if (lc === "waifu") {
            try {
              const data = await fetchJSON("https://api.princetechn.com/api/anime/waifu?apikey=prince", "Waifu");
              sendImage(senderId, data.url || data.image || "https://i.waifu.pics/qkCL5Z5.jpg");
            } catch (err) {
              callSendAPI(senderId, "⚠️ Failed to fetch waifu image");
            }
            continue;
          }

          // ---- newly added dynamic commands ----
          if (lc === "weather") {
            const location = args || "Kisumu";
            const url = `https://api.princetechn.com/api/search/weather?apikey=prince&location=${encodeURIComponent(location)}`;
            try {
              const data = await fetchJSON(url, `Weather:${location}`);
              callSendAPI(senderId, `🌦️ Weather for ${location}: ${parseApiResponse(data)}`);
            } catch (err) {
              callSendAPI(senderId, `⚠️ Could not get weather for ${location}`);
            }
            continue;
          }

          if (lc === "spotify") {
            const query = args || "Spectre";
            const url = `https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(query)}`;
            try {
              const data = await fetchJSON(url, `Spotify:${query}`);
              callSendAPI(senderId, `🎵 Spotify search "${query}": ${parseApiResponse(data)}`);
            } catch (err) {
              callSendAPI(senderId, `⚠️ Spotify search failed for "${query}"`);
            }
            continue;
          }

          if (lc === "lyrics") {
            const query = args || "Dynasty Miaa";
            const url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(query)}`;
            try {
              const data = await fetchJSON(url, `Lyrics:${query}`);
              callSendAPI(senderId, `🎤 Lyrics for "${query}": ${parseApiResponse(data)}`);
            } catch (err) {
              callSendAPI(senderId, `⚠️ Lyrics fetch failed for "${query}"`);
            }
            continue;
          }

          if (lc === "wiki") {
            const title = args || "Elon Musk";
            const url = `https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${encodeURIComponent(title)}`;
            try {
              const data = await fetchJSON(url, `Wiki:${title}`);
              callSendAPI(senderId, `📚 Wiki "${title}": ${parseApiResponse(data)}`);
            } catch (err) {
              callSendAPI(senderId, `⚠️ Wiki search failed for "${title}"`);
            }
            continue;
          }

          // default: send to GPT
          const reply = await askPrinceAI(userMessage);
          callSendAPI(senderId, `💠 ${reply}`);
        }
      }
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error("Webhook handler error:", err?.message || err);
    res.sendStatus(500);
  }
});

// Menu
async function commandMenu() {
  let quote = "";
  try {
    const data = await fetchJSON("https://api.princetechn.com/api/fun/quotes?apikey=prince", "menuQuote");
    quote = `\n💡 Quote: ${data.quote || data.result || "Stay motivated!"}`;
  } catch {
    quote = "\n💡 Quote: Stay motivated!";
  }

  return `➤ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐌𝐃𝐒  

💝 𝗔𝗖𝗧𝗜𝗩𝗘 𝗖𝗠𝗗𝗦  
💭 Advice  
💌 Pickupline  
💡 Quote  
🐾 Waifu  
🌦️ weather <location>  
🎵 spotify <query>  
🎤 lyrics <song+artist>  
📚 wiki <topic>  

━━━━━━━━━━━━━━━${quote}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Toxic Lover running on port ${PORT}`));
