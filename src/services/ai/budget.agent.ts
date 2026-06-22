import geminiService from "../gemini.service";

export interface CostDetail {
  cost: number;
  details: string;
}

export interface BudgetResponse {
  flights: CostDetail;
  hotels: CostDetail;
  food: CostDetail;
  activities: CostDetail;
  transport: CostDetail;
  currency: string;
  totalEstimate: number;
}

export class BudgetAgent {
  private systemInstruction = `You are an expert travel budget estimator.
Calculate detailed budget estimations for the given destination, total number of days, budget level, and activities.
Provide specific estimates (cost in USD and detail comments) for:
1. flights (average cost)
2. hotels (cost per night / total)
3. food (average daily cost / total)
4. activities (total entry tickets, etc.)
5. transport (local metro/taxi daily costs / total)
Also output the overall currency ("USD") and calculate the totalEstimate sum.
You must respond strictly with a valid JSON object. Do not include any extra markdown formatting or text outside the JSON.
JSON format:
{
  "flights": { "cost": 500, "details": "Round trip average ticket price" },
  "hotels": { "cost": 300, "details": "75 USD/night for 4 nights" },
  "food": { "cost": 160, "details": "40 USD/day for food and drinks" },
  "activities": { "cost": 80, "details": "Museum entry tickets and guides" },
  "transport": { "cost": 40, "details": "Metro card and occasional taxi" },
  "currency": "USD",
  "totalEstimate": 1080
}`;

  public async generate(
    destination: string,
    days: number,
    budgetType: "Low" | "Medium" | "High",
    activitiesCount: number
  ): Promise<BudgetResponse> {
    const prompt = `Destination: ${destination}
Days: ${days}
Budget Class: ${budgetType}
Activities Count: ${activitiesCount}`;

    return geminiService.generateJSON<BudgetResponse>(
      this.systemInstruction,
      prompt,
      () => this.getMockBudget(destination, days, budgetType)
    );
  }

  private getMockBudget(
    destination: string,
    days: number,
    budgetType: string
  ): BudgetResponse {
    const destLower = destination.toLowerCase();
    
    // Custom multiplier based on budget tiers
    let flightMultiplier = 1;
    let hotelPerNight = 120;
    let foodPerDay = 50;
    let activityPerDay = 30;
    let transportPerDay = 15;

    if (budgetType === "Low") {
      flightMultiplier = 0.7;
      hotelPerNight = 45;
      foodPerDay = 25;
      activityPerDay = 10;
      transportPerDay = 8;
    } else if (budgetType === "High") {
      flightMultiplier = 1.8;
      hotelPerNight = 350;
      foodPerDay = 120;
      activityPerDay = 80;
      transportPerDay = 45;
    }

    // Adjust values depending on destination premium
    let destinationFactor = 1.0;
    if (destLower.includes("tokyo") || destLower.includes("paris") || destLower.includes("switzerland") || destLower.includes("new york")) {
      destinationFactor = 1.3;
    } else if (destLower.includes("bali") || destLower.includes("cairo") || destLower.includes("bangkok")) {
      destinationFactor = 0.6;
    }

    const flightCost = Math.round(550 * flightMultiplier * destinationFactor);
    const hotelCost = Math.round(hotelPerNight * (days - 1) * destinationFactor);
    const foodCost = Math.round(foodPerDay * days * destinationFactor);
    const activityCost = Math.round(activityPerDay * days * destinationFactor);
    const transportCost = Math.round(transportPerDay * days * destinationFactor);
    const totalEstimate = flightCost + hotelCost + foodCost + activityCost + transportCost;

    return {
      flights: {
        cost: flightCost,
        details: `Average roundtrip flight estimation for a ${budgetType} budget traveler.`
      },
      hotels: {
        cost: hotelCost,
        details: `${budgetType === "High" ? "Premium 5-star" : budgetType === "Medium" ? "3-star comfortable hotel" : "Budget hostel/hostel room"} priced at $${Math.round(hotelPerNight * destinationFactor)}/night for ${days - 1} nights.`
      },
      food: {
        cost: foodCost,
        details: `Dining costs calculated at $${Math.round(foodPerDay * destinationFactor)}/day for ${days} days.`
      },
      activities: {
        cost: activityCost,
        details: `Excursions, museum admissions, and local event passes.`
      },
      transport: {
        cost: transportCost,
        details: `Local transit: ${budgetType === "High" ? "Private cars/taxis" : "Public metro, trains, and passes"}.`
      },
      currency: "USD",
      totalEstimate
    };
  }
}

export const budgetAgent = new BudgetAgent();
export default budgetAgent;
