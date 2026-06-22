import { tripRepository } from "../repositories/trip.repository";
import { itineraryRepository } from "../repositories/itinerary.repository";
import { agentMemoryRepository } from "../repositories/agentMemory.repository";
import { chatHistoryRepository } from "../repositories/chatHistory.repository";
import { plannerAgent, TravelPlan } from "./ai/planner.agent";
import { LRUCache } from "../dsa/lruCache";
import { Trie, getInitializedTrie } from "../dsa/trie";
import { Types } from "mongoose";
import geminiService from "./gemini.service";
import { tripHealthAgent } from "./ai/tripHealth.agent";

// Instantiate the LRU Cache with capacity 20
const tripCache = new LRUCache<string, TravelPlan>(20);

// Initialize Trie for Autocomplete suggestions
const destinationTrie = getInitializedTrie();

export class TripService {
  /**
   * Retrieves destination recommendations matching a search prefix using the Trie structure
   */
  public getAutocompleteSuggestions(prefix: string): string[] {
    if (!prefix) return [];
    return destinationTrie.getSuggestions(prefix, 10);
  }

  /**
   * Generates and saves a travel plan
   */
  public async createTrip(
    userId: string,
    destination: string,
    days: number,
    budgetType: "Low" | "Medium" | "High",
    interests: string[],
    travelStyle?: string
  ): Promise<any> {
    const cacheKey = `${destination.toLowerCase()}_${days}_${budgetType}_${interests.sort().join(",")}_${travelStyle || ""}`;
    
    let plan = tripCache.get(cacheKey);
    let isFromCache = false;

    if (plan) {
      console.log("LRU Cache hit for key:", cacheKey);
      isFromCache = true;
    } else {
      console.log("LRU Cache miss. Generating via custom Multi-Agent system...");
      plan = await plannerAgent.generateTrip(destination, days, budgetType, interests, travelStyle);
      // Cache the generated plan
      tripCache.put(cacheKey, plan);
    }

    // Save metadata to MongoDB
    const trip = await tripRepository.create({
      userId: new Types.ObjectId(userId),
      destination,
      days,
      budgetType,
      interests,
      travelStyle,
      tripHealthScore: plan.tripHealth.score
    });

    const tripIdStr = trip._id.toString();

    // Save day-by-day itineraries
    for (const day of plan.itinerary) {
      await itineraryRepository.upsertDay(tripIdStr, day.dayNumber, day.activities);
    }

    // Save agent memories in DB
    await agentMemoryRepository.upsertMemory(tripIdStr, "ItineraryAgent", plan.itinerary);
    await agentMemoryRepository.upsertMemory(tripIdStr, "BudgetAgent", plan.budget);
    await agentMemoryRepository.upsertMemory(tripIdStr, "HotelAgent", plan.hotels);
    await agentMemoryRepository.upsertMemory(tripIdStr, "LocalTipsAgent", plan.localTips);
    await agentMemoryRepository.upsertMemory(tripIdStr, "TripHealthAgent", plan.tripHealth);

    // Initial greeting chat history entry
    await chatHistoryRepository.addMessage(
      tripIdStr,
      "model",
      `Hello! I am your AI Travel Copilot. I've successfully mapped out a ${days}-day plan to ${destination} optimized for a ${budgetType} budget. How can I adjust your schedule today?`
    );

    return {
      trip,
      plan,
      isFromCache
    };
  }

  /**
   * Retrieves a full TravelPlan by assembling MongoDB records
   */
  public async getTripDetails(tripId: string): Promise<any> {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }

    const itineraries = await itineraryRepository.findByTripId(tripId);
    const memories = await agentMemoryRepository.findByTripId(tripId);

    // Reconstruct the TravelPlan object
    const itinerary = itineraries.map(item => ({
      dayNumber: item.dayNumber,
      activities: item.activities
    }));

    const budget = memories.find(m => m.agentName === "BudgetAgent")?.response;
    const hotels = memories.find(m => m.agentName === "HotelAgent")?.response;
    const localTips = memories.find(m => m.agentName === "LocalTipsAgent")?.response;
    const tripHealth = memories.find(m => m.agentName === "TripHealthAgent")?.response;

    const chatHistory = await chatHistoryRepository.findByTripId(tripId);

