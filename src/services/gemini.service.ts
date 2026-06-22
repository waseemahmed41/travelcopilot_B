import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private client: any = null;
  private groqApiKey: string | null = null;
  private llmProvider: string = "gemini";
  private initialized: boolean = false;

  private initClients() {
    if (this.initialized) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key_here" && apiKey !== "") {
      try {
        // The @google/genai package uses a standard client
        this.client = new GoogleGenAI({ apiKey });
        console.log("Initialized Gemini API client successfully.");
      } catch (err) {
        console.error("Error initializing GoogleGenAI client:", err);
      }
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey !== "your_groq_api_key_here" && groqKey !== "") {
      this.groqApiKey = groqKey;
      console.log("Initialized Groq API configuration successfully.");
    }

    this.llmProvider = (process.env.LLM_PROVIDER || "gemini").toLowerCase();
    this.initialized = true;

    if (!this.client && !this.groqApiKey) {
      console.warn("Neither GEMINI_API_KEY nor GROQ_API_KEY are configured. Running in Mock Agent Mode.");
    } else {
      console.log(`AI Service loaded. Selected Provider: ${this.llmProvider.toUpperCase()}`);
    }
  }

  /**
   * Generates a structured JSON response from Gemini or Groq
   */
  public async generateJSON<T>(
    systemInstruction: string,
    prompt: string,
    fallbackMockGenerator: () => T
  ): Promise<T> {
    this.initClients();
    let activeProvider = this.llmProvider;

    // Fallback logic if the preferred provider is not configured
    if (activeProvider === "gemini" && !this.client) {
      if (this.groqApiKey) {
        console.log("Gemini API client not configured. Falling back to Groq API.");
        activeProvider = "groq";
      } else {
        activeProvider = "mock";
      }
    } else if (activeProvider === "groq" && !this.groqApiKey) {
      if (this.client) {
        console.log("Groq API key not configured. Falling back to Gemini API.");
        activeProvider = "gemini";
      } else {
        activeProvider = "mock";
      }
    }

    if (activeProvider === "mock") {
      // Simulate network delay and return the high-fidelity mock data
      await new Promise((resolve) => setTimeout(resolve, 800));
      return fallbackMockGenerator();
    }

    if (activeProvider === "groq") {
      return this.generateGroqJSON<T>(systemInstruction, prompt, fallbackMockGenerator);
    }

    // Default to Gemini
    return this.generateGeminiJSON<T>(systemInstruction, prompt, fallbackMockGenerator);
  }

  private async generateGeminiJSON<T>(
    systemInstruction: string,
    prompt: string,
    fallbackMockGenerator: () => T
  ): Promise<T> {
    try {
      // Using gemini-2.5-flash for speed and reliability
      const response = await this.client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nUser request: ${prompt}` }] }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response received from Gemini API");
      }

      return JSON.parse(this.cleanJSONString(text)) as T;
    } catch (error) {
      console.error("Gemini API call failed, trying Groq fallback if available:", error);
      if (this.groqApiKey) {
        return this.generateGroqJSON<T>(systemInstruction, prompt, fallbackMockGenerator);
      }
      return fallbackMockGenerator();
    }
  }

  private async generateGroqJSON<T>(
    systemInstruction: string,
    prompt: string,
    fallbackMockGenerator: () => T
  ): Promise<T> {
    try {
      console.log("Calling Groq API (model: llama-3.3-70b-versatile)...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;
      if (!text) {
        throw new Error("Empty response received from Groq API");
      }

      return JSON.parse(this.cleanJSONString(text)) as T;
    } catch (error) {
      console.error("Groq API call failed, trying Gemini fallback if available:", error);
      if (this.client && this.llmProvider !== "gemini") {
        return this.generateGeminiJSON<T>(systemInstruction, prompt, fallbackMockGenerator);
      }
      return fallbackMockGenerator();
    }
  }

  private cleanJSONString(str: string): string {
    let cleaned = str.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }
}

export const geminiService = new GeminiService();
export default geminiService;
