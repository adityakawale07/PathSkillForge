import { GoogleGenerativeAI } from "@google/generative-ai";
import { selectContext } from "./ai-context.js";
const model = (json = false) => {
  const name = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
    model: name,
    generationConfig: {
      maxOutputTokens: json ? 12000 : 1800,
      ...(name === 'gemini-2.5-flash' || name === 'gemini-2.5-flash-lite'
        ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  });
};
async function generate(text, prompt, json) {
  const material = selectContext(text || '', prompt);
  const result = await model(json).generateContent(
    `Study material excerpts (not necessarily the complete document):\n"""${material}"""\n\n` +
    prompt + '\nBe concise. Use only the provided material; do not invent missing information.'
  );
  if (result.response.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
    throw new Error('The response was too long. Try requesting fewer questions or flashcards.');
  }
  return result.response.text();
}
export async function ask(text, prompt) {
  return generate(text, prompt, false);
}
export async function askJSON(text, prompt) {
  const out = await generate(text, prompt + '\nReturn ONLY valid JSON, no markdown. Keep each answer and explanation brief.', true);
  return JSON.parse(out.replace(/```json|```/g, '').trim());
}
