import geminiService from "../gemini.service";

export interface LocalTipsResponse {
  hiddenGems: string[];
  localFoodStreets: string[];
  publicTransportTips: string[];
  commonScams: string[];
}

export class LocalTipsAgent {
  private systemInstruction = `You are a local travel expert and street-smart guide.
Suggest curated insider recommendations for the specified destination:
1. hiddenGems (non-touristy, breathtaking places to visit)
2. localFoodStreets (famous spots, streets, markets to eat street food or authentic meals)
3. publicTransportTips (insider hacks for navigating the city trains, buses, passes, or walking)
4. commonScams (what tourist traps, taxi scams, or pickpocket hotspots to watch out for)
You must respond strictly with a valid JSON object. Do not include any extra text.
JSON format:
{
  "hiddenGems": ["Gem 1", "Gem 2"],
  "localFoodStreets": ["Market 1", "Street 2"],
  "publicTransportTips": ["Tip 1", "Tip 2"],
  "commonScams": ["Scam 1", "Scam 2"]
}`;

  public async generate(destination: string): Promise<LocalTipsResponse> {
    const prompt = `Destination: ${destination}`;

    return geminiService.generateJSON<LocalTipsResponse>(
      this.systemInstruction,
      prompt,
      () => this.getMockTips(destination)
    );
  }

  private getMockTips(destination: string): LocalTipsResponse {
    const destLower = destination.toLowerCase();

    if (destLower.includes("tokyo")) {
      return {
        hiddenGems: [
          "Todoroki Valley - A beautiful, deep forested ravine hidden in Setagaya ward, offering a complete escape from city noise.",
          "Yanaka Ginza - A retro Tokyo neighborhood that survived WWII, showing a nostalgic 'Showa era' side of the capital.",
          "Nezu Shrine - Known for its beautiful red torii gate path that looks like Fushimi Inari but without the Kyoto crowds."
        ],
        localFoodStreets: [
          "Omoide Yokocho (Shinjuku) - Narrow alleyways packed with miniature open-counter yakitori and drink stalls.",
          "Ameyoko Market (Ueno) - A bustling open-air market filled with cheap street food, takoyaki, fresh fruit, and snacks.",
          "Yurakucho Gado-shita - Food stalls located under the brick arches of the elevated JR Yamanote rail line tracks."
        ],
        publicTransportTips: [
          "Get a Suica or Pasmo IC card immediately. Tap on and off for all subways, buses, and convenience stores.",
          "Download the 'Tokyo Subway Navigation' or 'Jorudan' app to easily decipher complex multi-operator train transfer maps.",
          "Beware of the last train rule: Subways generally shut down completely between 12:00 AM and 12:30 AM."
        ],
        commonScams: [
          "Roppongi & Kabukicho Bar Touts - Avoid friendly strangers on the street inviting you to 'free entrance' bars; they often spike drinks and charge thousands in hidden fees.",
          "Fake Monk Donations - Politely decline golden cards or amulets handed to you by monks near temples; they will aggressively demand cash donations.",
          "Overpriced Street Food Touts - Check menus and prices in Tsukiji before ordering; some stalls charge inflated tourist rates for generic seafood."
        ]
      };
    }

    if (destLower.includes("paris")) {
      return {
        hiddenGems: [
          "La Petite Ceinture - A historic abandoned railway loop wrapped around Paris, now converted into nature walks and cafes.",
          "Arènes de Lutèce - A hidden ancient Roman amphitheater tucked away in the 5th arrondissement where locals play pétanque.",
          "Musée de la Chasse et de la Nature - An eccentric, beautiful museum of hunting and taxidermy in the Marais."
        ],
        localFoodStreets: [
          "Rue des Rosiers (Marais) - Legendary street for falafel (like L'As du Fallafel) and French-Jewish pastries.",
          "Rue Mouffetard (Latin Quarter) - A historic market street packed with cheese shops, bakeries, crêperies, and bistros.",
          "Marché des Enfants Rouges - The oldest covered food market in Paris, serving Moroccan, Italian, and organic local foods."
        ],
        publicTransportTips: [
          "Purchase a Navigo Decouverte weekly transit pass if arriving early in the week to get unlimited metro/RER travel.",
          "Hold onto your physical paper tickets until you leave the exit gates; transport police frequently fine tourists who throw them away mid-trip.",
          "Keep your backpack in front of you and hands on pockets while riding Metro Line 1, 4, and 9."
        ],
        commonScams: [
          "The String Trick (Sacré-Cœur) - Men will try to tie a colorful thread around your finger and then aggressively demand 20 euros for 'making a bracelet'.",
          "The Petition Signature - Young girls carrying clipboards will ask if you speak English and want to sign a petition for deaf-mute organizations, using the distraction to pickpocket you.",
          "Found Gold Ring Scam - A stranger will pretend to pick up a golden ring from the ground, ask if you dropped it, and try to sell it to you or demand a finder's reward."
        ]
      };
    }

    // Default mock for other destinations
    return {
      hiddenGems: [
        `Local Secret Garden - A beautiful, secluded park offering panoramic views of ${destination} without the crowds.`,
        `The Old Artisans Quarter - Historic streets where local craftsmen work and sell authentic goods.`
      ],
      localFoodStreets: [
        `Central Night Market - The prime spot for tasting traditional local street food and mingling with residents.`,
        `The Harbor Side Food Market - Seafood stalls serving fresh catch and affordable dining options.`
      ],
      publicTransportTips: [
        "Pick up a reloadable transit smart card at the terminal or train station to save up to 30% on single ticket rides.",
        "Walking is often faster and much more scenic than taking local buses during heavy rush hour traffic."
      ],
      commonScams: [
        "Unmetered Airport Taxis - Always agree on a fare before getting into a cab, or use official ridesharing apps like Uber.",
        "Friendly Local Touts - Politely decline offers from overly enthusiastic guides who want to take you to their 'family-owned gemstone shop' or 'wholesale tea market'."
      ]
    };
  }
}

export const localTipsAgent = new LocalTipsAgent();
export default localTipsAgent;
