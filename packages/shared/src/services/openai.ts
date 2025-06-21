import OpenAI from "openai";
import { getToken } from "../storage";

let openaiClient: OpenAI | null = null;

async function getOpenAIClient(): Promise<OpenAI> {
  if (!openaiClient) {
    const token = await getToken();
    if (!token) {
      throw new Error(
        "OpenAI API token not found. Please configure your API key in settings.",
      );
    }
    if (!token.startsWith("sk-")) {
      throw new Error(
        "Invalid OpenAI API token format. Token should start with 'sk-'.",
      );
    }
    openaiClient = new OpenAI({ apiKey: token, dangerouslyAllowBrowser: true });
  }
  return openaiClient;
}

export async function chatWithWebpage(
  userMessage: string,
  webpageContent: string,
  webpageTitle: string,
  webpageUrl: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  try {
    const client = await getOpenAIClient();

    // Truncate content if it's too long (rough estimate: 1 token ≈ 4 characters)
    const maxContentLength = 40000; // ~10k tokens for content, leaving room for system prompt and user message
    const truncatedContent =
      webpageContent.length > maxContentLength
        ? webpageContent.substring(0, maxContentLength) +
          "\n\n[Content truncated due to length...]"
        : webpageContent;

    const systemPrompt = `You are a specialized assistant that helps users understand and explore the content of a specific webpage. You should interpret all questions and requests in the context of the webpage content provided below.

Guidelines for responding:
1. Always interpret questions in relation to the webpage content, even if they seem generic
2. For vague questions like "What did you say?", "Tell me more", or "Explain that", refer to the most relevant or recent topic from the webpage
3. For questions about general topics, try to connect them to what's discussed on this webpage first
4. If a question has absolutely no connection to the webpage content, politely redirect with context
5. Base all answers on the webpage content, but be conversational and helpful in your interpretation

Approach: Interpret user questions generously in the context of this webpage content. Help users explore and understand what's on this page through natural conversation.

Context - You are discussing this webpage:
Title: ${webpageTitle}
URL: ${webpageUrl}

Webpage content in markdown format:
${truncatedContent}
`;

    if (onChunk) {
      // Streaming response
      const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      return fullResponse || "Sorry, I couldn't generate a response.";
    } else {
      // Non-streaming response
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return (
        response.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a response."
      );
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

export function resetOpenAIClient() {
  openaiClient = null;
}
