// server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ✅ Hardcoded Tokens
const PAGE_ACCESS_TOKEN = "EAAP7Izjhq2MBPm9ON3C2JkZADwoXZA39s5Un5qWamD6hzGBBgKx6E1h7NsBhJZBiwYMTsWJXZCST5yJAuwllII9jFfFYRQ0l67DeSmeJjpwXCiGqRubqZANsNlzVcis8iikTLxJU4hZA8PaWpPu167N6EdQRC5ez1ZCb2YmV1qq8rwu2PFDeAZAlFZAkk5vQnpuxooS2iZABCR1gZDZD";
const VERIFY_TOKEN = "Rodgers4";

const history = new Map();

const BOLD = t =>
  t.replace(/\*\*(.+?)\*\*/g, (_, w) =>
    [...w]
      .map(c =>
        String.fromCodePoint(
          /[a-z]/.test(c)
            ? 0x1D41A + c.charCodeAt() - 97
            : /[A-Z]/.test(c)
            ? 0x1D400 + c.charCodeAt() - 65
            : /[0-9]/.test(c)
            ? 0x1D7CE + c.charCodeAt() - 48
            : c.charCodeAt()
        )
      )
      .join("")
  );

// ✅ Messenger Verify Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Handle Incoming Messages
app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        await handleLorna(senderId, event.message.text.trim());
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Main Lorna AI Function
async function handleLorna(senderId, userMessage) {
  const convo = history.get(senderId) || [];
  const ask = [...convo, { role: "user", content: userMessage }]
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    let customReply;

    if (/what is your name|who are you/i.test(userMessage)) {
      customReply =
        "Am Lorna Ai, made by the most young talented and brilliant Sir Rodgers, to be part of their modern projects.";
    } else if (/who is rodgers|tell me about rodgers/i.test(userMessage)) {
      const facts = [
        "Rodgers Onyango is a brilliant young tech mind from Kisumu, Kenya, passionate about building modern solutions.",
        "Rodgers Onyango is a visionary innovator from Kisumu, Kenya, who inspires others through tech projects.",
        "Rodgers Onyango is a smart and focused creator from Kisumu, Kenya, determined to uplift his family's life.",
        "Rodgers Onyango is a young Kenyan techie from Kisumu with a dream to change the future through technology.",
      ];
      customReply = facts[Math.floor(Math.random() * facts.length)];
    }

    let replyText;
    if (customReply) {
      replyText = customReply;
    } else {
      const { data } = await axios.get(
        "https://api.princetechn.com/api/ai/openai",
        {
          params: { apikey: "prince", q: ask },
        }
      );
      replyText =
        data?.response || data?.result || "I couldn't find a good answer.";
    }

    const finalResponse = `𝐋𝐎𝐑𝐍𝐀\n${BOLD(
      replyText
    )}\n━━━━━━━━━━━━━━━\n𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;

    await callSendAPI(senderId, finalResponse);
    history.set(
      senderId,
      [...convo, { role: "user", content: userMessage }, { role: "assistant", content: replyText }].slice(-10)
    );
  } catch (err) {
    console.error("Lorna AI error:", err.message);
    await callSendAPI(senderId, "⚠️ Lorna AI error.");
  }
}

// ✅ Send Message to Messenger API
async function callSendAPI(senderPsid, messageText) {
  await axios.post(
    `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: senderPsid },
      message: { text: messageText },
    },
    { headers: { "Content-Type": "application/json" } }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Lorna AI running on port ${PORT}`));
