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
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();
        console.log(`📩 User: ${userMessage}`);

        let reply;

        if (userMessage.toLowerCase() === "help") {
          reply = getCommandList();
        } else {
          reply = await handleCommand(userMessage);
        }

        // ✨ Always styled
        const styledReply = `𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑\n\n${reply}\n\n➤ 𝑻𝒚𝒑𝒆 𝐇𝐞𝐥𝐩 𝒕𝒐 𝒔𝒆𝒆 𝒂𝒗𝒂𝒊𝒍𝒂𝒃𝒍𝐞 𝒄𝒐𝒎𝒎𝒂𝒏𝐝𝐬.`;

        callSendAPI(senderId, styledReply);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ Command Router
async function handleCommand(message) {
  const [cmd, ...args] = message.split(" ");
  const query = args.join(" ");

  const endpoints = {
    gpt: `/ai/gpt?q=${query}`,
    claude: `/ai/claude?q=${query}`,
    mistral: `/ai/mistral?q=${query}`,
    gemini: `/ai/gemini?q=${query}`,
    deepseek: `/ai/deepseek?q=${query}`,
    poem: `/education/poem/random`,
    maths: `/education/maths?q=${query}`,
    mathlist: `/education/maths/list`,
    dict: `/education/dictionary?q=${query}`,
    fruitinfo: `/education/fruitinfo?q=${query}`,
    booksearch: `/education/booksearch?q=${query}`,
    bookid: `/education/book?id=${query}`,
    yt: `/search/yt?q=${query}`,
    img: `/search/img?q=${query}`,
    bing: `/search/bing?q=${query}`,
    bible: `/education/bible?q=${query}`,
    lyrics: `/search/lyrics?q=${query}`,
    ig: `/search/ig?q=${query}`,
    spotify: `/search/spotify?q=${query}`,
    apkfab: `/search/apkfab?q=${query}`,
    tiktoktrend: `/search/tiktok/trend`,
  };

  if (endpoints[cmd]) {
    return await fetchFromAPI(endpoints[cmd], cmd);
  } else {
    // default → GPT answers any free text
    return await fetchFromAPI(`/ai/gpt?q=${encodeURIComponent(message)}`, "gpt");
  }
}

// ✅ Generic API fetch
async function fetchFromAPI(path, label) {
  try {
    const url = `https://apis-keith.vercel.app${path}`;
    const res = await fetch(url);
    const text = await res.text();
    return `𝐑𝐞𝐬𝐮𝐥𝐭 [${label.toUpperCase()}] ➤ ${text}`;
  } catch (err) {
    console.error(`❌ ${label} error:`, err);
    return `⚠️ 𝐄𝐫𝐫𝐨𝐫 𝐟𝐞𝐭𝐜𝐡𝐢𝐧𝐠 ${label}`;
  }
}

// ✅ Command List
function getCommandList() {
  return `
╔═ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓 ═╗

📚 𝐄𝐃𝐔𝐂𝐀𝐓𝐈𝐎𝐍
• fruitinfo [mango]
• poem
• mathlist
• maths [2+2]
• dict [love]
• booksearch [history]
• bookid [id]

🌍 𝐒𝐄𝐀𝐑𝐂𝐇
• yt [song]
• img [cats]
• bing [kenya]
• bible [John 3:16]
• tiktoktrend
• lyrics [hello]
• ig [user]
• spotify [song]
• apkfab [app]

🤖 𝐀𝐈 𝐇𝐔𝐁
• gpt [hi]
• claude [hi]
• mistral [hi]
• gemini [hi]
• deepseek [hi]

📌 𝐔𝐬𝐞: Type command + query
   𝐄.𝐠. ➤ gpt Hello
`;
}

// ✅ Send reply
function callSendAPI(senderPsid, response) {
  const body = {
    recipient: { id: senderPsid },
    message: { text: response },
  };

  fetch(
    `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  ).catch((err) => console.error("Unable to send:", err));
}

app.listen(PORT, () =>
  console.log(`🔥 Toxic Lover running with ALL commands on port ${PORT}`)
);
