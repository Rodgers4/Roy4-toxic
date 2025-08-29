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

        let reply = "";

        // 🏷 Identity replies
        if (/what is your name/i.test(userMessage)) {
          reply = "🤍 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 created by 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 🤍";
        } else if (/who is your owner/i.test(userMessage)) {
          reply = "💙 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙";
        }
        // 📝 Menu command
        else if (/menu/i.test(userMessage)) {
          reply = commandMenu();
        }
        // 🎭 Advice
        else if (/^advice$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
        }
        // 🎭 Pickupline
        else if (/^pickupline$/i.test(userMessage) || /^pickup$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickupline");
        }
        // 🎭 Quote
        else if (/^quote$/i.test(userMessage)) {
          reply = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
        }
        // ⚽ Football
        else if (/^football$/i.test(userMessage)) {
          await getFootballMatches(senderId);
          reply = "";
        }
        // 👘 Waifu
        else if (/^waifu$/i.test(userMessage)) {
          await getWaifu(senderId);
          reply = "";
        }
        // 🧠 GPT fallback
        else {
          reply = await askPrinceAI(userMessage);
        }

        if (reply) {
          const styledReply = `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;
          console.log(`🤖 Toxic Lover reply: ${styledReply}`);
          callSendAPI(senderId, styledReply);
        }
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
      return data.response || data.result || data.answer || JSON.stringify(data) || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (empty reply)";
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

// ✅ Football Today - Send as Cards
async function getFootballMatches(senderId) {
  try {
    const res = await fetch("https://api.princetechn.com/api/football/today-matches?apikey=prince");
    const data = await res.json();

    if (!data.result || data.result.length === 0) {
      await callSendAPI(senderId, "⚽ No football matches found for today.");
      return;
    }

    const elements = data.result.slice(0, 5).map((match) => ({
      title: `${match.homeTeam} 🆚 ${match.awayTeam}`,
      subtitle: `🏟 ${match.competition}\n📅 ${match.date}`,
      buttons: [
        {
          type: "web_url",
          url: match.url || "https://www.google.com/search?q=" + encodeURIComponent(`${match.homeTeam} vs ${match.awayTeam}`),
          title: "View Details",
        },
      ],
    }));

    await callSendTemplate(senderId, elements);
  } catch (err) {
    console.error("⚽ Football API error:", err);
    await callSendAPI(senderId, "⚠️ Couldn’t fetch football matches.");
  }
}

// ✅ Waifu Image
async function getWaifu(senderId) {
  try {
    const res = await fetch("https://api.princetechn.com/api/anime/waifu?apikey=prince");
    const data = await res.json();

    const imageUrl = data.url || data.result || null;

    if (imageUrl) {
      const requestBody = {
        recipient: { id: senderId },
        message: {
          attachment: {
            type: "image",
            payload: { url: imageUrl, is_reusable: true },
          },
        },
      };

      await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
    } else {
      await callSendAPI(senderId, "⚠️ Couldn’t fetch Waifu image.");
    }
  } catch (err) {
    console.error("👘 Waifu API error:", err);
    await callSendAPI(senderId, "⚠️ Waifu fetch failed.");
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

// ✅ Send template (cards) to Messenger
function callSendTemplate(senderPsid, elements) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements,
        },
      },
    },
  };

  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  }).catch((err) => console.error("Unable to send template:", err));
}

// ✅ Command Menu
function commandMenu() {
  return `🔻𝗖𝗼𝗺𝗺𝗮𝗻𝗱🔻

💭 Advice  
💌 Pickupline  
💡 Quote  
⚽ Football  
👘 Waifu  

══════════════════  
📝 𝐇𝐨𝐰 𝐓𝐨 𝐔𝐬𝐞:  
- "Advice" → random advice  
- "Pickupline" → fun pickup line  
- "Quote" → motivational quote  
- "Football" → today’s matches  
- "Waifu" → random anime waifu image  

══════════════════  
⚡ 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐑𝐨𝐝𝐠𝐞𝐫𝐬`;
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with Prince GPT on port ${PORT}`)
);
