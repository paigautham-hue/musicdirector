import { ENV } from "./env";
import { InvokeParams, InvokeResult, Message, Tool } from "./llm";

/**
 * LLM Fallback System
 * Tries multiple LLM providers in order until one succeeds
 * Providers: Manus Forge (primary), Anthropic, Gemini, Grok, Perplexity
 */

type LLMProvider = "forge" | "anthropic" | "gemini" | "grok" | "perplexity";

const PROVIDER_ORDER: LLMProvider[] = ["forge", "anthropic", "gemini", "grok"];

interface ProviderConfig {
  name: string;
  apiKey: string | undefined;
  endpoint: string;
  model: string;
}

function getProviderConfig(provider: LLMProvider): ProviderConfig | null {
  switch (provider) {
    case "forge":
      return {
        name: "Manus Forge",
        apiKey: ENV.forgeApiKey,
        endpoint: ENV.forgeApiUrl 
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions",
        model: "gemini-2.5-flash",
      };
    
    case "anthropic":
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) return null;
      return {
        name: "Anthropic Claude",
        apiKey: anthropicKey,
        endpoint: "https://api.anthropic.com/v1/messages",
        model: "claude-3-5-sonnet-20241022",
      };
    
    case "gemini":
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return null;
      return {
        name: "Google Gemini",
        apiKey: geminiKey,
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        model: "gemini-2.0-flash-exp",
      };
    
    case "grok":
      const grokKey = process.env.XAI_API_KEY;
      if (!grokKey) return null;
      return {
        name: "Grok",
        apiKey: grokKey,
        endpoint: "https://api.x.ai/v1/chat/completions",
        model: "grok-beta",
      };
    
    default:
      return null;
  }
}

function normalizeMessage(message: Message) {
  const { role, content } = message;
  
  // Convert content to string if it's an array
  if (Array.isArray(content)) {
    const textParts = content
      .map(part => {
        if (typeof part === "string") return part;
        if (part.type === "text") return part.text;
        return "";
      })
      .filter(Boolean);
    return { role, content: textParts.join("\n") };
  }
  
  if (typeof content === "string") {
    return { role, content };
  }
  
  if (content.type === "text") {
    return { role, content: content.text };
  }
  
  return { role, content: "" };
}

async function invokeForge(config: ProviderConfig, params: InvokeParams): Promise<InvokeResult> {
  const { messages, tools, toolChoice, tool_choice, response_format } = params;
  
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map(normalizeMessage),
    max_tokens: 32768,
    thinking: { budget_tokens: 128 },
  };
  
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  
  if (toolChoice || tool_choice) {
    payload.tool_choice = toolChoice || tool_choice;
  }
  
  if (response_format) {
    payload.response_format = response_format;
  }
  
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.name} failed: ${response.status} ${response.statusText} – ${errorText}`);
  }
  
  return await response.json() as InvokeResult;
}

async function invokeAnthropic(config: ProviderConfig, params: InvokeParams): Promise<InvokeResult> {
  const { messages, response_format } = params;
  
  // Separate system message from other messages
  const systemMessage = messages.find(m => m.role === "system");
  const otherMessages = messages.filter(m => m.role !== "system");
  
  const payload: Record<string, unknown> = {
    model: config.model,
    max_tokens: 8192,
    messages: otherMessages.map(normalizeMessage),
  };
  
  if (systemMessage) {
    const normalized = normalizeMessage(systemMessage);
    let systemContent = normalized.content;
    
    // If response_format is set, add JSON instruction to system prompt
    if (response_format) {
      systemContent += "\n\nIMPORTANT: You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly.";
    }
    
    payload.system = systemContent;
  } else if (response_format) {
    payload.system = "You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly.";
  }
  
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.name} failed: ${response.status} ${response.statusText} – ${errorText}`);
  }
  
  const result = await response.json();
  
  // Convert Anthropic response to OpenAI format
  return {
    id: result.id,
    created: Date.now(),
    model: result.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: result.content[0].text,
      },
      finish_reason: result.stop_reason,
    }],
    usage: {
      prompt_tokens: result.usage.input_tokens,
      completion_tokens: result.usage.output_tokens,
      total_tokens: result.usage.input_tokens + result.usage.output_tokens,
    },
  };
}

