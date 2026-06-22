import { itineraryAgent, ItineraryResponse } from "./itinerary.agent";
import { budgetAgent, BudgetResponse } from "./budget.agent";
import { hotelAgent, HotelResponse } from "./hotel.agent";
import { localTipsAgent, LocalTipsResponse } from "./localTips.agent";
import { tripHealthAgent, TripHealthResponse } from "./tripHealth.agent";
import geminiService from "../gemini.service";

export interface TravelPlan {
  itinerary: ItineraryResponse[];
  budget: BudgetResponse;
  hotels: HotelResponse;
  localTips: LocalTipsResponse;
  tripHealth: TripHealthResponse;
}

export class PlannerAgent {
  private modifySystemInstruction = `You are the AI Travel Copilot.
You have access to the current travel plan (including day-by-day itinerary, budget breakdown, hotels, local tips, and trip health score).
The user wants to modify their trip (e.g. "add nightlife", "add museums", "reduce budget", "regenerate Day 2").
Modify the itinerary and update the corresponding budget, hotels, tips, and health score if necessary.
You must return the COMPLETE updated travel plan strictly in JSON format. Do not write any explanations or conversational text outside the JSON.
JSON format matching the original structure:
{
  "itinerary": [ ... ],
  "budget": { ... },
  "hotels": { ... },
  "localTips": { ... },
  "tripHealth": { ... }
}`;

  /**
   * Orchestrates the creation of a brand new travel plan
   */
  public async generateTrip(
    destination: string,
    days: number,
    budgetType: "Low" | "Medium" | "High",
    interests: string[],
    travelStyle?: string
  ): Promise<TravelPlan> {
    // 1. Trigger Itinerary, Budget, Hotel, and Local Tips agents in parallel for maximum performance
    const [itinerary, hotels, localTips] = await Promise.all([
      itineraryAgent.generate(destination, days, budgetType, interests, travelStyle),
      hotelAgent.generate(destination),
      localTipsAgent.generate(destination)
    ]);

    // Count total activities to pass to budget agent
    const activitiesCount = itinerary.reduce((sum, day) => sum + day.activities.length, 0);
    const budget = await budgetAgent.generate(destination, days, budgetType, activitiesCount);

    // 2. Perform Trip Health Audit on the combined results
    const tripHealth = await tripHealthAgent.generate(destination, itinerary, budget, hotels, localTips);

    // 3. Return compiled travel plan
    return {
      itinerary,
      budget,
      hotels,
      localTips,
      tripHealth
    };
  }

  /**
   * Modifies an existing travel plan using chat instructions
   */
  public async modifyTrip(
    destination: string,
    currentPlan: TravelPlan,
    chatMessage: string
  ): Promise<TravelPlan> {
    const prompt = `Destination: ${destination}
Current Travel Plan: ${JSON.stringify(currentPlan)}
User Modification Request: ${chatMessage}`;

    return geminiService.generateJSON<TravelPlan>(
      this.modifySystemInstruction,
      prompt,
      () => this.getMockModifiedTrip(destination, currentPlan, chatMessage)
    );
  }

