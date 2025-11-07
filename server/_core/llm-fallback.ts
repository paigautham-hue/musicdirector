import { ENV } from "./env";
import { InvokeParams, InvokeResult, Message, Tool } from "./llm";
import { logLlmUsage } from "../db";

/**
 * LLM Fallback System with Tier-Based Routing (November 2025)
 * 
 * Tier 1 (Max Power - Complex Reasoning): Gemini 2.5 Pro, Claude Opus 4.1, Grok 4 Heavy, GPT-5
 * Tier 2 (Balanced - Standard Tasks): Gemini 2.5 Flash, Claude Sonnet 4.5, Grok 4, GPT-4o
 * Tier 3 (Speed - Simple Tasks): Grok 4 Fast, Gemini 2.5 Flash
 * 
 * Providers: Manus Forge (primary), Anthropic, Gemini, Grok, OpenAI
 */

type LLMProvider = "forge" | "anthropic" | "gemini" | "grok" | "openai";
type TaskTier = "max_power" | "balanced" | "speed";

// Default to balanced tier for most tasks
const DEFAULT_TIER: TaskTier = "balanced";

// Provider order by tier
const TIER_PROVIDER_ORDER: Record<TaskTier, LLMProvider[]> = {
  max_power: ["gemini", "anthropic", "grok", "openai", "forge"],
  balanced: ["forge", "gemini", "anthropic", "grok", "openai"],
  speed: ["grok", "forge", "gemini"],
};

interface ProviderConfig {
  name: string;
  apiKey: string | undefined;
  endpoint: string;
  model: string;
}

function getProviderConfig(provider: LLMProvider, tier: TaskTier = "balanced"): ProviderConfig | null {
  switch (provider) {
    case "forge":
      return {
        name: "Manus Forge",
        apiKey: ENV.forgeApiKey,
        endpoint: ENV.forgeApiUrl 
          ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
          : "https://forge.manus.im/v1/chat/completions",
        model: tier === "max_power" ? "gemini-2.5-pro" : "gemini-2.5-flash",
      };
    
    case "anthropic":
      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) return null;
      return {
        name: "Anthropic Claude",
        apiKey: anthropicKey,
        endpoint: "https://api.anthropic.com/v1/messages",
        model: tier === "max_power" ? "claude-opus-4-1" : "claude-sonnet-4-5",
      };
    
    case "gemini":
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) return null;
      const geminiModel = tier === "max_power" ? "gemini-2.5-pro" : "gemini-2.5-flash";
      return {
        name: "Google Gemini",
        apiKey: geminiKey,
        endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
        model: geminiModel,
      };
    
    case "grok":
      const grokKey = process.env.XAI_API_KEY;
      if (!grokKey) return null;
      let grokModel = "grok-4";
      if (tier === "max_power") grokModel = "grok-4-heavy";
      else if (tier === "speed") grokModel = "grok-4-fast";
      return {
        name: "Grok",
        apiKey: grokKey,
        endpoint: "https://api.x.ai/v1/chat/completions",
        model: grokModel,
      };
    
    case "openai":
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) return null;
      return {
        name: "OpenAI",
        apiKey: openaiKey,
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: tier === "max_power" ? "gpt-5" : "gpt-4o",
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

async function invokeOpenAI(config: ProviderConfig, params: InvokeParams): Promise<InvokeResult> {
  const { messages, tools, toolChoice, tool_choice, response_format } = params;
  
  const payload: Record<string, unknown> = {
    model: config.model,
    messages: messages.map(normalizeMessage),
    max_tokens: 8192,
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

async function invokeProvider(provider: LLMProvider, params: InvokeParams, tier: TaskTier = "balanced"): Promise<InvokeResult> {
  const config = getProviderConfig(provider, tier);
  if (!config || !config.apiKey) {
    throw new Error(`${provider} is not configured`);
  }
  
  console.log(`[LLM Fallback] Trying ${config.name} (${config.model})...`);
  
  switch (provider) {
    case "forge":
      return await invokeForge(config, params);
    case "anthropic":
      return await invokeAnthropic(config, params);
    case "gemini":
      return await invokeGemini(config, params);
    case "grok":
      return await invokeGrok(config, params);
    case "openai":
      return await invokeOpenAI(config, params);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function invokeLLMWithFallback(params: InvokeParams & { tier?: TaskTier }): Promise<InvokeResult> {
  const tier = params.tier || DEFAULT_TIER;
  const providerOrder = TIER_PROVIDER_ORDER[tier];
  
  const errors: string[] = [];
  
  for (const provider of providerOrder) {
    try {
      const startTime = Date.now();
      const result = await invokeProvider(provider, params, tier);
      const latencyMs = Date.now() - startTime;
      
      console.log(`[LLM Fallback] ✓ ${provider} succeeded in ${latencyMs}ms`);
      
      // Log LLM usage
      const config = getProviderConfig(provider, tier);
      if (config) {
        await logLlmUsage({
          model: config.model,
          operation: "chat_completion",
          latencyMs,
          promptTokens: result.usage?.prompt_tokens || 0,
          completionTokens: result.usage?.completion_tokens || 0,
          totalTokens: result.usage?.total_tokens || 0,
          costUsd: "0.0000", // Cost calculation can be added later
          success: true,
        });
      }
      
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[LLM Fallback] ✗ ${provider} failed:`, errorMessage);
      errors.push(`${provider}: ${errorMessage}`);
      
      // Log failed attempt
      const config = getProviderConfig(provider, tier);
      if (config) {
        await logLlmUsage({
          model: config.model,
          operation: "chat_completion",
          latencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          costUsd: "0.0000",
          success: false,
        });
      }
      
      // Continue to next provider
      continue;
    }
  }
  
  // All providers failed
  throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}
