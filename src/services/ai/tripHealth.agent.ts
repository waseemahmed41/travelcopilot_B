import geminiService from "../gemini.service";

export interface HealthMetrics {
  budgetEfficiency: number;
  activityDiversity: number;
  walkingFatigue: number;
  foodExperience: number;
  culturalCoverage: number;
}

export interface TripHealthResponse {
  score: number;
  suggestions: string[];
  warnings: string[];
  metrics: HealthMetrics;
}

export class TripHealthAgent {
  private systemInstruction = `You are a travel health and schedule auditor.
Analyze the complete travel itinerary, budget estimation, hotel recommendations, and local tips for a trip.
Calculate a balanced assessment:
1. score (an overall Trip Health Score from 0 to 100 representing how well-balanced, safe, and efficient the trip is)
2. suggestions (actionable tips to improve the schedule, e.g. adding rest breaks or purchase discount cards)
3. warnings (alerts about physical fatigue, high cost areas, or tight connection gaps)
4. metrics (individual scores 0-100 for: budgetEfficiency, activityDiversity, walkingFatigue (high means less tired/well spaced), foodExperience, culturalCoverage)
You must respond strictly with a valid JSON object. Do not include any extra text.
JSON format:
{
  "score": 90,
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "warnings": ["Warning 1"],
  "metrics": {
    "budgetEfficiency": 95,
    "activityDiversity": 88,
    "walkingFatigue": 80,
    "foodExperience": 92,
    "culturalCoverage": 95
  }
}`;

  public async generate(
    destination: string,
    itineraryData: any,
    budgetData: any,
    hotelsData: any,
    tipsData: any
  ): Promise<TripHealthResponse> {
    const prompt = `Destination: ${destination}
Itinerary Details: ${JSON.stringify(itineraryData)}
Budget Details: ${JSON.stringify(budgetData)}
Hotels Details: ${JSON.stringify(hotelsData)}
Local Tips Details: ${JSON.stringify(tipsData)}`;

    return geminiService.generateJSON<TripHealthResponse>(
      this.systemInstruction,
      prompt,
      () => this.getMockHealth(destination, itineraryData, budgetData)
    );
  }

  private getMockHealth(
    destination: string,
    itineraryData: any[],
    budgetData: any
  ): TripHealthResponse {
    const destLower = destination.toLowerCase();

    // Default calculations
    let score = 92;
    let suggestions = [
      "Buy a multi-day regional travel card upon arrival to save on local transit costs.",
      "Add a 2-hour rest break in the mid-afternoon of Day 2 or 3 to avoid walking fatigue."
    ];
    let warnings: string[] = [];

    const metrics: HealthMetrics = {
      budgetEfficiency: 90,
      activityDiversity: 88,
      walkingFatigue: 85,
      foodExperience: 92,
      culturalCoverage: 95
    };

    if (destLower.includes("tokyo")) {
      score = 94;
      suggestions = [
        "Purchase a Tokyo Subway 72-Hour ticket at Haneda/Narita airport for unlimited Tokyo Metro rides at a huge discount.",
        "Eat lunch early (around 11:30 AM) to avoid long lunchtime lines at popular sushi and ramen spots.",
        "Consider scheduling a relaxed coffee shop afternoon on Day 3 to combat high walking fatigue."
      ];
      warnings = [
        "Day 2 has multiple walking-heavy locations (Yoyogi Park to Shibuya). You are likely to log over 18,000 steps; wear comfortable shoes.",
        "Roppongi bar tout warning: Stay alert to street solicitors during your night dining activities."
      ];
      metrics.budgetEfficiency = 92;
      metrics.activityDiversity = 95;
      metrics.walkingFatigue = 78;
      metrics.foodExperience = 98;
      metrics.culturalCoverage = 94;
    } else if (destLower.includes("paris")) {
      score = 91;
      suggestions = [
        "Book Louvre Museum entry tickets at least 2 weeks in advance; standard slots sell out quickly.",
        "Consider buying a Museum Pass if you plan to visit more than 4 major cultural sites during the trip.",
        "Try to get fresh croissants at small local boulangeries rather than chain bakeries for an authentic experience."
      ];
      warnings = [
        "Watch out for active pickpockets around Eiffel Tower, Louvre, and aboard Metro Line 1.",
        "Climbing the Arc de Triomphe stairs and walking through the Louvre on the same day can be highly demanding physically."
      ];
      metrics.budgetEfficiency = 85;
      metrics.activityDiversity = 92;
      metrics.walkingFatigue = 75;
      metrics.foodExperience = 95;
      metrics.culturalCoverage = 98;
    }

    return {
      score,
      suggestions,
      warnings,
      metrics
    };
  }
}

export const tripHealthAgent = new TripHealthAgent();
export default tripHealthAgent;
