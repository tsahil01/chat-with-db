import OpenAI from "openai";
import { Message } from "./types";


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
        model: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
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