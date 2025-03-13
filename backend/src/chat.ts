import OpenAI from "openai";
import { Message } from "./types";
import dotenv from 'dotenv';
import { systemPrompt } from "./prompts";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env['API_KEY'],
    baseURL: 'https://openrouter.ai/api/v1'
});

export async function chat(messages: Message[], newMessage: Message) {
    if (!messages.some(msg => msg.role === "system")) {
        messages.unshift({ role: "system", content: systemPrompt });
    }
    messages.push(newMessage);

    const stream = await client.chat.completions.create({
        messages: messages,
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        stream: true
    });

    let fullResponse = '';
    for await (const chunk of stream) {
        const data = chunk.choices[0]?.delta?.content || '';
        process.stdout.write(data);
        fullResponse += data;
    }

    return fullResponse;
}