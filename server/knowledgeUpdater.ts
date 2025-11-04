import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import { PLATFORM_ADAPTERS } from "./adapters";

/**
 * Weekly knowledge hub update job
 * Fetches latest platform updates and best practices
 */
export async function updateKnowledgeHub() {
  console.log("🔄 Starting weekly knowledge hub update...");

  for (const [platformKey, adapter] of Object.entries(PLATFORM_ADAPTERS)) {
    try {
      console.log(`Updating knowledge for ${adapter.displayName}...`);

      // Use LLM to research latest platform updates
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a music technology researcher. Research the latest updates, features, and best practices for ${adapter.displayName} music generation platform.`
          },
          {
            role: "user",
            content: `What are the latest updates, new features, constraint changes, and best practices for ${adapter.displayName} as of ${new Date().toISOString().split('T')[0]}? Focus on practical tips for music creators.`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "platform_update",
            strict: true,
            schema: {
              type: "object",
              properties: {
                updates: {
                  type: "array",
                  items: { type: "string" }
                },
                newFeatures: {
                  type: "array",
                  items: { type: "string" }
                },
                bestPractices: {
                  type: "array",
                  items: { type: "string" }
                },
                constraintChanges: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["updates", "newFeatures", "bestPractices", "constraintChanges"],
              additionalProperties: false
            }
          }
        }
      });

      const messageContent = response.choices[0].message.content;
      const updateData = JSON.parse(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent));

      // Save to knowledge_updates table
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
      weekStart.setHours(0, 0, 0, 0);
      
      const contentMd = `# ${adapter.displayName} Weekly Update\n\n## New Features\n${updateData.newFeatures.map((f: string) => `- ${f}`).join('\n')}\n\n## Updates\n${updateData.updates.map((u: string) => `- ${u}`).join('\n')}\n\n## Best Practices\n${updateData.bestPractices.map((p: string) => `- ${p}`).join('\n')}\n\n## Constraint Changes\n${updateData.constraintChanges.map((c: string) => `- ${c}`).join('\n')}`;
      
      await db.createKnowledgeUpdate({
        weekStart,
        contentMd,
        status: "published",
        sources: JSON.stringify(["llm_research", platformKey])
      });

      console.log(`✅ Updated knowledge for ${adapter.displayName}`);
    } catch (error) {
      console.error(`❌ Failed to update ${adapter.displayName}:`, error);
    }
  }

  console.log("✨ Knowledge hub update complete!");
}

/**
 * Schedule weekly updates (runs every Sunday at midnight)
 * In production, this would be triggered by a cron job or scheduled task
 */
export function scheduleKnowledgeUpdates() {
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  
  // Calculate next Sunday midnight
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(0, 0, 0, 0);
  
  const timeUntilNextRun = nextSunday.getTime() - now.getTime();
  
  console.log(`📅 Next knowledge update scheduled for: ${nextSunday.toISOString()}`);
  
  // Run first update
  setTimeout(() => {
    updateKnowledgeHub();
    
    // Then run weekly
    setInterval(updateKnowledgeHub, ONE_WEEK);
  }, timeUntilNextRun);
}

// Auto-start scheduler if running as main module
if (require.main === module) {
  updateKnowledgeHub().then(() => {
    console.log("Manual knowledge update complete");
    process.exit(0);
  }).catch((error) => {
    console.error("Knowledge update failed:", error);
    process.exit(1);
  });
}
