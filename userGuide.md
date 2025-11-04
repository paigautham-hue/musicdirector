# AI Album Creator - User Guide

**Purpose:** Create complete AI-powered music albums with lyrics, prompts, artwork, and platform-optimized content for Suno, Udio, ElevenLabs, Mubert, and Stable Audio.

**Access:** Login required for album creation and management.

---

## Powered by Manus

**Technology Stack:**
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui components
- **Backend:** Express 4 + tRPC 11 for type-safe APIs
- **Database:** MySQL with Drizzle ORM for robust data management
- **AI:** Multi-LLM ensemble (OpenAI GPT-4, Anthropic Claude, Google Gemini) for album generation and quality scoring
- **Image Generation:** AI-powered artwork creation for album covers and track art
- **Authentication:** Manus OAuth for secure user management
- **Deployment:** Auto-scaling infrastructure with global CDN for instant worldwide access

This cutting-edge stack ensures lightning-fast performance, type safety across the entire application, and intelligent AI-powered content generation.

---

## Using Your Website

### Creating Your First Album

Click "Create Album" from the homepage to start the 4-step wizard:

**Step 1 - Theme & Concept:** Describe your album's theme in one sentence. Choose your language and optionally add a target audience.

**Step 2 - Style & Influences:** Add genres and moods by typing and clicking "Add". Optionally include musical influences for inspiration.

**Step 3 - Platform Selection:** Choose your target platform (Suno AI, Udio, ElevenLabs, Mubert, or Stable Audio). Each platform has different strengths.

**Step 4 - Track Count & Review:** Set the number of tracks (1-20) and review your choices. Click "Create Album" to generate.

The AI will create your complete album with titles, lyrics, prompts, quality scores, and artwork. This takes 1-3 minutes depending on track count.

### Working with Your Album

Click any album in "My Library" to open the workspace. Select a track from the left sidebar to view its prompt, lyrics, structure, and production notes. The "Alternates" tab shows AI-generated variations.

To improve a track, select improvement styles like "more poetic" or "more cinematic" and click "Regenerate with Improvements". The AI will create an enhanced version while preserving the core theme.

Use the platform dropdown to optimize your album for a different service. Click "Export" to download JSON and README files. Click "Share" to copy a shareable link.

---

## Managing Your Website

### Settings Panel

Access the Settings panel from the Management UI to customize your site name and logo. Update these in "General" settings to personalize the branding.

### Database Panel

View and manage all albums, tracks, and user data through the Database panel. Full CRUD operations available with connection details in bottom-left settings.

### Dashboard Panel

Monitor site analytics, user activity, and album statistics. Track UV/PV metrics for published content and manage visibility controls.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Try creating your first album with a theme you're passionate about - the AI will handle the creative heavy lifting while you focus on the vision!
