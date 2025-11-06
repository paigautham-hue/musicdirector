/**
 * Test script to verify Suno API integration
 * Run with: node test-suno-api.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { systemSettings } from "./drizzle/schema.js";

// Get database connection
const db = drizzle(process.env.DATABASE_URL);

// Get Suno API key from database
const [setting] = await db
  .select()
  .from(systemSettings)
  .where(eq(systemSettings.key, "suno_api_key"))
  .limit(1);

if (!setting || !setting.value) {
  console.error("❌ Suno API key not found in database");
  process.exit(1);
}

const SUNO_API_KEY = setting.value;
const BASE_URL = "https://api.sunoapi.org";

console.log("🔑 Suno API Key found:", SUNO_API_KEY.substring(0, 10) + "...");
console.log("🌐 Base URL:", BASE_URL);
console.log("");

// Test 1: Generate music
console.log("📝 Test 1: Generating music...");
const generateRequest = {
  prompt: "A short upbeat pop song about sunshine",
  style: "pop, upbeat, cheerful",
  title: "Test Song",
  customMode: false,
  instrumental: false,
  model: "V5",
};

console.log("Request:", JSON.stringify(generateRequest, null, 2));

try {
  const generateResponse = await fetch(`${BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUNO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(generateRequest),
  });

  console.log("Response status:", generateResponse.status);
  
  const generateData = await generateResponse.json();
  console.log("Response data:", JSON.stringify(generateData, null, 2));

  if (generateData.code !== 200) {
    console.error("❌ Generation failed:", generateData.msg);
    process.exit(1);
  }

  const taskId = generateData.data.taskId;
  console.log("✅ Music generation started! Task ID:", taskId);
  console.log("");

  // Test 2: Poll for status
  console.log("📊 Test 2: Polling for status...");
  
  for (let i = 0; i < 12; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(
      `${BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SUNO_API_KEY}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    console.log(`Poll ${i + 1}:`, statusData.data.status, statusData.data.progress || 0, "%");

    if (statusData.data.status === "completed") {
      console.log("✅ Music generation completed!");
      console.log("Audio URL:", statusData.data.audioUrl);
      console.log("Duration:", statusData.data.duration, "seconds");
      process.exit(0);
    } else if (statusData.data.status === "failed") {
      console.error("❌ Music generation failed:", statusData.data.error);
      process.exit(1);
    }
  }

  console.log("⏱️  Timeout after 60 seconds (12 polls × 5 seconds)");
  process.exit(1);

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
}
