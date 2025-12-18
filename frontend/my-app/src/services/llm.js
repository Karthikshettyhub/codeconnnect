// src/services/llm.js
import axios from "axios";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
console.log("Gemini API KEY =", GEMINI_API_KEY);

// Cooldown to prevent rate limits
let lastCall = 0;
const MIN_DELAY = 3000; // 3 sec cooldown

// Clean junk output
const clean = (text = "") =>
  text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    .replace(/`/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();

export const generateBoilerplate = async (language, userBody, retry = 0) => {
  const prompt = `
Generate FULL valid boilerplate for ${language}.
Insert the USER BODY EXACTLY AS GIVEN.

RULES:
- NO comments
- NO explanation
- NO markdown
- NO backticks
- DO NOT modify userBody
- DO NOT fix errors
- ALWAYS return runnable ${language} code

USER BODY:
${userBody}
`;

  try {
    // Rate-limit protection
    const now = Date.now();
    if (now - lastCall < MIN_DELAY) {
      await new Promise((res) => setTimeout(res, MIN_DELAY));
    }
    lastCall = now;

    // API CALL
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const raw =
      res?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = clean(raw);

    // Auto-retry if empty
    if ((!cleaned || cleaned.length < 5) && retry < 2) {
      console.warn("⚠ EMPTY LLM OUTPUT — retrying…");
      return await generateBoilerplate(language, userBody, retry + 1);
    }

    return cleaned;
  } catch (err) {
    console.error("🔥 LLM ERROR:", err?.response?.data || err);
    return ""; // fallback
  }
};
