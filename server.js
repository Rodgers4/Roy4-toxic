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

// ✅ Command list (help menu)
const commandMenu = `
╔══════ TOXIC LOVER ══════╗
║
📚 EDUCATION
║ ➤ fruitinfo [q]
║ ➤ poem
║ ➤ mathlist
║ ➤ maths [q]
║ ➤ dict [w]
║ ➤ booksearch [q]
║ ➤ bookid [id]
║
🌍 SEARCH
║ ➤ yt [q]
║ ➤ img [q]
║ ➤ bing [q]
║ ➤ bible [q]
║ ➤ tiktoktrend
║ ➤ lyrics [s]
║ ➤ lyrics2 [s]
║ ➤ chord [s]
║ ➤ tiktok [u]
║ ➤ ig [u]
║ ➤ sound [s]
║ ➤ tweets [q]
║ ➤ tweetspost [q]
║ ➤ tiktokpost [u]
║ ➤ spotify [s]
║ ➤ apkfab [a]
║ ➤ sticker [q]
║ ➤ modwa [a]
║
🤖 AI HUB
║ ➤ gpt [q]
║ ➤ claude [q]
║ ➤ mistral [q]
║ ➤ gpt4nano [q]
║ ➤ o3 [q]
║ ➤ chatgpt4 [q]
║ ➤ venice [q]
║ ➤ code [lang]
║ ➤ deepseek [q]
║ ➤ lyricsgen [q]
║ ➤ gpt4 [q]
║ ➤ qwena [q]
║ ➤ gemini [q]
║ ➤ metaa [q]
║ ➤ deepseekr1 [q]
║
╔══ POWERED BY RODGERS ══╗
`;

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
        const userMessage = event.message.text.trim().toLowerCase();
        const args = userMessage.split(" ");
        const cmd = args[0];
        const query = args.slice(1).join(" ");
        console.log(`📩 User: ${userMessage}`);

        let reply;

        // 🎨 OWNER
        if (userMessage.includes("who is your owner")) {
          reply = "💙 𝗦𝗜𝗥 𝗥𝗢𝗗𝗚𝗘𝗥𝗦 💙";

        // 📜 HELP MENU
        } else if (cmd === "help") {
          reply = commandMenu;

        // 📚 EDUCATION
        } else if (cmd === "poem") {
          reply = await fetchAPI("https://apis-keith.vercel.app/education/poem/random");
        } else if (cmd === "fruitinfo") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/fruit?q=${query || "apple"}`);
        } else if (cmd === "dict") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/dict?q=${query || "love"}`);
        } else if (cmd === "mathlist") {
          reply = await fetchAPI("https://apis-keith.vercel.app/education/maths/list");
        } else if (cmd === "maths") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/maths?q=${query || "2+2"}`);
        } else if (cmd === "booksearch") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/book/search?q=${query || "love"}`);
        } else if (cmd === "bookid") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/education/book/id?id=${query || "1"}`);

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
        } else if (cmd === "lyrics2") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/lyrics2?q=${query}`);
        } else if (cmd === "chord") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/chord?q=${query}`);
        } else if (cmd === "tiktok") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/tiktok?url=${query}`);
        } else if (cmd === "ig") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/ig?url=${query}`);
        } else if (cmd === "sound") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/sound?q=${query}`);
        } else if (cmd === "tweets") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/tweets?q=${query}`);
        } else if (cmd === "tweetspost") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/tweets/post?q=${query}`);
        } else if (cmd === "tiktokpost") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/tiktok/post?url=${query}`);
        } else if (cmd === "spotify") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/spotify?q=${query}`);
        } else if (cmd === "apkfab") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/apkfab?q=${query}`);
        } else if (cmd === "sticker") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/sticker?q=${query}`);
        } else if (cmd === "modwa") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/search/modwa?q=${query}`);

        // 🤖 AI HUB
        } else if (cmd === "gpt") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gpt?q=${query}`);
        } else if (cmd === "claude") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/claude?q=${query}`);
        } else if (cmd === "mistral") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/mistral?q=${query}`);
        } else if (cmd === "gpt4nano") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gpt4nano?q=${query}`);
        } else if (cmd === "o3") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/o3?q=${query}`);
        } else if (cmd === "chatgpt4") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/chatgpt4?q=${query}`);
        } else if (cmd === "venice") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/venice?q=${query}`);
        } else if (cmd === "code") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/code?lang=${query}`);
        } else if (cmd === "deepseek") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/deepseek?q=${query}`);
        } else if (cmd === "lyricsgen") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/lyricsgen?q=${query}`);
        } else if (cmd === "gpt4") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gpt4?q=${query}`);
        } else if (cmd === "qwena") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/qwena?q=${query}`);
        } else if (cmd === "gemini") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/gemini?q=${query}`);
        } else if (cmd === "metaa") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/metaa?q=${query}`);
        } else if (cmd === "deepseekr1") {
          reply = await fetchAPI(`https://apis-keith.vercel.app/ai/deepseekr1?q=${query}`);

        // ❌ Unknown
        } else {
          reply = "❌ Unknown command. Type *Help* to see all commands.";
        }

        // 🔥 Add footer
        const styledReply = `${reply}\n\n*➤ Type Help to see available commands.*`;

        console.log(`🤖 Toxic Lover reply: ${styledReply}`);
        callSendAPI(senderId, styledReply);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function: fetch API data
async function fetchAPI(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text || "⚠️ No response from API.";
  } catch (err) {
    console.error("❌ API fetch error:", err);
    return "⚠️ Error fetching data.";
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
  console.log(`🔥 Toxic Lover running with ALL commands on port ${PORT}`)
);
