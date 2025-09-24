// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Messenger tokens (INLINE)
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

// ✅ Verify Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode && token === VERIFY_TOKEN) res.status(200).send(challenge);
  else res.sendStatus(403);
});

// ✅ Handle Messages
app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();

        // Show typing indicator
        await sendTyping(senderId, true);

        let reply;
        const lower = userMessage.toLowerCase();

        // ✅ AI Commands
        if (lower.startsWith("gemini")) reply = await getPlain(`https://aryanapi.up.railway.app/api/gemini?prompt=${encodeURIComponent(lower.replace("gemini","").trim()||"Who is Rodgers Onyango")}`, "🤖 Gemini");
        else if (lower.startsWith("groq")) reply = await getPlain(`https://aryanapi.up.railway.app/api/groq?q=${encodeURIComponent(lower.replace("groq","").trim()||"Who is Rodgers Onyango")}`, "⚡ Groq");
        else if (lower.startsWith("pawan")) reply = await getPlain(`https://aryanapi.up.railway.app/api/pawan?prompt=${encodeURIComponent(lower.replace("pawan","").trim()||"Who is Rodgers Onyango")}`, "💡 Pawan");
        else if (lower.startsWith("mistral")) reply = await getPlain(`https://aryanapi.up.railway.app/api/mistral?prompt=${encodeURIComponent(lower.replace("mistral","").trim()||"Who is Rodgers Onyango")}`, "🌪 Mistral");
        else if (lower.startsWith("llama")) reply = await getPlain(`https://aryanapi.up.railway.app/api/llama?prompt=${encodeURIComponent(lower.replace("llama","").trim()||"Who is Rodgers Onyango")}`, "🦙 LLaMA");
        else if (lower.startsWith("blackbox")) reply = await getPlain(`https://aryanapi.up.railway.app/api/blackbox?prompt=${encodeURIComponent(lower.replace("blackbox","").trim()||"Who is Rodgers Onyango")}`, "🖤 Blackbox");
        else if (lower.startsWith("gauth")) reply = await getPlain(`https://aryanapi.up.railway.app/api/gauth?prompt=${encodeURIComponent(lower.replace("gauth","").trim()||"Who is Rodgers Onyango")}`, "📚 Gauth");
        else if (lower.startsWith("openai")) reply = await getPlain(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(lower.replace("openai","").trim()||"Who is Rodgers Onyango")}`, "🔷 OpenAI");
        else if (lower.startsWith("weather")) reply = await getPlain("https://api.princetechn.com/api/search/weather?apikey=prince&location=Kisumu", "🌦 Weather");
        else if (lower.startsWith("spotifysearch")) reply = await getPlain("https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=Spectre", "🎵 Spotify");
        else if (lower.startsWith("lyricsv2")) reply = await getPlain("https://aryanapi.up.railway.app/api/lyricsv2?query=Dusuma", "🎤 Lyrics");

        // ✅ Menu
        else if (lower === "menu") reply = await commandMenu();

        // ✅ Fallback GPT
        else reply = await askPrinceAI(userMessage);

        // Delay like human typing
        await delayTyping();
        await callSendAPI(senderId, `𝐋 ${reply}`);
        await sendTyping(senderId, false);
      }
    }
    res.sendStatus(200);
  } else res.sendStatus(404);
});

// ✅ AI Fallback
async function askPrinceAI(message) {
  try {
    const res = await fetch(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(message)}`);
    const data = await res.json();
    return data.result || data.response || data.answer || "𝐋 No response.";
  } catch {
    return "𝐋 AI server error.";
  }
}

// ✅ Fetch plain text response
async function getPlain(url, label) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    const text = data.result || data.response || data.answer || data.message || JSON.stringify(data);
    return `${label}: ${text}`;
  } catch {
    return `${label}: Failed to fetch data.`;
  }
}

// ✅ Menu
async function commandMenu() {
  return `𝐋 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 💻  

1️⃣ gemini → gemini who is Rodgers Onyango  
2️⃣ groq → groq who is Rodgers Onyango  
3️⃣ pawan → pawan who is Rodgers Onyango  
4️⃣ mistral → mistral who is Rodgers Onyango  
5️⃣ llama → llama who is Rodgers Onyango  
6️⃣ blackbox → blackbox who is Rodgers Onyango  
7️⃣ gauth → gauth who is Rodgers Onyango  
8️⃣ openai → openai who is Rodgers Onyango  
9️⃣ weather → weather Kisumu  
🔟 spotifysearch → spotifysearch Spectre  
1️⃣1️⃣ lyricsv2 → lyricsv2 Dusuma  

━━━━━━━━━━━━━━━━━━━  
𝐓𝐨𝐭𝐚𝐥 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: 11  
𝐀𝐥𝐥 𝐛𝐫𝐨𝐮𝐠𝐡𝐭 𝐭𝐨 𝐲𝐨𝐮 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬  
𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;
}

// ✅ Typing toggle
async function sendTyping(sender, isTyping) {
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: sender }, sender_action: isTyping ? "typing_on" : "typing_off" }),
  });
}

// ✅ Simulated delay
function delayTyping() {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000));
}

// ✅ Send message
async function callSendAPI(sender, text) {
  await fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: sender }, message: { text } }),
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Toxic Lover running on port ${PORT}`));
