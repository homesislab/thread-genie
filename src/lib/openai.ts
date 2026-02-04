import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY is not set in environment variables');
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
});

export const GENERATION_CONFIG = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2000,
};
