import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

// Load backend .env variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const geminiKey = process.env.GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const activeProvider = process.env.LLM_PROVIDER || "gemini";

async function testGemini() {
  if (!geminiKey || geminiKey === "your_gemini_api_key_here") {
    console.warn("WARNING: GEMINI_API_KEY is not configured in .env.");
    return false;
  }

  console.log("Connecting to Gemini API using key: ", geminiKey.substring(0, 10) + "...");
  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with exactly one word: 'Authorized'"
    });
    
    const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("  SUCCESS: Your Gemini API Key is working perfectly!");
    console.log("  Response from Model:", text?.trim());
    return true;
  } catch (error: any) {
    console.error("  ERROR: Gemini API Key verification failed!");
    console.error("  Reason:", error.message || JSON.stringify(error));
    return false;
  }
}

async function testGroq() {
  if (!groqKey || groqKey === "your_groq_api_key_here" || groqKey === "") {
    console.warn("WARNING: GROQ_API_KEY is not configured in .env.");
    return false;
  }

  console.log("Connecting to Groq API using key: ", groqKey.substring(0, 10) + "...");
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Respond with exactly one word: 'Authorized'" }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Status ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;
    const text = data.choices?.[0]?.message?.content;
    console.log("  SUCCESS: Your Groq API Key is working perfectly!");
    console.log("  Response from Model:", text?.trim());
    return true;
  } catch (error: any) {
    console.error("  ERROR: Groq API Key verification failed!");
    console.error("  Reason:", error.message || JSON.stringify(error));
    return false;
  }
}

async function runDiagnostics() {
  console.log("=============================================================");
  console.log("  RUNNING API KEY DIAGNOSTICS");
  console.log(`  Active Provider setting: ${activeProvider}`);
  console.log("=============================================================\n");

  const geminiOk = await testGemini();
  console.log("\n-------------------------------------------------------------\n");
  const groqOk = await testGroq();
  console.log("\n=============================================================");
  console.log("  DIAGNOSTICS SUMMARY:");
  console.log(`  - Gemini API Working: ${geminiOk ? "YES" : "NO"}`);
  console.log(`  - Groq API Working: ${groqOk ? "YES" : "NO"}`);
  
  let providerToUse = activeProvider.toLowerCase();
  if (providerToUse === "gemini" && !geminiOk) {
    if (groqOk) providerToUse = "groq (fallback)";
    else providerToUse = "mock agent mode (fallback)";
  } else if (providerToUse === "groq" && !groqOk) {
    if (geminiOk) providerToUse = "gemini (fallback)";
    else providerToUse = "mock agent mode (fallback)";
  } else if (!geminiOk && !groqOk) {
    providerToUse = "mock agent mode";
  }

  console.log(`  - Actual Runtime Model Provider: ${providerToUse.toUpperCase()}`);
  console.log("=============================================================");
}

runDiagnostics();
