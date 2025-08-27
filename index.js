import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { SerpAPI } from "@langchain/community/tools/serpapi";

const search = new SerpAPI('66e0c92fdbd7ad7b394589af2df4f4e0cc97f577e6a933895cd8903aa055fce5');


const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    maxOutputTokens: 2048,
    apiKey: 'AIzaSyBACB4a3jfg1G3Ot9OCcHSzqnM0R4uQCSU'
})
const agent = createReactAgent({
    llm: model,
    tools: [search],
});

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "can you search for me the weather in sf",
        },
    ],
});

console.log(result)