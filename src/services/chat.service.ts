
import { getAiModel } from '@/lib/ai'
import { ConversationService } from './conversation.service'
import { prisma } from '@/lib/prisma'
import { getSystemPrompt } from '@/lib/prompt'
import { AppPermissionService } from './app-permission.service'

import { MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph } from "@langchain/langgraph";
import { StructuredTool } from '@langchain/core/tools'
import {
    GmailCreateDraft,
    GmailGetMessage,
    GmailGetThread,
    GmailSearch,
    GmailSendMessage,
} from "@langchain/community/tools/gmail";

import { GoogleCalendarCreateEvent, GoogleCalendarGetEvents, GoogleCalendarUpdateEvent, GoogleCalendarDeleteEvent } from '@/lib/calendar'

interface ChatRequest {
    messages: any[]
    threadId: string
    model: string
    apiKey: string
}

interface ChatFetchRequest {
    threadId: string
    userId: string
}

export class ChatService {
    private conversationService = new ConversationService()
    private appPermissionService = new AppPermissionService()
    private user: {
        name: string,
        email: string
        id: string
    }

    constructor(user: { name: string, email: string, id: string }) {
        this.user = user
    }


    private convertMessagesToLangChain(messages: any[]): BaseMessage[] {
        return messages.map((msg) => {
            switch (msg.role) {
                case 'user':
                    return new HumanMessage(msg.content);
                case 'assistant':
                    return new AIMessage(msg.content);
                case 'system':
                    // System messages are handled separately in the llmCall function
                    return null;
                default:
                    throw new Error(`Unsupported message role: ${msg.role}`);
            }
        }).filter(Boolean) as BaseMessage[];
    }


    async processChat(request: ChatRequest): Promise<ReadableStream> {
        const { messages, threadId, model, apiKey } = request

        const gemini = new ChatGoogleGenerativeAI({
            model,
            maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '2048'),
            apiKey
        })

        const openai = new ChatOpenAI({
            model,
            maxTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '2048'),
            apiKey
        })

        const llm = model.includes('gemini') ? gemini : openai;

        const gmailAccessToken = await this.appPermissionService.getAppAccessToken(this.user.id, 'gmail')
        const calendarAccessToken = await this.appPermissionService.getAppAccessToken(this.user.id, 'calendar')

        const tokenData = {
            credentials: {
                accessToken: gmailAccessToken as string
            },
        }

        const tools: StructuredTool[] = [
            new GmailCreateDraft(tokenData),
            new GmailGetMessage(tokenData),
            new GmailGetThread(tokenData),
            new GmailSearch(tokenData),
            new GmailSendMessage(tokenData),
            new GoogleCalendarCreateEvent(calendarAccessToken as string),
            new GoogleCalendarGetEvents(calendarAccessToken as string),
            new GoogleCalendarUpdateEvent(calendarAccessToken as string),
            new GoogleCalendarDeleteEvent(calendarAccessToken as string)
        ];

        const user = this.user

        const llmWithTools = llm.bindTools(tools);


        async function llmCall(state: typeof MessagesAnnotation.State) {
            const result = await llmWithTools.invoke([
                {
                    role: "system",
                    content: getSystemPrompt(user.name, user.email),
                },
                ...state.messages,
            ]);
            return { messages: [result] };
        }

        const toolNode = new ToolNode(tools);

        function shouldContinue(state: typeof MessagesAnnotation.State) {
            const messages = state.messages;
            const lastMessage = messages.at(-1);

            if ((lastMessage as any)?.tool_calls?.length) {
                return "Action";
            }
            return "__end__";
        }

        const agentBuilder = new StateGraph(MessagesAnnotation)
            .addNode("llmCall", llmCall)
            .addNode("tools", toolNode)
            .addEdge("__start__", "llmCall")
            .addConditionalEdges(
                "llmCall",
                shouldContinue,
                {
                    "Action": "tools",
                    "__end__": "__end__",
                }
            )
            .addEdge("tools", "llmCall")
            .compile();

        const langChainMessages = this.convertMessagesToLangChain(messages);

        return new ReadableStream({
            start: async (controller) => {
                try {
                    const eventStream = agentBuilder.streamEvents(
                        { messages: langChainMessages },
                        { version: "v1" },
                    );

                    let completeResponse = ''
                    for await (const event of eventStream) {
                        if (event.event === "on_llm_stream") {
                            const token = model.includes("gemini") ? event.data?.chunk?.content : event.data?.chunk?.text;
                            if (token) {
                                controller.enqueue(new TextEncoder().encode(token));
                                completeResponse += token;
                            }
                        }
                    }

                    await this.conversationService.saveAssistantMessage(threadId, completeResponse)
                    controller.close()
                } catch (err) {
                    console.error("Streaming error:", err);
                    controller.error(err);
                }
            }
        })
    }

    async getMessages(request: ChatFetchRequest) {
        const { threadId, userId } = request;

        const conversation = await prisma.conversation.findFirst({
            where: ({
                threadId,
                userId,
                isDeleted: false,
                deletedAt: null,
            } as any)
        })

        if (!conversation) {
            throw new Error('CONVERSATION_NOT_FOUND_OR_DELETED')
        }

        const conversationAny: any = conversation as any
        if (conversationAny?.isDeleted || conversationAny?.deletedAt) {
            throw new Error('CONVERSATION_NOT_FOUND_OR_DELETED')
        }

        return await prisma.message.findMany({
            where: {
                threadId,
            }
        })
    }
}