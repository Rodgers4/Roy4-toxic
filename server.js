import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Messenger tokens
const VERIFY_TOKEN = "Rodgers4";
const PAGE_ACCESS_TOKEN = "EAAU7cBW7QjkBPOAa7cUMw5ZALBeqNfjYhpyxm86o0yRR7n7835SIv5YHVxsyKozKgZAltZCo0GiPK4ZBrIMX2Ym7PTHtdfrf25xDnp4S2PogGVnDxBftFunycaHgsmvtmrV90sEHHNNgmn4oxa4pI27ThWZBdvosEqGokHs1ZCDXZAduFVF9aQ01m2wgZAZBZC01KB0CYeOZAHc5wZDZD";

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

        // Typing simulation
        await simulateTyping(senderId, true);

        let reply;

        // 🔹 Custom Menu Command
        if (userMessage.toLowerCase() === "menu") {
          reply = getMenu();
          callSendAPI(senderId, reply);
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 Lyrics Command
        if (userMessage.toLowerCase().startsWith("lyrics ")) {
          const query = userMessage.slice(7).trim();
          reply = await fetchLyrics(query);
          callSendAPI(senderId, reply, true); // with image
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 Wiki Command
        if (userMessage.toLowerCase().startsWith("wiki ")) {
          const query = userMessage.slice(5).trim();
          reply = await fetchWiki(query);
          callSendAPI(senderId, reply);
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 Pickup Line Command
        if (userMessage.toLowerCase().includes("pickup")) {
          reply = await fetchPickup();
          callSendAPI(senderId, reply);
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 TikTok Download
        if (userMessage.toLowerCase().startsWith("tiktok ")) {
          const url = userMessage.slice(7).trim();
          reply = await fetchTikTok(url);
          callSendAPI(senderId, reply, true);
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 Remove Background
        if (userMessage.toLowerCase().startsWith("removebg ")) {
          const url = userMessage.slice(9).trim();
          reply = await fetchRemoveBG(url);
          callSendAPI(senderId, reply, true);
          await simulateTyping(senderId, false);
          continue;
        }

        // 🔹 Playstore Search
        if (userMessage.toLowerCase().startsWith("playstore ")) {
          const query = userMessage.slice(10).trim();
          reply = await fetchPlaystore(query);
          callSendAPI(senderId, reply, true);
          await simulateTyping(senderId, false);
          continue;
        }

        // Default → Prince GPT
        reply = await askPrinceAI(userMessage);
        callSendAPI(senderId, reply);
        await simulateTyping(senderId, false);
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ Function: Prince GPT
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/gpt?apikey=prince&q=${encodeURIComponent(
      message
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    return `💠 ${data.response || data.answer || "No reply"}\n\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬 𝐓𝐞𝐜𝐡`;
  } catch (error) {
    return "⚠️ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 (AI unreachable)";
  }
}

// ✅ Function: Fetch Lyrics
async function fetchLyrics(song) {
  try {
    const url = `https://api.princetechn.com/api/search/lyrics?apikey=prince&query=${encodeURIComponent(
      song
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
      text: `🎶 𝐋𝐲𝐫𝐢𝐜𝐬 𝐟𝐨𝐫: ${song}\n\n${data.lyrics}\n\n👨‍🎤 Artist: ${data.artist}\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬 𝐓𝐞𝐜𝐡`,
      image: data.image,
    };
  } catch {
    return { text: "❌ Could not fetch lyrics." };
  }
}

// ✅ Function: Wiki Search
async function fetchWiki(query) {
  try {
    const url = `https://api.princetechn.com/api/search/wikimedia?apikey=prince&title=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    return `📖 ${data.title}\n\n${data.description}\n\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬 𝐓𝐞𝐜𝐡`;
  } catch {
    return "❌ Wiki not available.";
  }
}

// ✅ Pickup line
async function fetchPickup() {
  const res = await fetch(
    "https://api.princetechn.com/api/fun/pickupline?apikey=prince"
  );
  const data = await res.json();
  return `💘 ${data.result}\n━━━━━━━━━━━━━━━\n𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐒𝐢𝐫 𝐑𝐨𝐝𝐠𝐞𝐫𝐬 𝐓𝐞𝐜𝐡`;
}

// ✅ TikTok Download
async function fetchTikTok(url) {
  const res = await fetch(
    `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(
      url
    )}`
  );
  const data = await res.json();
  return { text: `🎥 TikTok Video`, image: data.video };
}

// ✅ Remove BG
async function fetchRemoveBG(url) {
  return {
    text: "🖼 Background removed",
    image: `https://api.princetechn.com/api/tools/removebg?apikey=prince&url=${encodeURIComponent(
      url
    )}`,
  };
}

// ✅ Playstore
async function fetchPlaystore(query) {
  const res = await fetch(
    `https://api.princetechn.com/api/search/playstore?apikey=prince&query=${encodeURIComponent(
      query
    )}`
  );
  const data = await res.json();
  return {
    text: `📱 ${data.title}\n${data.description}`,
    image: data.icon,
  };
}

// ✅ Menu Generator
function getMenu() {
  return `⚡ 𝐓𝐎𝐗𝐈𝐂 𝐋𝐎𝐕𝐄𝐑 ⚡\n━━━━━━━━━━━━━━━
  
🎶 𝐌𝐮𝐬𝐢𝐜  
- Lyrics <song>

📖 𝐖𝐢𝐤𝐢  
- Wiki <question>

💘 𝐅𝐮𝐧  
- Pickup

🎥 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝  
- TikTok <url>  
- Playstore <app>  
- Removebg <image url>

🤖 𝐀𝐈  
- Ask anything

━━━━━━━━━━━━━━━
📌 𝐇𝐨𝐰 𝐭𝐨 𝐔𝐬𝐞  
- Example: Lyrics Dusuma  
- Example: Wiki Who is girlfriend of Rodgers
━━━━━━━━━━━━━━━`;
}

// ✅ Simulate typing
async function simulateTyping(senderPsid, isOn) {
  const action = isOn ? "typing_on" : "typing_off";
  await fetch(
    `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderPsid },
        sender_action: action,
      }),
    }
  );
}

// ✅ Send response (text or with image)
function callSendAPI(senderPsid, response, hasImage = false) {
  let requestBody;

  if (hasImage && response.image) {
    requestBody = {
      recipient: { id: senderPsid },
      message: {
        attachment: {
          type: "image",
          payload: { url: response.image, is_reusable: true },
        },
      },
    };

    // Send image
    fetch(
      `https://graph.facebook.com/v16.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    // Send caption
    requestBody = {
      recipient: { id: senderPsid },
      message: { text: response.text },
    };
  } else {
    requestBody = {
      recipient: { id: senderPsid },
      message: { text: response },
    };
  }

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
  console.log(`🔥 Toxic Lover running on port ${PORT}`)
);
