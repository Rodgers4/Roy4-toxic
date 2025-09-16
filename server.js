import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "EAAT0TVvmUIYBPFRyZAYWtZCppUrjygNmuBwglLZBhgNTtVtdkeAh0hmc0bqiQbv2kGyhSJvfpGXeWpZArydfcFy3lDOBId7VZCWkwSIMOPhilSWaJJ8JjJbETKZBjX1tVUoope98ZAhZBCSHsxsZC638DTgi2uAt6ImPS40g1Henc9jwVyvMTzPIkBK1SwgX9ljl2ChU95EZAtUAZDZD";
const VERIFY_TOKEN = "rodgers4";

// ✅ Messenger Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Main Webhook Listener
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.message.text) {
          const senderId = event.sender.id;
          const userMessage = event.message.text;

          if (userMessage.toLowerCase() === ".menu") {
            await sendMessage(senderId, "🔥 TOXIC LOVER MENU 🔥\n\n1. .menu\n2. .owner\n3. .about\n\nPOWERED BY RODGERS\nType anything to chat with AI 👇");
          } else if (userMessage.toLowerCase() === ".owner") {
            await sendMessage(senderId, "Name: RODGERS ONYANGO\nHome: KISUMU KENYA\nStatus: SINGLE\nCONT: 0755660053\nAGE: 17 YEARS\nEDU..: BACHELOR DEGREE\nINST: EGERTON.");
          } else {
            // ✅ NEW: Use PrinceTech GPT API
            const aiResponse = await fetch(`https://api.princetechn.com/api/ai/gpt4?apikey=prince&q=${encodeURIComponent(userMessage)}`)
              .then(res => res.json())
              .catch(err => ({ message: "⚠️ AI API Error, please try again later." }));

            await sendMessage(senderId, aiResponse.response || aiResponse.message || "❌ No response from AI.");
          }
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function to send message back to user
async function sendMessage(senderId, text) {
  await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: { text },
    }),
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Toxic Lover running on port ${PORT}`));
