// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Messenger tokens (INLINE, no .env)
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

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

        // Start typing
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
        else reply = await askPrinceAI(userMessage);

        // Random human-like delay (1–3 seconds)
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

// ✅ GPT AI Fallback
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(message)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.response || data.result || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑";
  } catch {
    return "⚠️ Error reaching AI server";
  }
}

// ✅ Fetch plain text
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

// ✅ Delay to simulate typing
function delayTyping() {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * 2000) + 1000; // 1–3 seconds
    setTimeout(resolve, delay);
  });
}

// ✅ Send text message (with footer + real time/date)
async function callSendAPI(senderPsid, response) {
  // Generate real time & date
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const dateString = now.toLocaleDateString("en-KE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  const footer = response
    ? `\n\n🕒 Time: ${timeString} | 📅 Date: ${dateString}\n━━━━━━━━━━━━━━━\nType "menu" to see my commands\n𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`
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

// ✅ Send image
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

  return `➤ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐌𝐃𝐒

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
app.listen(PORT, () => console.log(`🔥 Toxic Lover running on port ${PORT}`));
