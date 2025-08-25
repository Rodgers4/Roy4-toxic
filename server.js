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

/* ✅ Verify Webhook */
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

/* ✅ Handle Messages & Postbacks */
app.post("/webhook", async (req, res) => {
  if (req.body.object === "page") {
    for (const entry of req.body.entry) {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      // 🟦 Handle Postback (Menu Button)
      if (event.postback && event.postback.payload === "MENU_PAYLOAD") {
        sendTyping(senderId);
        const menuReply = getMenu();
        callSendAPI(senderId, menuReply);
      }

      // 🟦 Handle Text Messages
      if (event.message && event.message.text) {
        const userMessage = event.message.text.trim();
        console.log(`📩 User: ${userMessage}`);

        let reply;

        // 🏷 Custom identity replies
        if (userMessage.toLowerCase().includes("what is your name")) {
          reply = "🤍 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 created by 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 🤍";
        } else if (userMessage.toLowerCase().includes("who is your owner")) {
          reply = "💙 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙";
        } else if (userMessage.toLowerCase() === "menu") {
          reply = getMenu();
        } else {
          // Default → Prince GPT
          reply = await askPrinceAI(userMessage);
        }

        // 🎨 Styled response with footer
        const styledReply = `💠 ${reply}\n\n━━━━━━━━━━━━━━━\n💙 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙`;

        console.log(`🤖 Toxic Lover reply: ${styledReply}`);

        sendTyping(senderId);
        callSendAPI(senderId, styledReply);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

/* ✅ Function: Menu */
function getMenu() {
  return `💠 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 𝐌𝐄𝐍𝐔 💠

🎶 𝐋𝐲𝐫𝐢𝐜𝐬 <song>  
📚 𝐖𝐢𝐤𝐢𝐦𝐞𝐝𝐢𝐚 <title>  
🎵 𝐒𝐩𝐨𝐭𝐢𝐟𝐲 <song>  
▶️ 𝐘𝐨𝐮𝐓𝐮𝐛𝐞 <query>  
🎸 𝐂𝐡𝐨𝐫𝐝 <song>  
☁️ 𝐖𝐞𝐚𝐭𝐡𝐞𝐫 <city>  
📦 𝐍𝐏𝐌 <package>  
📱 𝐏𝐥𝐚𝐲𝐬𝐭𝐨𝐫𝐞 <app>  
🎮 𝐇𝐚𝐩𝐩𝐲𝐌𝐨𝐝 <app>  
📥 𝐀𝐩𝐤𝐌𝐢𝐫𝐫𝐨𝐫 <app>  
💟 𝐒𝐭𝐢𝐜𝐤𝐞𝐫𝐬 <query>  
🖼 𝐆𝐨𝐨𝐠𝐥𝐞 <query>  
🌆 𝐔𝐧𝐬𝐩𝐥𝐚𝐬𝐡 <query>  
🎥 𝐓𝐢𝐤𝐓𝐨𝐤 <query>  
🖼 𝐖𝐚𝐥𝐥𝐩𝐚𝐩𝐞𝐫𝐬 <query>  

━━━━━━━━━━━━━━
📌 𝐇𝐨𝐰 𝐭𝐨 𝐮𝐬𝐞:  
➤ Type the command name followed by your search.  
➤ Example: 𝐥𝐲𝐫𝐢𝐜𝐬 Dynasty Miaa  
➤ Example: 𝐰𝐞𝐚𝐭𝐡𝐞𝐫 Kisumu  

━━━━━━━━━━━━━━
💙 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐈𝐑 𝐑𝐎𝐃𝐆𝐄𝐑𝐒 💙`;
}

/* ✅ Function: Ask Prince GPT API */
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(
      message
    )}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log("🌐 PrinceTech raw response:", text);

    try {
      const data = JSON.parse(text);
      return (
        data.response ||
        data.result ||
        data.answer ||
        JSON.stringify(data) ||
        "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (empty reply)"
      );
    } catch (e) {
      return text || "💙 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (invalid response)";
    }
  } catch (error) {
    console.error("❌ PrinceTech API error:", error);
    return "⚠️ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (can’t reach AI)";
  }
}

/* ✅ Function: Send Typing Simulation */
function sendTyping(senderPsid) {
  const requestBody = {
    recipient: { id: senderPsid },
    sender_action: "typing_on",
  };

  fetch(
    `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  ).catch((err) => console.error("Unable to send typing:", err));
}

/* ✅ Function: Send Message */
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

/* ✅ Set Persistent Menu on startup */
async function setPersistentMenu() {
  const url = `https://graph.facebook.com/v16.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`;
  const body = {
    persistent_menu: [
      {
        locale: "default",
        composer_input_disabled: false,
        call_to_actions: [
          {
            type: "postback",
            title: "📜 Show Menu",
            payload: "MENU_PAYLOAD",
          },
        ],
      },
    ],
  };

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(() => console.log("✅ Persistent Menu set"))
    .catch((err) => console.error("❌ Menu error:", err));
}

app.listen(PORT, () => {
  console.log(`🔥 Toxic Lover running on port ${PORT}`);
  setPersistentMenu();
});
