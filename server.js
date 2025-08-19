// ✅ Function: Ask PrinceTech AI API
async function askPrinceAI(message) {
  try {
    const url = `https://api.princetechn.com/api/ai/ai?apikey=prince&q=${encodeURIComponent(
      message
    )}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log("PrinceTech raw response:", text);

    try {
      const data = JSON.parse(text);

      // Support different possible keys
      return (
        data.response ||
        data.result ||
        data.answer ||
        JSON.stringify(data) ||
        "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (empty reply)"
      );
    } catch (e) {
      // If it wasn’t JSON, just return the text
      return text || "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (invalid response)";
    }
  } catch (error) {
    console.error("PrinceTech API error:", error);
    return "💙 𝗧𝗼𝘅𝗶𝗰 𝗟𝗼𝘃𝗲𝗿 💙 (can’t reach AI 😅)";
  }
        }
