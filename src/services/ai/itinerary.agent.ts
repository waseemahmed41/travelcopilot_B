import geminiService from "../gemini.service";
import { IActivity } from "../../models/Itinerary";

export interface ItineraryResponse {
  dayNumber: number;
  activities: IActivity[];
}

export class ItineraryAgent {
  private systemInstruction = `You are a professional travel itinerary planner. 
Generate a day-by-day travel itinerary for the given destination, total number of days, budget level, interest tags, and travel style (e.g. Solo, Couple, Family, Friends, Business). Customize the pacing and choices of activities based on the travel style (for example, couple trips should be romantic, family trips should have child-friendly pacing, solo trips should have social or self-exploratory elements, business trips should feature light networking or coworking slots).
For each day, provide a structured list of 3-4 activities with specific start times (e.g. "09:00 AM", "01:30 PM", "06:00 PM"), duration (e.g. "2 hours", "3 hours"), approximate cost (in USD), brief activity title, description, and location.
You must respond strictly with a valid JSON array of objects representing days. Do not include any extra text outside the JSON.
JSON format:
[
  {
    "dayNumber": 1,
    "activities": [
      {
        "time": "09:00 AM",
        "activity": "Activity Name",
        "description": "Short description of the activity.",
        "cost": 25,
        "duration": "2 hours",
        "location": "Specific location"
      }
    ]
  }
]`;

  public async generate(
    destination: string,
    days: number,
    budgetType: "Low" | "Medium" | "High",
    interests: string[],
    travelStyle?: string
  ): Promise<ItineraryResponse[]> {
    const prompt = `Destination: ${destination}
Days: ${days}
Budget: ${budgetType}
Interests: ${interests.join(", ")}
${travelStyle ? `Travel Style: ${travelStyle}` : ""}`;

    try {
      const response = await geminiService.generateJSON<any>(
        this.systemInstruction,
        prompt,
        () => this.getMockItinerary(destination, days, budgetType, interests)
      );

      return this.normalizeResponse(response, days, destination, () =>
        this.getMockItinerary(destination, days, budgetType, interests)
      );
    } catch (err) {
      console.error("Error in ItineraryAgent.generate, falling back to mock:", err);
      return this.getMockItinerary(destination, days, budgetType, interests);
    }
  }

  private normalizeResponse(
    raw: any,
    requestedDays: number,
    destination: string,
    fallback: () => ItineraryResponse[]
  ): ItineraryResponse[] {
    if (!raw || typeof raw !== "object") {
      console.warn("Raw LLM response is not an object or array. Falling back.");
      return fallback();
    }

    let arrayData: any[] | null = null;

    if (Array.isArray(raw)) {
      arrayData = raw;
    } else {
      // It's a wrapped object. Order of preference for key names.
      const preferredKeys = ["days", "itinerary", "plan", "activities"];
      for (const key of preferredKeys) {
        if (Array.isArray(raw[key])) {
          arrayData = raw[key];
          console.log(`Normalizing: extracted array from key "${key}"`);
          break;
        }
      }

      if (!arrayData) {
        const fallbackKey = Object.keys(raw).find((key) => Array.isArray(raw[key]));
        if (fallbackKey) {
          arrayData = raw[fallbackKey];
          console.log(`Normalizing: extracted array from fallback key "${fallbackKey}"`);
        }
      }
    }

    if (!arrayData || arrayData.length === 0) {
      // If it's a single day object directly rather than an array
      if ("dayNumber" in raw || "activities" in raw || "day" in raw) {
        arrayData = [raw];
      } else {
        console.warn("Could not extract any array or day object from response. Falling back.");
        return fallback();
      }
    }

    // Determine if the items in arrayData are Day objects or flat Activity objects
    const firstItem = arrayData[0];
    const isDayObject =
      firstItem &&
      (Array.isArray(firstItem.activities) ||
        firstItem.dayNumber !== undefined ||
        firstItem.day !== undefined);

    if (isDayObject) {
      // Map to ItineraryResponse[]
      return arrayData.map((item: any, idx: number) => {
        const dayNum = Number(item.dayNumber || item.day || idx + 1);
        const activities = Array.isArray(item.activities) ? item.activities : [];
        return {
          dayNumber: dayNum,
          activities: activities.map((act: any) => ({
            time: act.time || "09:00 AM",
            activity: act.activity || "Explore",
            description: act.description || "",
            cost: typeof act.cost === "number" ? act.cost : parseFloat(act.cost) || 0,
            duration: act.duration || "2 hours",
            location: act.location || destination
          }))
        };
      });
    } else {
      // They are flat activities. We need to group them.
      console.log("Normalizing: Detected flat activities. Grouping them by day...");
      const activitiesWithDay = arrayData.map((act: any) => {
        const dayNum = Number(act.dayNumber || act.day || 0);
        return {
          dayNum,
          activity: {
            time: act.time || "09:00 AM",
            activity: act.activity || "Explore",
            description: act.description || "",
            cost: typeof act.cost === "number" ? act.cost : parseFloat(act.cost) || 0,
            duration: act.duration || "2 hours",
            location: act.location || destination
          }
        };
      });

      const hasTaggedDays = activitiesWithDay.some((item) => item.dayNum >= 1);
      const groupedDays: { [key: number]: any[] } = {};

      if (hasTaggedDays) {
        for (const item of activitiesWithDay) {
          const d = item.dayNum || 1;
          if (!groupedDays[d]) groupedDays[d] = [];
          groupedDays[d].push(item.activity);
        }
      } else {
        // Distribute activities evenly across days
        const activitiesPerDay = Math.max(1, Math.ceil(activitiesWithDay.length / requestedDays));
        for (let i = 0; i < activitiesWithDay.length; i++) {
          const d = Math.floor(i / activitiesPerDay) + 1;
          if (d <= requestedDays) {
            if (!groupedDays[d]) groupedDays[d] = [];
            groupedDays[d].push(activitiesWithDay[i].activity);
          }
        }
      }

      const result: ItineraryResponse[] = [];
      for (let d = 1; d <= requestedDays; d++) {
        result.push({
          dayNumber: d,
          activities: groupedDays[d] || []
        });
      }
      return result;
    }
  }

