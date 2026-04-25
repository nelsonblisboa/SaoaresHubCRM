const { OpenAI } = require('openai');

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://soareshub.com',
    'X-Title': 'SOARES HUB CRM',
  },
});

const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

module.exports = { openrouter, DEFAULT_MODEL };
