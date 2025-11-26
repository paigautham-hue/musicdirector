import { invokeLLM } from "./_core/llm";

export interface TrackBlueprint {
  trackIndex: number;
  angle: string;
  perspective: string;
  emotion: string;
  focus: string;
  narrativeRole?: string;
  question?: string;
  tempoSuggestion?: string;
  energyLevel?: string;
}

export interface BlueprintGenerationResult {
  strategy: "question_framework" | "narrative_arc" | "facet_perspective";
  blueprints: TrackBlueprint[];
  strategyDescription: string;
}

/**
 * Generate track blueprints for an album using hybrid strategy selection
 * - 5-7 tracks: Question Framework
 * - 8-10 tracks: Narrative Arc
 * - 10+ tracks: Facet Approach + Perspective Wheel
 */
export async function generateTrackBlueprints(
  theme: string,
  trackCount: number,
  vibe: string[],
  influences?: string[]
): Promise<BlueprintGenerationResult> {
  // Select strategy based on track count
  let strategy: "question_framework" | "narrative_arc" | "facet_perspective";
  let strategyDescription: string;

  if (trackCount <= 7) {
    strategy = "question_framework";
    strategyDescription = "Question Framework - Each track answers a different question about the theme";
  } else if (trackCount <= 10) {
    strategy = "narrative_arc";
    strategyDescription = "Narrative Arc - Album tells a story with beginning, middle, and end";
  } else {
    strategy = "facet_perspective";
    strategyDescription = "Facet + Perspective - Each track explores different dimensions and viewpoints";
  }

  // Generate blueprints using LLM
  const blueprints = await generateBlueprintsWithLLM(theme, trackCount, vibe, influences, strategy);

  return {
    strategy,
    blueprints,
    strategyDescription
  };
}

async function generateBlueprintsWithLLM(
  theme: string,
  trackCount: number,
  vibe: string[],
  influences: string[] | undefined,
  strategy: "question_framework" | "narrative_arc" | "facet_perspective"
): Promise<TrackBlueprint[]> {
  const strategyInstructions = getStrategyInstructions(strategy, trackCount);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert album curator and narrative designer. Your job is to create a blueprint for each track in an album that ensures MAXIMUM LYRICAL AND CONCEPTUAL DIVERSITY while maintaining thematic unity.

Key principles:
- Each track must explore a DIFFERENT aspect, angle, or perspective of the theme
- NO TWO TRACKS should say the same thing or have similar messaging
- Tracks should feel like different chapters, questions, or viewpoints
- Maintain thematic coherence while maximizing variety

${strategyInstructions}`
      },
      {
        role: "user",
        content: `Create track blueprints for an album with these details:

Theme: ${theme}
Vibe/Genres: ${vibe.join(", ")}
${influences?.length ? `Influences: ${influences.join(", ")}` : ""}
Track Count: ${trackCount}
Strategy: ${strategy}

Generate a unique blueprint for each of the ${trackCount} tracks. Each blueprint should specify:
1. angle: The specific angle/aspect of the theme this track explores (be very specific and different from other tracks)
2. perspective: Whose viewpoint/voice (first-person, observer, character, etc.)
3. emotion: Primary emotional tone (different for each track)
4. focus: What specifically this track is about (must be unique)
${strategy === "narrative_arc" ? "5. narrativeRole: Story beat (e.g., 'Opening', 'Rising action', 'Crisis', 'Resolution')" : ""}
${strategy === "question_framework" ? "5. question: The specific question this track answers about the theme" : ""}
6. tempoSuggestion: Suggested tempo range (vary across tracks: slow/medium/fast)
7. energyLevel: Energy level (vary: low/medium/high/intense)

CRITICAL: Ensure each track explores a COMPLETELY DIFFERENT facet of the theme. No repetition in messaging or content.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "track_blueprints",
        strict: true,
        schema: {
          type: "object",
          properties: {
            blueprints: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trackIndex: { type: "number" },
                  angle: { type: "string" },
                  perspective: { type: "string" },
                  emotion: { type: "string" },
                  focus: { type: "string" },
                  narrativeRole: { type: "string" },
                  question: { type: "string" },
                  tempoSuggestion: { type: "string" },
                  energyLevel: { type: "string" }
                },
                required: ["trackIndex", "angle", "perspective", "emotion", "focus", "tempoSuggestion", "energyLevel"],
                additionalProperties: false
              }
            }
          },
          required: ["blueprints"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return result.blueprints;
}

function getStrategyInstructions(
  strategy: "question_framework" | "narrative_arc" | "facet_perspective",
  trackCount: number
): string {
  switch (strategy) {
    case "question_framework":
      return `QUESTION FRAMEWORK STRATEGY (${trackCount} tracks):
Each track should answer a DIFFERENT question about the theme. Examples:
- What is [theme]? (Definition/essence)
- When did [theme] begin? (Origin story)
- Why does [theme] matter? (Significance)
- Where does [theme] lead? (Future/consequences)
- Who experiences [theme]? (Personal story)
- How do we [theme]? (Process/method)
- Can [theme] change? (Possibility/hope)

Ensure each track asks and answers a UNIQUE question that hasn't been explored by other tracks.`;

    case "narrative_arc":
      return `NARRATIVE ARC STRATEGY (${trackCount} tracks):
The album tells a complete story with clear progression. Structure the tracks as story beats:
- Opening/Setup (tracks 1-2): Introduce the world, character, or situation
- Rising Action (tracks 3-4): Complications, challenges, conflicts emerge
- Midpoint/Crisis (tracks 5-6): Major turning point, everything changes
- Climax (tracks 7-8): Peak tension, confrontation, revelation
- Resolution/Denouement (tracks 9-${trackCount}): Aftermath, new understanding, closure

Each track should be a distinct SCENE or CHAPTER in the story, not just restating the theme.`;

    case "facet_perspective":
      return `FACET + PERSPECTIVE STRATEGY (${trackCount} tracks):
Combine two approaches for maximum diversity:

1. FACET APPROACH: Each track explores a different dimension of the theme:
   - Cause/origin
   - Effect/consequence
   - Personal experience
   - Societal impact
   - Emotional dimension
   - Philosophical angle
   - Historical context
   - Future implications
   - Opposition/conflict
   - Resolution/hope

2. PERSPECTIVE WHEEL: Rotate through different viewpoints:
   - Individual experiencing it firsthand
   - Observer watching from outside
   - Victim/affected party
   - Perpetrator/cause
   - Helper/healer
   - Skeptic/critic
   - Advocate/believer
   - Future generation looking back

Ensure each track combines a UNIQUE facet with a UNIQUE perspective.`;

    default:
      return "";
  }
}