  private getMockModifiedTrip(
    destination: string,
    currentPlan: TravelPlan,
    chatMessage: string
  ): TravelPlan {
    // Clone current plan to avoid mutability side-effects
    const newPlan: TravelPlan = JSON.parse(JSON.stringify(currentPlan));
    const msg = chatMessage.toLowerCase();

    // 1. Handle Nightlife additions
    if (msg.includes("nightlife") || msg.includes("bar") || msg.includes("club") || msg.includes("evening")) {
      // Find Day 2 (or Day 1 if 1-day trip) to add nightlife
      const targetDayIdx = newPlan.itinerary.length >= 2 ? 1 : 0;
      const targetDay = newPlan.itinerary[targetDayIdx];
      
      const hasNightlife = targetDay.activities.some(act => act.activity.toLowerCase().includes("nightlife") || act.activity.toLowerCase().includes("club"));
      if (!hasNightlife) {
        targetDay.activities.push({
          time: "09:30 PM",
          activity: "Local Nightlife Experience",
          description: "Explore highly rated local bars, cocktail lounges, and enjoy the ambient city nightlife.",
          cost: 35,
          duration: "2.5 hours",
          location: "Popular Entertainment Street"
        });
        // Adjust budget
        newPlan.budget.activities.cost += 35;
        newPlan.budget.activities.details += " (Includes nightlife experiences)";
        newPlan.budget.totalEstimate += 35;
        // Adjust health score metrics
        newPlan.tripHealth.metrics.activityDiversity = Math.min(100, newPlan.tripHealth.metrics.activityDiversity + 2);
        newPlan.tripHealth.metrics.walkingFatigue = Math.max(50, newPlan.tripHealth.metrics.walkingFatigue - 5); // Nightlife adds exhaustion
        newPlan.tripHealth.warnings.push("Late night activity added on Day 2; sleep schedules may be affected.");
      }
    }

    // 2. Handle Museum / Culture additions
    if (msg.includes("museum") || msg.includes("gallery") || msg.includes("art") || msg.includes("culture")) {
      const targetDay = newPlan.itinerary[0]; // Add to Day 1
      const hasMuseum = targetDay.activities.some(act => act.activity.toLowerCase().includes("museum") || act.activity.toLowerCase().includes("gallery"));
      if (!hasMuseum) {
        targetDay.activities.push({
          time: "03:30 PM",
          activity: "Boutique Art Gallery & Museum Tour",
          description: "Admire localized history, curated historical collections, and modern art pieces.",
          cost: 15,
          duration: "2 hours",
          location: "Museum District"
        });
        newPlan.budget.activities.cost += 15;
        newPlan.budget.totalEstimate += 15;
        newPlan.tripHealth.metrics.culturalCoverage = Math.min(100, newPlan.tripHealth.metrics.culturalCoverage + 4);
      }
    }

    // 3. Handle Budget Reductions
    if (msg.includes("reduce budget") || msg.includes("cheaper") || msg.includes("lower budget") || msg.includes("save money")) {
      // Reduce flights, hotels, food costs
      newPlan.budget.flights.cost = Math.round(newPlan.budget.flights.cost * 0.85);
      newPlan.budget.hotels.cost = Math.round(newPlan.budget.hotels.cost * 0.75);
      newPlan.budget.hotels.details = `Economical accommodation adjustments: ${newPlan.budget.hotels.details}`;
      newPlan.budget.food.cost = Math.round(newPlan.budget.food.cost * 0.8);
      newPlan.budget.food.details = `Optimized dining choices: ${newPlan.budget.food.details}`;
      
      // Update activities to lower costs
      for (const day of newPlan.itinerary) {
        for (const act of day.activities) {
          if (act.cost > 20) {
            act.cost = Math.round(act.cost * 0.7);
            act.description = `Budget-friendly option: ${act.description}`;
          }
        }
      }

      // Recompute total estimate
      newPlan.budget.totalEstimate = 
        newPlan.budget.flights.cost + 
        newPlan.budget.hotels.cost + 
        newPlan.budget.food.cost + 
        newPlan.budget.activities.cost + 
        newPlan.budget.transport.cost;

      // Adjust health score metrics
      newPlan.tripHealth.metrics.budgetEfficiency = Math.min(100, newPlan.tripHealth.metrics.budgetEfficiency + 8);
      newPlan.tripHealth.suggestions.push("Budget optimized successfully. Opted for affordable dining and accommodation deals.");
    }

    // 4. Handle regenerating specific day
    if (msg.includes("regenerate")) {
      // Extract day number if any, default to Day 1
      let dayToRegen = 1;
      const match = msg.match(/day\s*(\d+)/);
      if (match && match[1]) {
        dayToRegen = parseInt(match[1]);
      }
      const dayIdx = Math.min(newPlan.itinerary.length, Math.max(1, dayToRegen)) - 1;
      newPlan.itinerary[dayIdx].activities = [
        { time: "09:30 AM", activity: `Refreshed morning exploration in ${destination}`, description: "A scenic walking tour of local parks and visual highlights.", cost: 0, duration: "2 hours", location: "Central City" },
        { time: "01:00 PM", activity: "Traditional Culinary Tasting", description: "Indulge in classic local food and artisanal tea or coffee pairings.", cost: 20, duration: "1.5 hours", location: "Food District" },
        { time: "04:00 PM", activity: "Scenic Local Market Walking Tour", description: "Bargain search, souvenir shopping, and checking out local crafts.", cost: 10, duration: "2.5 hours", location: "Market Square" }
      ];
      newPlan.tripHealth.suggestions.push(`Day ${dayToRegen} regenerated with a fresher mix of light walking and dining.`);
    }

    // Always recalculate the overall score as a weighted average of submetrics
    const m = newPlan.tripHealth.metrics;
    newPlan.tripHealth.score = Math.round(
      (m.budgetEfficiency * 0.25) + 
      (m.activityDiversity * 0.2) + 
      (m.walkingFatigue * 0.15) + 
      (m.foodExperience * 0.2) + 
      (m.culturalCoverage * 0.2)
    );

    return newPlan;
  }
}

export const plannerAgent = new PlannerAgent();
export default plannerAgent;