  private getMockItinerary(
    destination: string,
    days: number,
    budgetType: string,
    interests: string[]
  ): ItineraryResponse[] {
    const destLower = destination.toLowerCase();
    const result: ItineraryResponse[] = [];

    // Detailed mocks for core destinations
    if (destLower.includes("tokyo")) {
      const allActivities = [
        // Day 1
        [
          { time: "09:00 AM", activity: "Sensō-ji Temple", description: "Explore Tokyo's oldest Buddhist temple in historic Asakusa, browsing the traditional Nakamise-dori shopping street.", cost: 0, duration: "2.5 hours", location: "Asakusa, Tokyo" },
          { time: "01:00 PM", activity: "Ueno Park & Museums", description: "Walk through the park and visit the Tokyo National Museum to see pre-modern Japanese art.", cost: 10, duration: "3 hours", location: "Ueno, Tokyo" },
          { time: "06:30 PM", activity: "Yakitori Dinner in Omoide Yokocho", description: "Enjoy grilled skewers in Shinjuku's famous atmospheric alleyways.", cost: 25, duration: "2 hours", location: "Shinjuku, Tokyo" }
        ],
        // Day 2
        [
          { time: "09:00 AM", activity: "Meiji Shrine & Yoyogi Park", description: "Stroll through the forested paths of Tokyo's most iconic Shinto shrine.", cost: 0, duration: "2 hours", location: "Harajuku, Tokyo" },
          { time: "11:30 AM", activity: "Harajuku Takeshita Street", description: "Browse trendy stores, quirky fashion shops, and grab a sweet crepe.", cost: 15, duration: "2 hours", location: "Harajuku, Tokyo" },
          { time: "03:00 PM", activity: "Shibuya Crossing & Hachiko Statue", description: "Cross the world's busiest pedestrian intersection and view Shibuya from a rooftop observatory.", cost: 18, duration: "2 hours", location: "Shibuya, Tokyo" },
          { time: "07:00 PM", activity: "Shibuya Sky Night View", description: "Witness a breathtaking 360-degree panoramic open-air view of the Tokyo skyline.", cost: 20, duration: "1.5 hours", location: "Shibuya, Tokyo" }
        ],
        // Day 3
        [
          { time: "09:30 AM", activity: "TeamLab Planets TOKYO", description: "Experience an immersive digital-art museum where you walk through water and flower gardens.", cost: 28, duration: "2.5 hours", location: "Toyosu, Tokyo" },
          { time: "01:00 PM", activity: "Tsukiji Outer Market Food Tour", description: "Sample fresh sushi, tamagoyaki, wagyu skewers, and street seafood delicacies.", cost: 35, duration: "2 hours", location: "Tsukiji, Tokyo" },
          { time: "04:00 PM", activity: "Akihabara Electric Town", description: "Explore the global hub of anime, gaming, electronics, and themed maid cafes.", cost: 15, duration: "3 hours", location: "Akihabara, Tokyo" }
        ],
        // Day 4
        [
          { time: "10:00 AM", activity: "Imperial Palace East Gardens", description: "Walk through the historical ruins of Edo Castle walls and pristine gardens.", cost: 0, duration: "2 hours", location: "Chiyoda, Tokyo" },
          { time: "01:00 PM", activity: "Ginza Luxury & Art Shopping", description: "Stroll along Ginza Chuo-dori and browse futuristic showrooms and art galleries.", cost: 50, duration: "3 hours", location: "Ginza, Tokyo" },
          { time: "06:30 PM", activity: "Roppongi Hills Observation Deck", description: "Enjoy a twilight view of Tokyo Tower and a gourmet Japanese izakaya dinner.", cost: 45, duration: "3 hours", location: "Roppongi, Tokyo" }
        ],
        // Day 5
        [
          { time: "09:00 AM", activity: "Day Trip to Mount Fuji & Lake Kawaguchiko", description: "Take an early morning express bus to Lake Kawaguchiko to view the majestic Mount Fuji.", cost: 40, duration: "8 hours", location: "Kawaguchiko, Yamanashi" },
          { time: "07:30 PM", activity: "Farewell Shabu-Shabu Dinner", description: "Savor a warm shabu-shabu hotpot dinner to celebrate your final night in Tokyo.", cost: 60, duration: "2 hours", location: "Shinjuku, Tokyo" }
        ]
      ];

      for (let i = 1; i <= days; i++) {
        const dayIdx = (i - 1) % allActivities.length;
        result.push({
          dayNumber: i,
          activities: JSON.parse(JSON.stringify(allActivities[dayIdx]))
        });
      }
      return result;
    } else if (destLower.includes("paris")) {
      const allActivities = [
        [
          { time: "09:00 AM", activity: "Eiffel Tower Ascent", description: "Take the lift to the top of the Iron Lady for panoramic views across Paris.", cost: 30, duration: "2 hours", location: "Champ de Mars, Paris" },
          { time: "12:00 PM", activity: "Seine River Cruise", description: "Relax on an open-air boat cruising past Notre-Dame, the Louvre, and under historic bridges.", cost: 15, duration: "1.5 hours", location: "Bateaux Parisiens, Paris" },
          { time: "03:00 PM", activity: "Champs-Élysées & Arc de Triomphe", description: "Stroll the grand avenue and climb to the top of the Arc de Triomphe.", cost: 13, duration: "2 hours", location: "Champs-Élysées, Paris" }
        ],
        [
          { time: "09:00 AM", activity: "Louvre Museum Tour", description: "Admire the Mona Lisa, Venus de Milo, and countless masterpieces in the world's largest art museum.", cost: 22, duration: "3.5 hours", location: "Louvre, Paris" },
          { time: "01:30 PM", activity: "Jardin des Tuileries Stroll", description: "Grab a classic French baguette sandwich and sit by the fountains in these formal gardens.", cost: 10, duration: "1.5 hours", location: "Tuileries, Paris" },
          { time: "04:00 PM", activity: "Musée d'Orsay", description: "Explore the exquisite collection of Impressionist art in a magnificent Beaux-Arts railway station.", cost: 16, duration: "2 hours", location: "Rive Gauche, Paris" }
        ],
        [
          { time: "10:00 AM", activity: "Montmartre & Sacré-Cœur", description: "Wander through the cobblestone streets of the artists' quarter and visit the white basilica.", cost: 0, duration: "3 hours", location: "Montmartre, Paris" },
          { time: "02:00 PM", activity: "Palais Garnier Opera House", description: "Take a self-guided tour of the stunning, gold-leafed opera palace that inspired Phantom of the Opera.", cost: 15, duration: "2 hours", location: "9th Arrondissement, Paris" },
          { time: "07:00 PM", activity: "Traditional Bistro Dinner", description: "Dine on escargots, duck confit, and crème brûlée at a historic Parisian bistro.", cost: 45, duration: "2.5 hours", location: "Latin Quarter, Paris" }
        ]
      ];

      for (let i = 1; i <= days; i++) {
        const dayIdx = (i - 1) % allActivities.length;
        result.push({
          dayNumber: i,
          activities: JSON.parse(JSON.stringify(allActivities[dayIdx]))
        });
      }
      return result;
    }

    // Default dynamic mock itinerary generator for general destinations
    for (let d = 1; d <= days; d++) {
      result.push({
        dayNumber: d,
        activities: [
          {
            time: "09:00 AM",
            activity: `Explore Historical ${destination} Center`,
            description: `A walking tour of the most famous historical monuments and landmarks in ${destination}.`,
            cost: budgetType === "High" ? 30 : budgetType === "Medium" ? 15 : 0,
            duration: "3 hours",
            location: `${destination} Old Town`
          },
          {
            time: "01:30 PM",
            activity: `${interests.includes("Food") ? "Food & Culture Walk" : "Local Highlights Tour"}`,
            description: `Discover the best local experiences, tailored specifically to your interest in ${interests.join(", ") || "travel"}.`,
            cost: budgetType === "High" ? 50 : budgetType === "Medium" ? 25 : 10,
            duration: "2.5 hours",
            location: `${destination} City Center`
          },
          {
            time: "06:30 PM",
            activity: `Twilight Dinner & Local Evening Experience`,
            description: "Unwind at a highly rated local dining venue and take in the beautiful evening atmosphere.",
            cost: budgetType === "High" ? 80 : budgetType === "Medium" ? 40 : 15,
            duration: "2 hours",
            location: `${destination} Dining District`
          }
        ]
      });
    }

    return result;
  }
}

export const itineraryAgent = new ItineraryAgent();
export default itineraryAgent;
