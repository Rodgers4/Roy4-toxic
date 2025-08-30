// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Messenger tokens (INLINE, no .env)
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

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
        let reply;

        // 🎭 Command handlers
        if (userMessage.toLowerCase().includes("menu")) {
          reply = commandMenu();
          callSendAPI(senderId, reply);
        }
        // ROY’S COMMANDS
        else if (/^matches$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/football/today-matches?apikey=prince", "⚽ Matches");
          callSendAPI(senderId, reply);
        } 
        else if (/^define/i.test(userMessage)) {
          const term = userMessage.split(" ")[1] || "Unknown";
          reply = await getPlain(`https://api.princetechn.com/api/tools/define?apikey=prince&term=${encodeURIComponent(term)}`, "📖 Define");
          callSendAPI(senderId, reply);
        }
        else if (/^fancyv2/i.test(userMessage)) {
          const text = userMessage.replace(/^fancyv2/i, "").trim() || "Prince Tech";
          reply = await getPlain(`https://api.princetechn.com/api/tools/fancyv2?apikey=prince&text=${encodeURIComponent(text)}`, "✨ FancyV2");
          callSendAPI(senderId, reply);
        }
        else if (/^fancy/i.test(userMessage)) {
          const text = userMessage.replace(/^fancy/i, "").trim() || "Prince Tech";
          reply = await getPlain(`https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodeURIComponent(text)}`, "🌟 Fancy");
          callSendAPI(senderId, reply);
        }
        // BELLA’S COMMANDS
        else if (/^advice$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
          callSendAPI(senderId, reply);
        }
        else if (/^pickupline$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickupline");
          callSendAPI(senderId, reply);
        }
        else if (/^quote$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
          callSendAPI(senderId, reply);
        }
        else if (/^waifu$/i.test(userMessage)) {
          const res = await fetch("https://api.princetechn.com/api/anime/waifu?apikey=prince");
          const data = await res.json();
          sendImage(senderId, data.url || "https://i.waifu.pics/qkCL5Z5.jpg");
        }
        // Default → GPT
        else {
          reply = await askPrinceAI(userMessage);
          callSendAPI(senderId, `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`);
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ GPT Fallback
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.response || data.result || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑";
  } catch {
    return "⚠️ Error reaching GPT API";
  }
}

// ✅ Fetch plain API text
async function getPlain(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return `${label}: ${data.result || data.response || data.advice || data.quote || data.definition || "No data"}`;
  } catch {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// ✅ Send text
function callSendAPI(senderPsid, response) {
  const body = {
    recipient: { id: senderPsid },
    message: { text: response },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Unable to send:", err));
}

// ✅ Send image
function sendImage(senderPsid, imageUrl) {
  const body = {
    recipient: { id: senderPsid },
    message: { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Unable to send image:", err));
}

// ✅ Menu
function commandMenu() {
  return `➤ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐌𝐃𝐒  

👑 𝗥𝗢𝗬'𝗦 𝗖𝗠𝗗𝗦  
⚽ Matches  
📖 Define <word>  
🌟 Fancy <text>  
✨ Fancyv2 <text>  

💝 𝗕𝗘𝗟𝗟𝗔'𝗦 𝗖𝗠𝗗𝗦  
💭 Advice  
💌 Pickupline  
💡 Quote  
🐾 Waifu  

━━━━━━━━━━━━━━━  
📔 𝗛𝗼𝘄 𝗧𝗼 𝗨𝘀𝗲  
- Matches → today’s football games  
- Define Dog → definition of Dog  
- Fancy Prince Tech → fancy styled text  
- Fancyv2 Prince Tech → fancy v2 styled text  
- Advice → random advice  
- Pickupline → fun pickup line  
- Quote → motivational quote  
- Waifu → random waifu  

⚡ 𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗥𝗢𝗗𝗚𝗘𝗥𝗦`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Toxic Lover running on port ${PORT}`));
