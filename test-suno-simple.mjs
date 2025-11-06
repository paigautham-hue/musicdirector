/**
 * Simple test script to verify Suno API integration
 * Run with: node test-suno-simple.mjs
 */

import mysql from "mysql2/promise";

// Get database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Get Suno API key from database
const [rows] = await connection.execute(
  "SELECT * FROM systemSettings WHERE `key` = 'suno_api_key' LIMIT 1"
);

await connection.end();

if (!rows || rows.length === 0 || !rows[0].value) {
  console.error("❌ Suno API key not found in database");
  process.exit(1);
}

const SUNO_API_KEY = rows[0].value;
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
  callBackUrl: "https://webhook.site/unique-id-here",
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
  console.log("Response headers:", Object.fromEntries(generateResponse.headers.entries()));
  
  const responseText = await generateResponse.text();
  console.log("Response body:", responseText);
  
  let generateData;
  try {
    generateData = JSON.parse(responseText);
  } catch (e) {
    console.error("❌ Failed to parse JSON response");
    process.exit(1);
  }

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
    console.log(`Waiting 5 seconds before poll ${i + 1}...`);
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

    const statusText = await statusResponse.text();
    let statusData;
    try {
      statusData = JSON.parse(statusText);
    } catch (e) {
      console.error("❌ Failed to parse status response:", statusText);
      continue;
    }

    console.log(`Poll ${i + 1}:`, {
      status: statusData.data?.status,
      progress: statusData.data?.progress,
      error: statusData.data?.error
    });

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
  console.log("⚠️  Music generation may still be in progress on Suno's side");
  process.exit(1);

} catch (error) {
  console.error("❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
}
