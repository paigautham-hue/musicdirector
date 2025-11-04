import { invokeLLM } from "./_core/llm";

export interface SafetyCheckResult {
  safe: boolean;
  issues: string[];
  suggestions?: string;
  rewrittenContent?: string;
}

/**
 * Check content for safety issues and provide constructive rewrites
 */
export async function checkContentSafety(content: {
  theme?: string;
  lyrics?: string;
  prompt?: string;
}): Promise<SafetyCheckResult> {
  const textToCheck = [
    content.theme || "",
    content.lyrics || "",
    content.prompt || ""
  ].filter(Boolean).join("\n\n");

  if (!textToCheck.trim()) {
    return { safe: true, issues: [] };
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content safety moderator for a music creation platform. Check content for:
- Hate speech or discrimination
- Sexual content involving minors
- Private data (emails, phone numbers, addresses)
- Explicit calls to violence
- Copyright infringement (direct copying of lyrics/styles)

For spiritual/political themes:
- Allow respectful discussion of ideas
- Flag only hateful or defamatory content
- Encourage "in the spirit of..." descriptors instead of direct artist names

If issues found, provide constructive suggestions for rewriting.`
        },
        {
          role: "user",
          content: `Check this content for safety issues:\n\n${textToCheck}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "safety_check",
          strict: true,
          schema: {
            type: "object",
            properties: {
              safe: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              suggestions: { type: "string" }
            },
            required: ["safe", "issues"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0].message.content;
    const result = JSON.parse(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent));

    // If not safe and we have suggestions, generate a rewrite
    if (!result.safe && result.suggestions) {
      const rewriteResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful content rewriter. Rewrite the content to address safety concerns while preserving the creative intent."
          },
          {
            role: "user",
            content: `Original content:\n${textToCheck}\n\nIssues: ${result.issues.join(", ")}\n\nSuggestions: ${result.suggestions}\n\nPlease rewrite to be safe and compliant.`
          }
        ]
      });

      const rewriteContent = rewriteResponse.choices[0].message.content;
      result.rewrittenContent = typeof rewriteContent === 'string' ? rewriteContent : JSON.stringify(rewriteContent);
    }

    return result;
  } catch (error) {
    console.error("Content safety check failed:", error);
    // Fail open - allow content if check fails
    return { safe: true, issues: [] };
  }
}

/**
 * Platform-specific TOS compliance check
 */
export async function checkPlatformCompliance(
  content: { theme?: string; lyrics?: string; prompt?: string },
  platform: string
): Promise<SafetyCheckResult> {
  const platformPolicies: Record<string, string> = {
    suno: "No copyrighted lyrics, no explicit sexual content, no hate speech",
    udio: "No copyrighted material, no harmful content, respect artist rights",
    elevenlabs: "Instrumental only, no voice cloning without consent",
    mubert: "Background music appropriate for all audiences",
    stable_audio: "No copyrighted samples, respect licensing"
  };

  const policy = platformPolicies[platform] || "General content policy";

  try {
    const textToCheck = [
      content.theme || "",
      content.lyrics || "",
      content.prompt || ""
    ].filter(Boolean).join("\n\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Check if content complies with ${platform} platform policy: ${policy}`
        },
        {
          role: "user",
          content: `Check this content:\n\n${textToCheck}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "compliance_check",
          strict: true,
          schema: {
            type: "object",
            properties: {
              safe: { type: "boolean" },
              issues: { type: "array", items: { type: "string" } },
              suggestions: { type: "string" }
            },
            required: ["safe", "issues"],
            additionalProperties: false
          }
        }
      }
    });

    const messageContent = response.choices[0].message.content;
    return JSON.parse(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent));
  } catch (error) {
    console.error("Platform compliance check failed:", error);
    return { safe: true, issues: [] };
  }
}
