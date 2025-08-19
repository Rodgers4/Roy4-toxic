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
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(async entry => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text;

        // Custom owner reply
        if (userMessage.toLowerCase().includes("who is your owner")) {
          return callSendAPI(senderId, "𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💖 my one and only!");
        }

        // 🚀 Immediately forward to Keith GPT
        const gptReply = await askKeithGPT(userMessage);
        callSendAPI(senderId, gptReply);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function: Ask Keith GPT API immediately
async function askKeithGPT(message) {
  try {
    const response = await fetch("https://apis-keith.vercel.app/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    return data.reply || "Am Toxic Lover 💕 (Keith GPT is quiet 🤖)";
  } catch (error) {
    console.error("Keith API error:", error);
    return "Oops! I can’t reach Keith GPT 😅";
  }
}

// ✅ Function: Send message back to Messenger
function callSendAPI(senderPsid, response) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: { text: response }
  };

  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  }).catch(err => console.error("Unable to send:", err));
}

app.listen(PORT, () => console.log(`🔥 Toxic Lover running with Keith GPT on port ${PORT}`));
