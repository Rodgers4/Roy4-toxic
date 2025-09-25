const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');
const history = new Map();

// ✅ Add your tokens here
const PAGE_ACCESS_TOKEN = "EAAP7Izjhq2MBPm9ON3C2JkZADwoXZA39s5Un5qWamD6hzGBBgKx6E1h7NsBhJZBiwYMTsWJXZCST5yJAuwllII9jFfFYRQ0l67DeSmeJjpwXCiGqRubqZANsNlzVcis8iikTLxJU4hZA8PaWpPu167N6EdQRC5ez1ZCb2YmV1qq8rwu2PFDeAZAlFZAkk5vQnpuxooS2iZABCR1gZDZD";
const VERIFY_TOKEN = "Rodgers4";

const BOLD = t => t.replace(/\*\*(.+?)\*\*/g, (_, w) =>
  [...w].map(c =>
    String.fromCodePoint(
      /[a-z]/.test(c) ? 0x1D41A + c.charCodeAt() - 97 :
      /[A-Z]/.test(c) ? 0x1D400 + c.charCodeAt() - 65 :
      /[0-9]/.test(c) ? 0x1D7CE + c.charCodeAt() - 48 :
      c.charCodeAt()
    )
  ).join('')
);

module.exports = {
  name: 'lorna',
  description: 'Talk to Lorna AI',
  usage: 'lorna [question]',
  author: 'Rodgers Onyango',

  async execute(id, args, token = PAGE_ACCESS_TOKEN, e) {
    if (!e) return sendMessage(id, { text: '❗ Failed.' }, token);
    const q = args.join(' ').trim();
    if (!q) return sendMessage(id, { text: '💬 Ask me anything.' }, token);

    const convo = history.get(id) || [];
    const ask = [...convo, { role: 'user', content: q }]
      .map(m => `${m.role}: ${m.content}`).join('\n');

    try {
      let customReply;

      // ✅ Special custom responses
      if (/what is your name|who are you/i.test(q)) {
        customReply = "Am Lorna Ai, made by the most young talented and brilliant Sir Rodgers, to be part of their modern projects.";
      } else if (/who is rodgers|tell me about rodgers/i.test(q)) {
        const facts = [
          "Rodgers Onyango is a brilliant young tech mind from Kisumu, Kenya, passionate about building modern solutions.",
          "Rodgers Onyango is a visionary innovator from Kisumu, Kenya, who inspires others through tech projects.",
          "Rodgers Onyango is a smart and focused creator from Kisumu, Kenya, determined to uplift his family's life.",
          "Rodgers Onyango is a young Kenyan techie from Kisumu with a dream to change the future through technology."
        ];
        customReply = facts[Math.floor(Math.random() * facts.length)];
      }

      let replyText;

      if (customReply) {
        replyText = customReply;
      } else {
        // ✅ Prince AI as main backend
        const { data } = await axios.get("https://api.princetechn.com/api/ai/openai", {
          params: { apikey: "prince", q: ask }
        });
        replyText = data?.response || data?.result || "I couldn't find a good answer.";
      }

      const finalResponse = `𝐋𝐎𝐑𝐍𝐀\n${BOLD(replyText)}\n━━━━━━━━━━━━━━━\n𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐑𝐎𝐘𝐓𝐄𝐂𝐇`;

      sendMessage(id, { text: finalResponse }, token);
      history.set(id, [...convo, { role: 'user', content: q }, { role: 'assistant', content: replyText }].slice(-10));
    } catch (err) {
      console.error("Lorna AI error:", err.message);
      sendMessage(id, { text: '⚠️ Lorna AI error.' }, token);
    }
  }
};

// Export tokens for webhook use
module.exports.PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN;
module.exports.VERIFY_TOKEN = VERIFY_TOKEN;
