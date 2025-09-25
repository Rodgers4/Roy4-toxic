// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ✅ Hardcoded Tokens
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAP7Izjhq2MBPm9ON3C2JkZADwoXZA39s5Un5qWamD6hzGBBgKx6E1h7NsBhJZBiwYMTsWJXZCST5yJAuwllII9jFfFYRQ0l67DeSmeJjpwXCiGqRubqZANsNlzVcis8iikTLxJU4hZA8PaWpPu167N6EdQRC5ez1ZCb2YmV1qq8rwu2PFDeAZAlFZAkk5vQnpuxooS2iZABCR1gZDZD";

const history = new Map();

// ✅ Verify Webhook
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

// ✅ Handle Messages
app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();

        // Start typing indicator
        await sendTyping(senderId, true);

        let reply;
        if (/^menu$/i.test(userMessage)) reply = await commandMenu();
        else if (/^advice$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/fun/advice?apikey=prince", "💭 Advice");
        else if (/^pickupline$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/fun/pickupline?apikey=prince", "💌 Pickupline");
        else if (/^quote$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/fun/quotes?apikey=prince", "💡 Quote");
        else if (/^waifu$/i.test(userMessage)) {
          const resImg = await fetch("https://api.princetechn.com/api/anime/waifu?apikey=prince");
          const data = await resImg.json();
          await sendImage(senderId, data.url || "https://i.waifu.pics/qkCL5Z5.jpg");
          reply = "";
        }
        else if (/^weather$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/search/weather?apikey=prince&location=Kisumu", "🌦 Weather");
        else if (/^spotify$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=Spectre", "🎵 Spotify");
        else if (/^lyrics$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/search/lyrics?apikey=prince&query=Dynasty+Miaa", "🎤 Lyrics");
        else if (/^wikimedia$/i.test(userMessage)) reply = await getPlain("https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=Elon+Musk", "📚 Wikimedia");
        else reply = await handleLorna(senderId, userMessage);

        await delayTyping();
        await callSendAPI(senderId, reply);
        await sendTyping(senderId, false);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ Main AI Handler (Lorna)
async function handleLorna(senderId, userMessage) {
  const convo = history.get(senderId) || [];
  const ask = [...convo, { role: "user", content: userMessage }]
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  // Hardcoded replies first
  if (/what is your name|who are you/i.test(userMessage))
    return "Am Lorna Ai, made by the most young talented and brilliant Sir Rodgers, to be part of their modern projects.";

  if (/who is rodgers|tell me about rodgers/i.test(userMessage)) {
    const facts = [
      "Rodgers Onyango is a brilliant young tech mind from Kisumu, Kenya, passionate about building modern solutions.",
      "Rodgers Onyango is a visionary innovator from Kisumu, Kenya, who inspires others through tech projects.",
      "Rodgers Onyango is a smart and focused creator from Kisumu, Kenya, determined to uplift his family's life.",
      "Rodgers Onyango is a young Kenyan techie from Kisumu with a dream to change the future through technology."
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  // Prince GPT Fallback
  try {
    const res = await fetch(`https://api.princetechn.com/api/princegpt?apikey=prince&query=${encodeURIComponent(ask)}`);
    const data = await res.json();
    const replyText = data.response || "I couldn't get a reply right now.";

    history.set(senderId, [...convo, { role: "user", content: userMessage }, { role: "assistant", content: replyText }].slice(-10));
    return replyText;
  } catch {
    return "⚠️ Lorna AI error.";
  }
}

// ✅ Fetch plain text helpers
async function getPlain(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    const text =
      data.result || data.response || data.advice || data.quote || data.lyrics || data.message || JSON.stringify(data);
    return `${label}: ${text}`;
  } catch {
    return `⚠️ Failed to fetch ${label}`;
  }
}

// ✅ Typing delay for realism
function delayTyping() {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000));
}

// ✅ Send text + real date/time footer
async function callSendAPI(senderPsid, response) {
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const footer = response
    ? `\n\n🕒 Time: ${timeString} | 📅 Date: ${dateString}\n━━━━━━━━━━━━━━━\nType "menu" to see my commands\nPOWERED BY ROYTECH`
    : "";
  const body = {
    recipient: { id: senderPsid },
    message: { text: (response || "") + footer },
  };
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ✅ Send image message
async function sendImage(senderPsid, imageUrl) {
  const bodyImg = {
    recipient: { id: senderPsid },
    message: { attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } },
  };
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyImg),
  });
  await callSendAPI(senderPsid, "");
}

// ✅ Typing indicator toggle
async function sendTyping(senderPsid, isTyping) {
  const body = {
    recipient: { id: senderPsid },
    sender_action: isTyping ? "typing_on" : "typing_off",
  };
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ✅ Menu with motivational quote
async function commandMenu() {
  let quote = "";
  try {
    const res = await fetch("https://api.princetechn.com/api/fun/quotes?apikey=prince");
    const data = await res.json();
    quote = `\n💡 Quote: ${data.quote || data.result || "Stay motivated!"}`;
  } catch {
    quote = "\n💡 Quote: Stay motivated!";
  }

  return `➤ 𝐋𝐎𝐑𝐍𝐀 𝐂𝐌𝐃𝐒

💝 𝗔𝗖𝗧𝗜𝗩𝗘 𝗖𝗠𝗗𝗦
💭 Advice
💌 Pickupline
💡 Quote
🐾 Waifu
🌦 Weather
🎵 Spotify
🎤 Lyrics
📚 Wikimedia

━━━━━━━━━━━━━━━${quote}`;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Lorna AI running on port ${PORT}`));
