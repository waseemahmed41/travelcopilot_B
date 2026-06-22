import geminiService from "../gemini.service";

export interface HotelOption {
  name: string;
  priceRange: string;
  description: string;
  rating?: string;
}

export interface HotelResponse {
  budget: HotelOption[];
  midRange: HotelOption[];
  luxury: HotelOption[];
}

export class HotelAgent {
  private systemInstruction = `You are a specialized hotel booking advisor.
Suggest 2-3 specific real hotels for the specified destination across three categories:
1. budget (affordable, highly-rated hostels or motels)
2. midRange (comfortable 3-4 star hotels, clean, well-located)
3. luxury (premium 5-star boutique lodging or resorts)
For each hotel, include the name, approximate priceRange per night in USD, a brief, compelling description highlighting its unique features or location, and a rating score (e.g. "4.5/5").
You must respond strictly with a valid JSON object. Do not include any extra text.
JSON format:
{
  "budget": [
    { "name": "Hotel Name", "priceRange": "$40 - $70", "description": "Short description.", "rating": "4.2/5" }
  ],
  "midRange": [
     { "name": "Hotel Name", "priceRange": "$120 - $180", "description": "Short description.", "rating": "4.5/5" }
  ],
  "luxury": [
     { "name": "Hotel Name", "priceRange": "$400+", "description": "Short description.", "rating": "4.9/5" }
  ]
}`;

  public async generate(destination: string): Promise<HotelResponse> {
    const prompt = `Destination: ${destination}`;

    return geminiService.generateJSON<HotelResponse>(
      this.systemInstruction,
      prompt,
      () => this.getMockHotels(destination)
    );
  }

  private getMockHotels(destination: string): HotelResponse {
    const destLower = destination.toLowerCase();

    if (destLower.includes("tokyo")) {
      return {
        budget: [
          { name: "Grids Tokyo Ueno Hotel & Hostel", priceRange: "$35 - $60", description: "Modern, extremely clean hostel offering custom bunk beds and private rooms in a lively artistic district.", rating: "4.4/5" },
          { name: "Nine Hours Suidobashi", priceRange: "$40 - $65", description: "Futuristic minimalist capsule hotel featuring state-of-the-art sleeping pods, clean showers, and an awesome rooftop lounge.", rating: "4.3/5" }
        ],
        midRange: [
          { name: "Hotel Gracery Shinjuku", priceRange: "$150 - $220", description: "Located right next to the famous Godzilla Head in Kabukicho, featuring modern rooms with high-speed internet and scenic windows.", rating: "4.5/5" },
          { name: "Shibuya Excel Hotel Tokyu", priceRange: "$180 - $270", description: "Directly connected to Shibuya Station, providing comfortable soundproof rooms looking directly down at the Shibuya Scramble Crossing.", rating: "4.6/5" }
        ],
        luxury: [
          { name: "Aman Tokyo", priceRange: "$900 - $1400", description: "A serene urban sanctuary high above Otemachi, showcasing traditional shoji screens, washi paper lanterns, and a dramatic infinity pool.", rating: "4.9/5" },
          { name: "Park Hyatt Tokyo", priceRange: "$650 - $950", description: "The iconic luxury hotel featured in 'Lost in Translation', offering breathtaking views of Mt. Fuji and Tokyo's skyline from its top floors.", rating: "4.8/5" }
        ]
      };
    }

    if (destLower.includes("paris")) {
      return {
        budget: [
          { name: "Les Piaules Nation Hostel", priceRange: "$35 - $65", description: "A popular boutique youth hostel located in Belleville, featuring a beautiful rooftop bar with views of Parisian monuments.", rating: "4.3/5" },
          { name: "Generator Paris", priceRange: "$40 - $70", description: "Stylish canal-side hostel in the 10th arrondissement, complete with a vibrant underground bar and rooftop terrace.", rating: "4.2/5" }
        ],
        midRange: [
          { name: "Hotel Caron de Beaumarchais", priceRange: "$160 - $240", description: "Intimate 18th-century themed hotel in the Marais district, offering antique decor combined with modern comforts.", rating: "4.6/5" },
          { name: "Hotel Regina Louvre", priceRange: "$220 - $350", description: "Classic Parisian hotel situated directly opposite the Louvre Museum and Tuileries Gardens.", rating: "4.5/5" }
        ],
        luxury: [
          { name: "The Ritz Paris", priceRange: "$1100 - $1600", description: "The absolute pinnacle of French luxury and history on Place Vendôme, offering legendary suites and Michelin-starred dining.", rating: "4.9/5" },
          { name: "Shangri-La Paris", priceRange: "$950 - $1400", description: "Former home of Prince Roland Bonaparte, offering regal suites with spectacular direct views of the Eiffel Tower.", rating: "4.8/5" }
        ]
      };
    }

    // Default mock for general destinations
    return {
      budget: [
        { name: `${destination} Central Backpackers`, priceRange: "$30 - $55", description: "A social and budget-friendly hostel right in the town center, ideal for solo travelers and backpackers.", rating: "4.2/5" },
        { name: `Express Stay ${destination}`, priceRange: "$45 - $75", description: "Clean, comfortable, and no-frills accommodation near major transit hubs.", rating: "4.1/5" }
      ],
      midRange: [
        { name: `Plaza Hotel ${destination}`, priceRange: "$120 - $180", description: "A highly rated business and tourist hotel, offering spacious rooms, free breakfast, and friendly bilingual service.", rating: "4.4/5" },
        { name: `Boutique Stay ${destination}`, priceRange: "$140 - $210", description: "Charming local boutique lodging with uniquely decorated rooms and high traveler reviews.", rating: "4.5/5" }
      ],
      luxury: [
        { name: `The Grand Palace ${destination}`, priceRange: "$450 - $750", description: "Five-star premier luxury experience featuring award-winning spas, dining, and scenic views of local landmarks.", rating: "4.9/5" },
        { name: `Royal Suites & Spa ${destination}`, priceRange: "$500 - $900", description: "Exquisite resort and spa offering private terraces, butler service, and private pool areas.", rating: "4.8/5" }
      ]
    };
  }
}

export const hotelAgent = new HotelAgent();
export default hotelAgent;
