import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Messenger tokens
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

app.use(bodyParser.json());

// ✅ Verify Webhook
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

// ✅ Handle Messages
app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();
        console.log(`📩 User: ${userMessage}`);

        let reply;
        let imageUrl = null;

        // ✅ Lyrics
        if (/^lyrics/i.test(userMessage)) {
          const query = userMessage.replace(/^lyrics/i, "").trim();
          const result = await getLyrics(query);
          reply = result.text;
          imageUrl = result.image;
        }
        // ✅ Wiki
        else if (/^who is/i.test(userMessage)) {
          const query = userMessage.replace(/^who is/i, "").trim();
          const result = await getWiki(query);
          reply = result.text;
          imageUrl = result.image;
        }
        // ✅ Pickup
        else if (/^pickup/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickup");
        }
        // ✅ Quote
        else if (/^quote/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
        }
        // ✅ Joke
        else if (/^joke/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/jokes?apikey=prince", "😂 Joke");
        }
        // ✅ Fact
        else if (/^fact/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/fact?apikey=prince", "📌 Fact");
        }
        // ✅ Advice
        else if (/^advice/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
        }
        // ✅ Horoscope
        else if (/^horoscope/i.test(userMessage)) {
          const sign = userMessage.replace(/^horoscope/i, "").trim();
          reply = await getPlain(`https://api.princetechn.com/api/fun/horoscope?apikey=prince&sign=${encodeURIComponent(sign)}`, "🔮 Horoscope");
        }
        // ✅ Menu
        else if (/^menu/i.test(userMessage)) {
          reply = menuMessage();
        }
        // ✅ GPT fallback
        else {
          reply = await askPrinceAI(userMessage);
          reply = `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 Roy4`;
        }

        // ✅ Send response
        if (imageUrl) {
          sendImageWithCaption(senderId, imageUrl, reply);
        } else {
          callSendAPI(senderId, reply);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ===================
// COMMAND HANDLERS
// ===================

// 🎵 Lyrics
async function getLyrics(song) {
  try {
    const url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(song)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.result) {
      const { title, artist, lyrics, image } = data.result;
      return {
        text: `🎵 ${title}\n👤 ${artist}\n\n${lyrics}\n\n━━━━━━━━━━━━━━━\n𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗦𝗶𝗿 𝗥𝗼𝗱𝗴𝗲𝗿𝘀`,
        image: image || null,
      };
    } else {
      return { text: "⚠️ No lyrics found.", image: null };
    }
  } catch {
    return { text: "⚠️ Lyrics fetch failed.", image: null };
  }
}

// 📖 Wiki
async function getWiki(name) {
  try {
    const url = `https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.result) {
      const { title, description, image } = data.result;
      return {
        text: `📖 ${title}\n\n${description}\n\n━━━━━━━━━━━━━━━\n𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗦𝗶𝗿 𝗥𝗼𝗱𝗴𝗲𝗿𝘀`,
        image: image || null,
      };
    } else {
      return { text: "⚠️ No wiki info found.", image: null };
    }
  } catch {
    return { text: "⚠️ Wiki fetch failed.", image: null };
  }
}

// Plain text APIs
async function getPlain(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return `${label}: ${data.result || data.response || data.joke || data.quote || JSON.stringify(data)}`;
  } catch {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// 🤖 Prince GPT
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.response || data.answer || "⚠️ GPT gave no reply.";
  } catch {
    return "⚠️ GPT API failed.";
  }
}

// ✅ Messenger text reply
function callSendAPI(senderPsid, response) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: { text: response },
  };

  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  }).catch((err) => console.error("Unable to send:", err));
}

// ✅ Messenger image + caption
function sendImageWithCaption(senderPsid, imageUrl, caption) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: {
      attachment: {
        type: "image",
        payload: { url: imageUrl, is_reusable: true },
      },
    },
  };

  // First send the image
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  })
    .then(() => {
      // Then send the caption
      callSendAPI(senderPsid, caption);
    })
    .catch((err) => console.error("Unable to send image:", err));
}

// 📌 Menu
function menuMessage() {
  return `📌 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐌𝐄𝐍𝐔 📌

🎵 Lyrics <song>  
📖 Who is <name>  
💌 Pickup  
💡 Quote  
😂 Joke  
📌 Fact  
💭 Advice  
🔮 Horoscope <sign>  

━━━━━━━━━━━━━━━  
📝 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞:  
- "Lyrics Dusuma" → lyrics  
- "Who is girlfriend of Rodgers" → wiki  
- "Joke" → joke  

━━━━━━━━━━━━━━━  
⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒`;
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with GPT + image captions on port ${PORT}`)
);
