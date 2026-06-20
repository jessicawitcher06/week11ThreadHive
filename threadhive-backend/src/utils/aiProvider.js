import dotenv from 'dotenv';
dotenv.config();

/**
 * AI Configuration - Simple Comment/Uncomment Approach
 * 
 * HOW TO SWITCH PROVIDERS:
 * 1. Comment out the provider you DON'T want to use
 * 2. Uncomment the provider you WANT to use
 * 3. Make sure you have the API key in .env file
 * 4. Restart your server
 */

// ============================================================================
// OPTION 1: USE OPENAI
// ============================================================================
// Uncomment this section to use OpenAI (and comment out Gemini section below)
// npm install openai

// import OpenAI from 'openai';

// const aiClient = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// export const generateAIContent = async (prompt) => {
//   const completion = await aiClient.chat.completions.create({
//     model: AI_MODEL,
//     messages: [
//       {
//         role: 'system',
//         content: 'You are a helpful assistant that provides concise and accurate responses.'
//       },
//       {
//         role: 'user',
//         content: prompt
//       }
//     ],
//     temperature: 0.7,
//   });

//   return completion.choices[0].message.content;
// };

// ============================================================================
// OPTION 2: USE GEMINI (CURRENTLY ACTIVE)
// ============================================================================
// Uncomment this section to use Gemini (and comment out OpenAI section above)
// npm install @google/genai

import { GoogleGenAI } from '@google/genai';

const aiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const generateAIContent = async (prompt) => {
  const result = await aiClient.models.generateContent({
    model: AI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  if (!result || !result.text) {
    throw new Error('No response received from AI API');
  }

  return result.text;
};
