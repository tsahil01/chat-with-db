import OpenAI from "openai";
import { Message } from "./types";
import { config } from 'dotenv';
import { systemPrompt } from "./prompts";

config();

const client = new OpenAI({
    apiKey: process.env['API_KEY'],
    baseURL: 'https://openrouter.ai/api/v1'
});

export async function chat(messages: Message[], newMessage: Message) {
    try {
        if (!messages.some(msg => msg.role === "system")) {
            messages.unshift({ role: "system", content: systemPrompt });
        }
        messages.push(newMessage);

        const stream = await client.chat.completions.create({
            messages: messages,
            model: 'google/gemini-2.0-flash-thinking-exp:free',
            stream: true
        });

        let fullResponse = '';
        for await (const chunk of stream) {
            if (!chunk.choices || !Array.isArray(chunk.choices) || chunk.choices.length === 0) {
                console.warn("Invalid chunk received:", chunk);
                continue;
            }

            const data = chunk.choices[0]?.delta?.content || '';
            fullResponse += data;
        }

        return fullResponse;
    } catch (error) {
        console.error("Error during chat completion:", error);
        throw error;
    }
}

