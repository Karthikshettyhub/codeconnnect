// const OpenAI = require("openai");

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// exports.generateBoilerplate = async (code, language) => {
//   console.log("🤖 Generating boilerplate for:", language);

//   const prompt = `
// You are a senior software engineer.

// Wrap the following ${language} code inside a clean, production-ready boilerplate.
// Do NOT remove or change logic.
// Only add proper structure, functions, and best practices.

// CODE:
// ${code}
// `;

//   const response = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{ role: "user", content: prompt }],
//     temperature: 0.2,
//   });

//   return response.choices[0].message.content;
// };
