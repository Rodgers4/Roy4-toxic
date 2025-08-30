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
        // ⚽ Matches
        else if (/^matches/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/football/today-matches?apikey=prince", "⚽ Matches");
        }
        // 👧 Waifu
        else if (/^waifu/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/anime/waifu?apikey=prince", "👧 Waifu");
        }
        // 📚 Define
        else if (/^define/i.test(userMessage)) {
          const term = userMessage.split(" ")[1] || "Dog";
          reply = await getPlain(`https://api.princetechn.com/api/tools/define?apikey=prince&term=${encodeURIComponent(term)}`, "📚 Define");
        }
        // ✨ Fancy
        else if (/^fancy /i.test(userMessage)) {
          const text = userMessage.replace(/^fancy /i, "");
          reply = await getPlain(`https://api.princetechn.com/api/tools/fancy?apikey=prince&text=${encodeURIComponent(text)}`, "✨ Fancy");
        }
        // ✨ Fancyv2
        else if (/^fancyv2 /i.test(userMessage)) {
          const text = userMessage.replace(/^fancyv2 /i, "");
          reply = await getPlain(`https://api.princetechn.com/api/tools/fancyv2?apikey=prince&text=${encodeURIComponent(text)}`, "✨ Fancyv2");
        }
        // 🧠 GPT fallback
        else {
          reply = await askPrinceAI(userMessage);
        }

        // 🎨 Styled replies
        const styledReply = reply.includes("💭") || reply.includes("💌") || reply.includes("💡") || reply.includes("⚽") || reply.includes("👧") || reply.includes("📚") || reply.includes("✨")
          ? reply
          : `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;

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
    return `${label}: ${data.result || data.response || data.advice || data.quote || data.definition || "No data"}`;
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

// ✅ Grouped Command Menu
function commandMenu() {
  return `➤ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒  

━━━━━━━━━━━━━━━━━━━
👑  𝐑𝐎𝐘𝐒 𝐂𝐌𝐃𝐒  
⚽ Matches  
📚 Define <word>  
✨ Fancy <text>  
✨ Fancyv2 <text>  

💖  𝐁𝐄𝐋𝐋𝐀 𝐂𝐌𝐃𝐒  
💭 Advice  
💌 Pickupline  
💡 Quote  
👧 Waifu  
━━━━━━━━━━━━━━━━━━━

📝 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞  
- Matches → today’s football games  
- Define Dog → definition of Dog  
- Fancy Prince Tech → fancy styled text  
- Fancyv2 Prince Tech → fancy v2 styled text  
- Advice → random advice  
- Pickupline → fun pickup line  
- Quote → motivational quote  
- Waifu → random waifu  

━━━━━━━━━━━━━━━━━━━
⚡ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐃𝐆𝐄𝐑𝐒`;
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with Prince GPT + Commands on port ${PORT}`)
);
