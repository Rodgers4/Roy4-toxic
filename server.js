import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// ✅ Facebook Tokens
const PAGE_ACCESS_TOKEN = "EAAT0TVvmUIYBPFRyZAYWtZCppUrjygNmuBwglLZBhgNTtVtdkeAh0hmc0bqiQbv2kGyhSJvfpGXeWpZArydfcFy3lDOBId7VZCWkwSIMOPhilSWaJJ8JjJbETKZBjX1tVUoope98ZAhZBCSHsxsZC638DTgi2uAt6ImPS40g1Henc9jwVyvMTzPIkBK1SwgX9ljl2ChU95EZAtUAZDZD";
const VERIFY_TOKEN = "rodgers4";

// ✅ Verify Webhook
app.get("/webhook", (req, res) => {
  if (req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ✅ Webhook POST
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    for (const entry of body.entry) {
      const event = entry.messaging[0];
      const sender = event.sender.id;

      if (event.message) {
        await sendTyping(sender);

        if (event.message.text) {
          const userMessage = event.message.text.trim().toLowerCase();

          // ✅ Bot Intro
          if (userMessage.includes("what is your name") || userMessage.includes("who are you")) {
            return sendMessage(sender, "𝐋 𝐀𝐦 𝐓𝐨𝐱𝐢𝐜 𝐋𝐨𝐯𝐞𝐫, 𝐌𝐚𝐝𝐞 𝐁𝐲 𝐑𝐨𝐝𝐠𝐞𝐫𝐬");
          }

          // ✅ AI CMDs
          if (userMessage.startsWith("gemini")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/gemini?prompt=${encodeURIComponent(userMessage.replace("gemini", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("groq")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/groq?q=${encodeURIComponent(userMessage.replace("groq", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("pawan")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/pawan?prompt=${encodeURIComponent(userMessage.replace("pawan", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("openai")) return sendMessage(sender, await fetchClean(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(userMessage.replace("openai", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("mistral")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/mistral?prompt=${encodeURIComponent(userMessage.replace("mistral", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("llama")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/llama?prompt=${encodeURIComponent(userMessage.replace("llama", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("blackbox")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/blackbox?prompt=${encodeURIComponent(userMessage.replace("blackbox", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("gauth")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/gauth?prompt=${encodeURIComponent(userMessage.replace("gauth", "").trim() || "Who is Rodgers Onyango")}`));
          if (userMessage.startsWith("weather")) return sendMessage(sender, await fetchClean(`https://api.princetechn.com/api/search/weather?apikey=prince&location=${encodeURIComponent(userMessage.replace("weather", "").trim() || "Kisumu")}`));
          if (userMessage.startsWith("spotifysearch")) return sendMessage(sender, await fetchClean(`https://api.princetechn.com/api/search/spotifysearch?apikey=prince&query=${encodeURIComponent(userMessage.replace("spotifysearch", "").trim() || "Spectre")}`));
          if (userMessage.startsWith("lyricsv2")) return sendMessage(sender, await fetchClean(`https://aryanapi.up.railway.app/api/lyricsv2?query=${encodeURIComponent(userMessage.replace("lyricsv2", "").trim() || "Dusuma")}`));

          // ✅ Menu
          if (userMessage === "menu") {
            return sendMessage(sender, `
╭━━━⌬ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 ⌬━━━╮

🧠 𝐀𝐈 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬  
gemini who is Rodgers Onyango  
groq who is Rodgers Onyango  
pawan who is Rodgers Onyango  
openai who is Rodgers Onyango  
mistral who is Rodgers Onyango  
llama who is Rodgers Onyango  
blackbox who is Rodgers Onyango  
gauth who is Rodgers Onyango  

🎶 𝐄𝐧𝐭𝐞𝐫𝐭𝐚𝐢𝐧𝐦𝐞𝐧𝐭  
lyricsv2 Dusuma  
spotifysearch Spectre  

🌦 𝐔𝐭𝐢𝐥𝐬  
weather Kisumu  

━━━━━━━━━━━━━━━━━━━
𝐓𝐨𝐭𝐚𝐥 𝐧𝐨 𝐨𝐟 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬: 11  
𝐀𝐥𝐥 𝐭𝐡𝐞𝐬𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬 𝐚𝐫𝐞 𝐛𝐫𝐨𝐮𝐠𝐡𝐭 𝐭𝐨 𝐲𝐨𝐮 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬  
𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`);
          }

          // ✅ Fallback GPT
          return sendMessage(sender, await fetchClean(`https://api.princetechn.com/api/ai/openai?apikey=prince&q=${encodeURIComponent(userMessage)}`));
        }

        // ✅ Handle Attachments
        if (event.message.attachments) {
          const type = event.message.attachments[0].type;
          if (type === "image") return sendMessage(sender, "𝐋 𝐍𝐢𝐜𝐞 𝐏𝐢𝐜𝐭𝐮𝐫𝐞! 😍");
          if (type === "audio") return sendMessage(sender, "𝐋 𝐋𝐨𝐯𝐞𝐥𝐲 𝐕𝐨𝐢𝐜𝐞! 🎶");
          if (type === "file") return sendMessage(sender, "𝐋 𝐅𝐢𝐥𝐞 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝! 📁");
          if (type === "video") return sendMessage(sender, "𝐋 𝐂𝐨𝐨𝐥 𝐕𝐢𝐝𝐞𝐨! 🎥");
          return sendMessage(sender, "𝐋 𝐍𝐢𝐜𝐞 𝐒𝐭𝐢𝐜𝐤𝐞𝐫! 😅");
        }
      }
    }
    res.sendStatus(200);
  } else res.sendStatus(404);
});

// ✅ Helper Functions
async function fetchClean(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    // ✅ Return first text-like value
    return `𝐋 ${data.result || data.answer || data.response || data.message || JSON.stringify(data)}`;
  } catch {
    return "𝐋 Error fetching data.";
  }
}

async function sendMessage(sender, text) {
  await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: sender }, message: { text } }),
  });
}

async function sendTyping(sender) {
  await fetch(`https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: sender }, sender_action: "typing_on" }),
  });
}

app.listen(process.env.PORT || 3000, () => console.log("✅ Toxic Lover Bot Running with AI + Attachments"));
