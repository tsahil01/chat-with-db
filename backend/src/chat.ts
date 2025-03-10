import OpenAI from "openai";
import { Message } from "./types";


const client = new OpenAI({
    apiKey: process.env['API_KEY'],
});

export async function chat(messages: Message[], newMessage: Message) {
    if (!messages.some(msg => msg.role === "system")) {
        messages.unshift({ role: "system", content: systemPrompt });
    }
    messages.push(newMessage);

    const stream = await client.chat.completions.create({
        messages: messages,
        model: '<model-id>',
        stream: true
    });

    let fullResponse = '';
    for await (const chunk of stream) {
        const data = chunk.choices[0]?.delta?.content || '';
        fullResponse += data;
        process.stdout.write(data);
    }

    return fullResponse;
}