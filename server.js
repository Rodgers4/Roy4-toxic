import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// ✅ Messenger Tokens (INLINE)
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";
const VERIFY_TOKEN = "rodgers4"; // Webhook verification token

// ✅ Typing indicator (random delay)
async function sendTypingIndicator(sender_psid) {
  await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: sender_psid }, sender_action: "typing_on" }),
  });

  const delay = Math.floor(Math.random() * 2000) + 1000; // 1-3 sec delay
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ✅ Send message with footer
async function sendMessage(sender_psid, text, buttons = null) {
  let messagePayload = {
    recipient: { id: sender_psid },
    message: buttons
      ? {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: `${text}\n\n━━━━━━━━━━━━━━━━━━━\nType "menu" to see my commands`,
              buttons
            }
          }
        }
      : {
          text: `${text}\n\n━━━━━━━━━━━━━━━━━━━\nType "menu" to see my commands`
        }
  };

  await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messagePayload)
  });
}

// ✅ MENU command with dynamic quote
async function sendMenu(sender_psid) {
  let quote = "";
  try {
    const response = await fetch("https://api.princetechn.com/api/fun/quotes?apikey=prince");
    const data = await response.json();
    quote = `💡 Quote: ${data.quote || data.result || "Stay motivated!"}`;
  } catch {
    quote = "💡 Quote: Stay motivated!";
  }

  const menuText = `✨ TOXIC LOVER COMMAND LIST ✨

gemini <your prompt> - Chat with AI  
lyricsv2 <song> - Get song lyrics  
weather <location> - Get weather info  
spotifysearch <song/artist> - Search on Spotify  
wikimedia <topic> - Get wiki info  

${quote}

"Total no of commands 5"
━━━━━━━━━━━━━━━━━━━
𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;

  await sendMessage(sender_psid, menuText, [
    {
      type: "web_url",
      url: "https://whatsapp.com/channel/0029VbBH9IGCnA7l7rdZlB0e",
      title: "📢 View Channel"
    }
  ]);
}

// ✅ Process user message
async function handleMessage(sender_psid, received_message) {
  const text = received_message.text?.toLowerCase() || "";

  await sendTypingIndicator(sender_psid);

  if (text === "menu") return sendMenu(sender_psid);

  if (text.startsWith("gemini")) {
    const query = encodeURIComponent(text.replace("gemini", "").trim() || "Hello");
    const response = await fetch(`https://aryanapi.up.railway.app/api/gemini?prompt=${query}`);
    const data = await response.json();
    return sendMessage(sender_psid, data.response || "No response from Gemini.");
  }

  if (text.startsWith("lyricsv2")) {
    const query = encodeURIComponent(text.replace("lyricsv2", "").trim());
    const response = await fetch(`https://aryanapi.up.railway.app/api/lyricsv2?query=${query}`);
    const data = await response.json();
    return sendMessage(sender_psid, data.lyrics || "No lyrics found.");
  }

  if (text.startsWith("weather")) {
    const location = encodeURIComponent(text.replace("weather", "").trim() || "Kisumu");
    const response = await fetch(`https://api.princetechn.com/api/search/weather?apikey=prince&location=${location}`);
    const data = await response.json();
    return sendMessage(sender_psid, `Weather in ${location}: ${data.result || "Unavailable"}`);
  }

  if (text.startsWith("spotifysearch")) {
    const query = encodeURIComponent(text.replace("spotifysearch", "").trim());
    const response = await fetch(`https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${query}`);
    const data = await response.json();
    return sendMessage(sender_psid, `Spotify Search: ${data.result || "No results"}`);
  }

  if (text.startsWith("wikimedia")) {
    const query = encodeURIComponent(text.replace("wikimedia", "").trim());
    const response = await fetch(`https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${query}`);
    const data = await response.json();
    return sendMessage(sender_psid, data.result || "No wiki info found.");
  }

  // ✅ GPT fallback
  const gptResponse = await fetch(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(text)}`);
  const gptData = await gptResponse.json();
  return sendMessage(sender_psid, gptData.response || "I couldn't find an answer.");
}

// ✅ Webhook Verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  res.sendStatus(403);
});

// ✅ Handle Webhook Events
app.post("/webhook", (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];
      const sender_psid = webhook_event.sender.id;
      if (webhook_event.message) handleMessage(sender_psid, webhook_event.message);
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

app.listen(3000, () => console.log("🚀 Toxic Lover bot running on port 3000"));
