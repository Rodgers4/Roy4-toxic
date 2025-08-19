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
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.toLowerCase();

        let reply;

        // 🎨 Custom styled owner reply
        if (userMessage.includes("who is your owner")) {
          reply = "💙 𝗦𝗜𝗥 𝗥𝗢𝗗𝗚𝗘𝗥𝗦 💙";
        } else {
          // 🚀 Otherwise, send to Keith GPT4
          reply = await askKeithGPT(userMessage);
        }

        // 🔥 Always add modern footer
        const styledReply = `${reply}\n\n══════════════════\n𝗥𝗼𝘆𝗧𝗲𝗰𝗵 𝗱𝗲𝘃𝘀`;

        callSendAPI(senderId, styledReply);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function: Ask Keith GPT4 API
async function askKeithGPT(message) {
  try {
    const response = await fetch("https://apis-keith.vercel.app/gpt4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const text = await response.text();
    console.log("Keith GPT4 raw response:", text);

    try {
      const data = JSON.parse(text);
      return data.reply || "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (no reply received)";
    } catch (e) {
      return "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (invalid response)";
    }
  } catch (error) {
    console.error("Keith GPT4 API error:", error);
    return "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (can’t reach GPT4 😅)";
  }
}

// ✅ Function: Send message back to Messenger
function callSendAPI(senderPsid, response) {
  const requestBody = {
    recipient: { id: senderPsid },
    message: { text: response },
  };

  fetch(
    `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  ).catch((err) => console.error("Unable to send:", err));
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with Keith GPT4 on port ${PORT}`)
);
