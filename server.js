import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// ✅ Your Tokens (Directly Set)
const PAGE_ACCESS_TOKEN = "EAAT0TVvmUIYBPFRyZAYWtZCppUrjygNmuBwglLZBhgNTtVtdkeAh0hmc0bqiQbv2kGyhSJvfpGXeWpZArydfcFy3lDOBId7VZCWkwSIMOPhilSWaJJ8JjJbETKZBjX1tVUoope98ZAhZBCSHsxsZC638DTgi2uAt6ImPS40g1Henc9jwVyvMTzPIkBK1SwgX9ljl2ChU95EZAtUAZDZD";
const VERIFY_TOKEN = "rodgers4";

// =============== HELPERS ===============
async function callGemini(message) {
  try {
    const res = await fetch("https://freepass.ai/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    if (data && data.output) {
      return data.output.trim();
    } else {
      return "⚠️ Sorry, I couldn't get a response right now.";
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    return "⚠️ Error connecting to AI service.";
  }
}

async function callAPI(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("API Error:", err);
    return null;
  }
}

// =============== MESSENGER FUNCTIONS ===============
async function sendMessage(senderId, message) {
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: {
        text: `${message}\n\nType Menu to see cmds\n──────────────\n𝗣𝗢𝗪𝗘𝗥𝗘𝗗 𝗕𝗬 𝗥𝗢𝗬𝟰`,
      },
    }),
  });
}

// =============== COMMAND HANDLER ===============
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
      const webhookEvent = entry.messaging[0];
      const senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        const text = webhookEvent.message.text.trim().toLowerCase();

        if (text === "menu") {
          await sendMessage(
            senderId,
            `➤ 𝐀𝐂𝐓𝐈𝐕𝐄 𝐂𝐌𝐃𝐒\n\n💖 Advice\n💌 Pickupline\n📖 Quote\n👸 Waifu\n\n📖 Quote of the Day:\n✨ "Success is not final, failure is not fatal: It is the courage to continue that counts."`
          );
        }

        else if (text === "advice") {
          const data = await callAPI("https://api.adviceslip.com/advice");
          await sendMessage(senderId, `💖 Advice: ${data?.slip?.advice || "No advice available."}`);
        }

        else if (text === "pickupline") {
          const data = await callAPI("https://api.princetechn.com/api/tools/pickupline?apikey=prince");
          await sendMessage(senderId, `💌 Pickup: ${data?.result || "No pickup line found."}`);
        }

        else if (text === "quote") {
          const data = await callAPI("https://api.quotable.io/random");
          await sendMessage(senderId, `📖 Quote: "${data?.content}" — ${data?.author}`);
        }

        else if (text === "waifu") {
          const data = await callAPI("https://api.princetechn.com/api/anime/waifu?apikey=prince");
          await sendMessage(senderId, `👸 Waifu: ${data?.url || "No waifu available."}`);
        }

        // 👇 DEFAULT → AI CHAT
        else {
          const reply = await callGemini(text);
          await sendMessage(senderId, reply);
        }
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// =============== VERIFY WEBHOOK ===============
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.listen(3000, () => console.log("🚀 Toxic Lover Bot is live!"));