async function invokeGemini(config: ProviderConfig, params: InvokeParams): Promise<InvokeResult> {
  const { messages, response_format } = params;
  
  // Separate system message
  const systemMessage = messages.find(m => m.role === "system");
  const otherMessages = messages.filter(m => m.role !== "system");
  
  const contents = otherMessages.map(msg => {
    const normalized = normalizeMessage(msg);
    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: normalized.content }],
    };
  });
  
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: 8192,
  };
  
  if (response_format) {
    generationConfig.response_mime_type = "application/json";
  }
  
  const payload: Record<string, unknown> = {
    contents,
    generationConfig,
  };
  
  if (systemMessage) {
    const normalized = normalizeMessage(systemMessage);
    let systemContent = normalized.content;
    
    if (response_format) {
      systemContent += "\n\nIMPORTANT: You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly.";
    }
    
    payload.systemInstruction = {
      parts: [{ text: systemContent }],
    };
  } else if (response_format) {
    payload.systemInstruction = {
      parts: [{ text: "You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly." }],
    };
  }
  
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.name} failed: ${response.status} ${response.statusText} – ${errorText}`);
  }
  
  const result = await response.json();
  
  // Convert Gemini response to OpenAI format
  const candidate = result.candidates?.[0];
  if (!candidate) {
    throw new Error("No response from Gemini");
  }
  
  return {
    id: `gemini-${Date.now()}`,
    created: Date.now(),
    model: config.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: candidate.content.parts[0].text,
      },
      finish_reason: candidate.finishReason,
    }],
    usage: {
      prompt_tokens: result.usageMetadata?.promptTokenCount || 0,
      completion_tokens: result.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: result.usageMetadata?.totalTokenCount || 0,
    },
  };
}

async function invokeGrok(config: ProviderConfig, params: InvokeParams): Promise<InvokeResult> {
  const { messages, response_format } = params;
  
  let processedMessages = messages.map(normalizeMessage);
  
  // If response_format is set, add JSON instruction to system message
  if (response_format) {
    const systemIndex = processedMessages.findIndex(m => m.role === "system");
    if (systemIndex >= 0) {
      processedMessages[systemIndex] = {
        ...processedMessages[systemIndex],
        content: processedMessages[systemIndex].content + "\n\nIMPORTANT: You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly."
      };
    } else {
      processedMessages = [
        { role: "system", content: "You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks or add any explanation. Output raw JSON directly." },
        ...processedMessages
      ];
    }
  }
  
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: processedMessages,
    max_tokens: 8192,
  };
  
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${config.name} failed: ${response.status} ${response.statusText} – ${errorText}`);
  }
  
  return await response.json() as InvokeResult;
}

async function invokeProvider(provider: LLMProvider, params: InvokeParams): Promise<InvokeResult> {
  const config = getProviderConfig(provider);
  if (!config || !config.apiKey) {
    throw new Error(`${provider} is not configured`);
  }
  
  console.log(`[LLM Fallback] Trying ${config.name}...`);
  
  switch (provider) {
    case "forge":
      return await invokeForge(config, params);
    case "anthropic":
      return await invokeAnthropic(config, params);
    case "gemini":
      return await invokeGemini(config, params);
    case "grok":
      return await invokeGrok(config, params);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Extract JSON from markdown code blocks or raw text
 */
function extractJSON(content: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Try to find JSON object/array
  const jsonMatch = content.match(/({[\s\S]*}|\[[\s\S]*\])/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  
  // Return as-is if no pattern found
  return content.trim();
}

export async function invokeLLMWithFallback(params: InvokeParams): Promise<InvokeResult> {
  const errors: Array<{ provider: string; error: string }> = [];
  
  for (const provider of PROVIDER_ORDER) {
    try {
      const result = await invokeProvider(provider, params);
      console.log(`[LLM Fallback] ✓ ${provider} succeeded`);
      
      // If response_format is set, extract JSON from markdown if needed
      if (params.response_format && result.choices[0]?.message?.content) {
        const content = result.choices[0].message.content;
        if (typeof content === 'string') {
          const extracted = extractJSON(content);
          result.choices[0].message.content = extracted;
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[LLM Fallback] ✗ ${provider} failed:`, errorMessage);
      errors.push({ provider, error: errorMessage });
      
      // Continue to next provider
      continue;
    }
  }
  
  // All providers failed
  const errorSummary = errors.map(e => `${e.provider}: ${e.error}`).join("; ");
  throw new Error(`All LLM providers failed: ${errorSummary}`);
}
