import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // From Meta
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "rodgers4"; // Your verify token

// Webhook verification
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

// Handle messages
app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;

      if (webhook_event.message && webhook_event.message.text) {
        const userMessage = webhook_event.message.text.toLowerCase();
        let reply;

        // 🔹 Custom response
        if (userMessage.includes("who is your owner")) {
          reply = "My owner is 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 ❤️, the one I love so much.";
        } else if (userMessage.includes("what is your name")) {
          reply = "I’m Toxic Lover 💕 made by Rodgers.";
        } else {
          // 🔥 GPT via Keith API
          const gptResponse = await fetch("https://apis-keith.vercel.app/ai/gpt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: webhook_event.message.text, max_tokens: 200 })
          });
          const data = await gptResponse.json();
          reply = data.response || "Sorry, I couldn’t process that.";
        }

        await callSendAPI(sender_psid, reply);
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// Send message back to Messenger
async function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: { id: sender_psid },
    message: { text: response }
  };

  await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request_body)
  });
}

app.listen(3000, () => console.log("🚀 Toxic Lover Messenger bot running"));
