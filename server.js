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
          reply = await commandMenu(); // fetch menu + quote
          callSendAPI(senderId, reply);
        }
        // ACTIVE CMDS
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
          callSendAPI(senderId, `💠 ${reply}`);
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
    return `${label}: ${data.result || data.response || data.advice || data.quote || "No data"}`;
  } catch {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// ✅ Send text (appends footer automatically)
function callSendAPI(senderPsid, response) {
  const footer = `\n\n𝑻𝒀𝑷𝑬 𝑴𝑬𝑵𝑼 𝑻𝑶 𝑺𝑬𝑬 𝑨𝑽𝑨𝑰𝑳𝑨𝑩𝑳𝑬 𝑪𝑴𝑫𝑺\n━━━━━━━━━━━━━━━\nᴘᴏᴡᴇʀᴇᴅ ʙʏ ʀᴏʏ4`;
  const body = {
    recipient: { id: senderPsid },
    message: { text: response + footer },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Unable to send:", err));
}

// ✅ Send image (also appends footer separately)
function sendImage(senderPsid, imageUrl) {
  const bodyImg = {
    recipient: { id: senderPsid },
    message: { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyImg),
  }).then(() => {
    // send footer after image
    callSendAPI(senderPsid, "");
  }).catch((err) => console.error("Unable to send image:", err));
}

// ✅ Menu with quote + powered by
async function commandMenu() {
  let quote = "";
  try {
    const res = await fetch("https://api.princetechn.com/api/fun/quotes?apikey=prince");
    const data = await res.json();
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

━━━━━━━━━━━━━━━${quote}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Toxic Lover running on port ${PORT}`));
