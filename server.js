import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Messenger tokens
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN =
  "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

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

        // 🏷 Identity replies
        if (userMessage.toLowerCase().includes("what is your name")) {
          reply = "🤍 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 created by 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 🤍";
        } else if (userMessage.toLowerCase().includes("who is your owner")) {
          reply = "💙 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙";
        } 
        // 📝 Menu command
        else if (userMessage.toLowerCase().includes("menu")) {
          reply = commandMenu();
        }
        // 🎭 Advice
        else if (/^advice/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
        }
        // 🎭 Pickupline
        else if (/^pickupline/i.test(userMessage) || /^pickup/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickupline");
        }
        // 🎭 Quote
        else if (/^quote/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
        }
        // 🧠 GPT fallback
        else {
          reply = await askPrinceAI(userMessage);
        }

        // 🎨 Styled GPT replies always end with Powered by Rodgers
        const styledReply = reply.includes("💌") || reply.includes("💡") || reply.includes("💭")
          ? reply
          : `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 Roy4`;

        console.log(`🤖 Toxic Lover reply: ${styledReply}`);

        callSendAPI(senderId, styledReply);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ GPT via Prince API
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log("🌐 PrinceTech raw response:", text);

    try {
      const data = JSON.parse(text);
      return (
        data.response ||
        data.result ||
        data.answer ||
        JSON.stringify(data) ||
        "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (empty reply)"
      );
    } catch {
      return text || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (invalid response)";
    }
  } catch (error) {
    console.error("❌ PrinceTech API error:", error);
    return "⚠️ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (can’t reach AI)";
  }
}

// ✅ Get plain API text
async function getPlain(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return `${label}: ${data.result || data.response || data.advice || data.quote || "No data"}`;
  } catch {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// ✅ Send text to Messenger
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

// ✅ Small command menu
function commandMenu() {
  return `📌 𝐒𝐦𝐚𝐥𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐋𝐢𝐬𝐭 📌

💭 Advice  
💌 Pickupline  
💡 Quote  

══════════════════  
📝 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞:  
- "Advice" → random advice  
- "Pickupline" → fun pickup line  
- "Quote" → motivational quote  

══════════════════  
⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐑𝐨𝐝𝐠𝐞𝐫𝐬`;
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with Prince GPT on port ${PORT}`)
);