    return {
      trip,
      plan: {
        itinerary,
        budget,
        hotels,
        localTips,
        tripHealth
      },
      chatHistory
    };
  }

  /**
   * Lists trips for a user
   */
  public async listTrips(userId: string, limit = 10, skip = 0): Promise<any> {
    const trips = await tripRepository.findByUser(userId, limit, skip);
    const total = await tripRepository.countByUser(userId);
    return { trips, total, limit, skip };
  }

  /**
   * Modifies an itinerary using the AI chat Copilot
   */
  public async modifyTripItinerary(tripId: string, message: string): Promise<any> {
    const trip = await tripRepository.findById(tripId);
    if (!trip) {
      throw new Error("Trip not found");
    }

    const currentPlanDetails = await this.getTripDetails(tripId);
    const currentPlan: TravelPlan = currentPlanDetails.plan;

    // 1. Record User Message in Chat History
    await chatHistoryRepository.addMessage(tripId, "user", message);

    // 2. Delegate modification command to Planner Agent
    const updatedPlan = await plannerAgent.modifyTrip(trip.destination, currentPlan, message);

    const tripIdStr = trip._id.toString();

    // 3. Persist Updated Plans in Database
    // Update itinerary day collections
    for (const day of updatedPlan.itinerary) {
      await itineraryRepository.upsertDay(tripIdStr, day.dayNumber, day.activities);
    }

    // Update Agent Memories
    await agentMemoryRepository.upsertMemory(tripIdStr, "ItineraryAgent", updatedPlan.itinerary);
    await agentMemoryRepository.upsertMemory(tripIdStr, "BudgetAgent", updatedPlan.budget);
    await agentMemoryRepository.upsertMemory(tripIdStr, "HotelAgent", updatedPlan.hotels);
    await agentMemoryRepository.upsertMemory(tripIdStr, "LocalTipsAgent", updatedPlan.localTips);
    await agentMemoryRepository.upsertMemory(tripIdStr, "TripHealthAgent", updatedPlan.tripHealth);

    // Update Trip Health Score metadata
    await tripRepository.updateHealthScore(tripIdStr, updatedPlan.tripHealth.score);

    // Calculate response feedback message from AI
    let aiResponseMsg = `I've successfully updated your trip. The overall Trip Health Score is now ${updatedPlan.tripHealth.score}/100.`;
    if (message.toLowerCase().includes("nightlife")) {
      aiResponseMsg = `I've added exciting nightlife options to your itinerary, adjusting your activity variety index to ${updatedPlan.tripHealth.metrics.activityDiversity}/100 and updating the budget. Let me know if you want to modify other days!`;
    } else if (message.toLowerCase().includes("reduce budget") || message.toLowerCase().includes("cheaper")) {
      aiResponseMsg = `I've optimized your transport, dining, and hotel choices to match a tighter budget, reducing your total estimation to $${updatedPlan.budget.totalEstimate} USD.`;
    } else if (message.toLowerCase().includes("museum")) {
      aiResponseMsg = `I've added scenic museum tours to your schedule. Check out the updated itinerary!`;
    }

    // Record AI Response in Chat History
    await chatHistoryRepository.addMessage(tripId, "model", aiResponseMsg);

    return {
      trip: {
        ...trip.toObject(),
        tripHealthScore: updatedPlan.tripHealth.score
      },
      plan: updatedPlan,
      chatHistory: await chatHistoryRepository.findByTripId(tripId)
    };
  }

  /**
   * Manually adds a custom activity to a specific day in the itinerary
   */
  public async addActivity(
    tripId: string,
    dayNumber: number,
    activity: any
  ): Promise<any> {
    const itineraries = await itineraryRepository.findByTripId(tripId);
    let dayItin = itineraries.find(i => i.dayNumber === dayNumber);
    if (!dayItin) {
      dayItin = await itineraryRepository.upsertDay(tripId, dayNumber, [activity]);
    } else {
      dayItin.activities.push(activity);
      await dayItin.save();
    }
    
    // Recalculate health and budget metrics
    return this.recalculateTripStats(tripId);
  }

  /**
   * Manually deletes an activity from a specific day
   */
  public async deleteActivity(
    tripId: string,
    dayNumber: number,
    activityIndex: number
  ): Promise<any> {
    const itineraries = await itineraryRepository.findByTripId(tripId);
    const dayItin = itineraries.find(i => i.dayNumber === dayNumber);
    if (!dayItin) {
      throw new Error("Day itinerary not found");
    }

    if (activityIndex < 0 || activityIndex >= dayItin.activities.length) {
      throw new Error("Invalid activity index");
    }

    dayItin.activities.splice(activityIndex, 1);
    await dayItin.save();

    // Recalculate stats
    return this.recalculateTripStats(tripId);
  }

  /**
   * Regenerates a single day's itinerary using AI agent prompts
   */
  public async regenerateDay(
    tripId: string,
    dayNumber: number,
    instruction?: string
  ): Promise<any> {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw new Error("Trip not found");

    const currentDetails = await this.getTripDetails(tripId);
    
    const systemPrompt = `You are a professional travel planner. Regenerate Day ${dayNumber} of the itinerary.
Apply the user's specific request: "${instruction || "Regenerate with a fresh list of engaging activities"}".
Keep the formatting consistent with Day ${dayNumber}. Provide 3-4 structured activities.
Return strictly as a JSON object matching this schema:
{
  "dayNumber": ${dayNumber},
  "activities": [
    {
      "time": "09:00 AM",
      "activity": "Activity Name",
      "description": "Short description.",
      "cost": 15,
      "duration": "2 hours",
      "location": "Location"
    }
  ]
}`;

    const userPrompt = `Destination: ${trip.destination}
Total Days: ${trip.days}
Interests: ${trip.interests.join(", ")}
Current Itinerary Day ${dayNumber} state: ${JSON.stringify(currentDetails.plan.itinerary.find((d: any) => d.dayNumber === dayNumber))}`;

    const regeneratedDay = await geminiService.generateJSON<any>(
      systemPrompt,
      userPrompt,
      () => {
        // Mock fallback for day regeneration
        return {
          dayNumber,
          activities: [
            { time: "09:30 AM", activity: `AI Optimized Morning in ${trip.destination}`, description: `Enjoy a customized sightseeing walk matching: ${instruction || "leisure highlights"}.`, cost: 0, duration: "2 hours", location: "Downtown" },
            { time: "01:00 PM", activity: "Traditional Lunch & Tea Pairing", description: "Taste highly-rated regional dishes at a popular local venue.", cost: 20, duration: "1.5 hours", location: "Culinary Center" },
            { time: "04:30 PM", activity: `Interactive Custom Excursion`, description: `Specialized day detail focusing on: ${instruction || "local culture"}.`, cost: 15, duration: "2.5 hours", location: "Highlights Spot" }
          ]
        };
      }
    );

    // Save regenerated day
    await itineraryRepository.upsertDay(tripId, dayNumber, regeneratedDay.activities);

    // Recalculate stats
    return this.recalculateTripStats(tripId);
  }

  /**
   * Re-evaluates costs, budgets, and health scores for a trip
   */
  private async recalculateTripStats(tripId: string): Promise<any> {
    const trip = await tripRepository.findById(tripId);
    if (!trip) throw new Error("Trip not found");

    const itineraries = await itineraryRepository.findByTripId(tripId);
    const dayWiseItinerary = itineraries.map(item => ({
      dayNumber: item.dayNumber,
      activities: item.activities
    }));

    // Recalculate activities cost in budget
    const memories = await agentMemoryRepository.findByTripId(tripId);
    const budgetMemory = memories.find(m => m.agentName === "BudgetAgent");
    const budget = budgetMemory?.response;
    
    if (budget) {
      let activitiesCost = 0;
      dayWiseItinerary.forEach(day => {
        day.activities.forEach(act => {
          activitiesCost += act.cost;
        });
      });
      budget.activities.cost = activitiesCost;
      budget.totalEstimate = 
        budget.flights.cost + 
        budget.hotels.cost + 
        budget.food.cost + 
        activitiesCost + 
        budget.transport.cost;

      await agentMemoryRepository.upsertMemory(tripId, "BudgetAgent", budget);
    }

    const hotels = memories.find(m => m.agentName === "HotelAgent")?.response;
    const localTips = memories.find(m => m.agentName === "LocalTipsAgent")?.response;

    // Audit with TripHealthAgent
    const tripHealth = await tripHealthAgent.generate(
      trip.destination,
      dayWiseItinerary,
      budget,
      hotels,
      localTips
    );

    await agentMemoryRepository.upsertMemory(tripId, "TripHealthAgent", tripHealth);
    await tripRepository.updateHealthScore(tripId, tripHealth.score);

    return this.getTripDetails(tripId);
  }

  /**
   * Deletes a trip
   */
  public async deleteTrip(tripId: string): Promise<void> {
    await tripRepository.delete(tripId);
    await itineraryRepository.deleteByTripId(tripId);
    await agentMemoryRepository.deleteByTripId(tripId);
    await chatHistoryRepository.deleteByTripId(tripId);
  }
}

export const tripService = new TripService();
export default tripService;
