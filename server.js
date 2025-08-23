import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "YOUR_PAGE_ACCESS_TOKEN";

// Convert normal text → Fancy bold font
function toFancy(text) {
  const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const fancy =
    "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙" +
    "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳" +
    "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";

  return text
    .split("")
    .map((ch) => {
      const i = normal.indexOf(ch);
      return i > -1 ? fancy[i] : ch;
    })
    .join("");
}

// 🎯 Command List
const commandMenu = toFancy(`
╔═══ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 ═══╗

📚 𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍
• fruitinfo [q]
• poem
• maths [q]
• mathlist
• dict [w]
• booksearch [q]
• bookid [id]

🌍 𝐒𝐄𝐀𝐑𝐂𝐇
• yt [q]
• img [q]
• bing [q]
• bible [v]
• tiktoktrend
• lyrics [s]
• chord [s]
• ig [url]
• tiktok [url]
• spotify [s]
• apkfab [a]
• sticker [q]

🤖 𝐀𝐈 𝐇𝐔𝐁
• gpt [q]
• claude [q]
• mistral [q]
• gemini [q]
• o3 [q]
• deepseek [q]

╚═ 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 ═╝

💡 Start with command name + query
   Example: yt love songs
   Example: gpt hello world
`);

// ✅ Verify webhook
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

// ✅ Messenger webhook
app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();
        const args = userMessage.split(" ");
        const cmd = args[0].toLowerCase();
        const query = args.slice(1).join(" ");

        let reply;

        // 📜 HELP
        if (cmd === "help") {
          reply = commandMenu;

        // 📚 EDUCATION
        } else if (cmd === "poem") {
          reply = await fetchAPI("https://apis-keith.vercel.app/education/poem/random");
        } else if (cmd === "fruitinfo") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/fruit?q=${query}`);
        } else if (cmd === "dict") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/dict?q=${query}`);
        } else if (cmd === "mathlist") {
          reply = await fetchAPI("https://apis-keith.vercel.app/education/maths/list");
        } else if (cmd === "maths") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/maths?q=${query}`);
        } else if (cmd === "booksearch") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/book/search?q=${query}`);
        } else if (cmd === "bookid") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/book/id?id=${query}`);

        // 🌍 SEARCH
        } else if (cmd === "yt") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/youtube?q=${query}`);
        } else if (cmd === "img") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/img?q=${query}`);
        } else if (cmd === "bing") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/bing?q=${query}`);
        } else if (cmd === "bible") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/bible?q=${query}`);
        } else if (cmd === "tiktoktrend") {
          reply = await fetchAPI("https://apis-keith.vercel.app/search/tiktoktrend");
        } else if (cmd === "lyrics") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/lyrics?q=${query}`);
        } else if (cmd === "chord") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/chord?q=${query}`);
        } else if (cmd === "tiktok") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/tiktok?url=${query}`);
        } else if (cmd === "ig") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/ig?url=${query}`);
        } else if (cmd === "spotify") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/spotify?q=${query}`);
        } else if (cmd === "apkfab") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/apkfab?q=${query}`);
        } else if (cmd === "sticker") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/sticker?q=${query}`);

        // 🤖 AI HUB
        } else if (cmd === "gpt") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gpt?q=${query}`);
        } else if (cmd === "claude") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/claude?q=${query}`);
        } else if (cmd === "mistral") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/mistral?q=${query}`);
        } else if (cmd === "gemini") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gemini?q=${query}`);
        } else if (cmd === "o3") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/o3?q=${query}`);
        } else if (cmd === "deepseek") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/deepseek?q=${query}`);

        // 👑 PRINCE GPT (default for normal chat)
        } else {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gpt?q=${encodeURIComponent(userMessage)}`);
        }

        callSendAPI(senderId, toFancy(reply));
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Fetch wrapper (strip HTML if needed)
async function fetchAPI(url) {
  try {
    const res = await fetch(url);
    let text = await res.text();
    return text.replace(/<[^>]*>?/gm, ""); // strip HTML tags
  } catch {
    return "⚠️ API error";
  }
}

// ✅ Send to Messenger
function callSendAPI(senderId, text) {
  const body = {
    recipient: { id: senderId },
    message: { text },
  };
  fetch(`https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((e) => console.error("Send API error:", e));
}

app.listen(PORT, () => console.log(`🔥 Toxic Lover running on ${PORT}`));
