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

        // ✅ Commands
        if (/^lyrics/i.test(userMessage)) {
          const query = userMessage.replace(/^lyrics/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(query)}`, "🎵 Lyrics");
        } 
        else if (/^who is/i.test(userMessage)) {
          const query = userMessage.replace(/^who is/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${encodeURIComponent(query)}`, "📖 Wiki");
        } 
        else if (/^pickup/i.test(userMessage)) {
          reply = await fetchAPI("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickup");
        }
        else if (/^quote/i.test(userMessage)) {
          reply = await fetchAPI("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
        }
        else if (/^joke/i.test(userMessage)) {
          reply = await fetchAPI("https://api.princetechn.com/api/fun/jokes?apikey=prince", "😂 Joke");
        }
        else if (/^fact/i.test(userMessage)) {
          reply = await fetchAPI("https://api.princetechn.com/api/fun/fact?apikey=prince", "📌 Fact");
        }
        else if (/^advice/i.test(userMessage)) {
          reply = await fetchAPI("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
        }
        else if (/^horoscope/i.test(userMessage)) {
          const sign = userMessage.replace(/^horoscope/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/fun/horoscope?apikey=prince&sign=${encodeURIComponent(sign)}`, "🔮 Horoscope");
        }
        else if (/^instagram/i.test(userMessage)) {
          const url = userMessage.replace(/^instagram/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/download/igdl?apikey=prince&url=${encodeURIComponent(url)}`, "📸 Instagram");
        }
        else if (/^tiktok/i.test(userMessage)) {
          const url = userMessage.replace(/^tiktok/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`, "🎵 TikTok");
        }
        else if (/^facebook/i.test(userMessage)) {
          const url = userMessage.replace(/^facebook/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/download/fb?apikey=prince&url=${encodeURIComponent(url)}`, "📘 Facebook");
        }
        else if (/^download/i.test(userMessage)) {
          const url = userMessage.replace(/^download/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/download/mp3?apikey=prince&url=${encodeURIComponent(url)}`, "🎶 YouTube");
        }
        else if (/^removebg/i.test(userMessage)) {
          const url = userMessage.replace(/^removebg/i, "").trim();
          reply = await fetchAPI(`https://api.princetechn.com/api/tools/removebg?apikey=prince&url=${encodeURIComponent(url)}`, "🖼 RemoveBG");
        }
        else if (/^menu/i.test(userMessage)) {
          reply = menuMessage();
        }
        else {
          // ✅ GPT fallback
          reply = await askPrinceAI(userMessage);
          reply = `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 Roy4`;
        }

        // ✅ Send back reply
        callSendAPI(senderId, reply);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ Fetch helper
async function fetchAPI(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return `${label}: ${data.result || data.response || JSON.stringify(data)}`;
  } catch (err) {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// ✅ Prince GPT
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.response || data.answer || "⚠️ GPT gave no reply.";
  } catch (err) {
    return "⚠️ GPT API failed.";
  }
}

// ✅ Send Message
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

// ✅ Menu message
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
📸 Instagram <url>  
🎵 TikTok <url>  
📘 Facebook <url>  
🎶 Download <yt_url>  
🖼 Removebg <url>  

━━━━━━━━━━━━━━━  
📝 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞:  
- Type “Lyrics Dusuma” to get lyrics  
- Type “Who is girlfriend of Rodgers” for wiki  
- Type “Download https://youtu.be/xyz” for music  

━━━━━━━━━━━━━━━  
⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒`;
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with all commands on port ${PORT}`)
);
