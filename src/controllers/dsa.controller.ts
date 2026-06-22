import { Request, Response, NextFunction } from "express";
import tripService from "../services/trip.service";
import { PriorityQueue } from "../dsa/priorityQueue";

// Pre-seeded destination metadata for Priority Queue matching
interface DestinationMetadata {
  name: string;
  interests: string[];
  description: string;
}

const DESTINATIONS: DestinationMetadata[] = [
  { name: "Tokyo, Japan", interests: ["food", "culture", "shopping", "adventure"], description: "Experience bustling neon streets, historic temples, and legendary sushi stalls." },
  { name: "Paris, France", interests: ["culture", "food", "shopping", "nature"], description: "Enjoy iconic Louvre artwork, gourmet bistros, and scenic walks along the Seine." },
  { name: "Dubai, UAE", interests: ["shopping", "adventure", "luxury"], description: "Witness sky-high observation decks, dune buggy desert safaris, and elite malls." },
  { name: "Bali, Indonesia", interests: ["nature", "adventure", "food", "culture"], description: "Relax on scenic tropical beaches, visit volcanic peaks, and explore historic temples." },
  { name: "Switzerland, Europe", interests: ["nature", "adventure", "culture"], description: "Ride panoramic trains past pristine blue lakes, alpine valleys, and ski slopes." },
  { name: "New York City, USA", interests: ["shopping", "food", "culture"], description: "Explore Broadway theaters, Central Park lanes, and diverse food neighborhoods." },
  { name: "Sydney, Australia", interests: ["nature", "adventure", "food"], description: "Take a harbor side walk, relax on Bondi beach sands, and experience gourmet seafood." }
];

export class DSAController {
  /**
   * Trie Autocomplete endpoint
   */
  public getAutocomplete(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const query = (req.query.q as string) || "";
      const suggestions = tripService.getAutocompleteSuggestions(query);
      
      res.status(200).json({
        status: "success",
        data: {
          suggestions
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Interest-based recommendation endpoint utilizing our Heap-based Priority Queue
   */
  public getRecommendations(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    try {
      const interestsQuery = (req.query.interests as string) || "";
      const selectedInterests = interestsQuery
        .split(",")
        .map(i => i.trim().toLowerCase())
        .filter(i => i.length > 0);

      if (selectedInterests.length === 0) {
        res.status(200).json({
          status: "success",
          data: { recommendations: DESTINATIONS.slice(0, 3) }
        });
        return;
      }

      // Instantiate custom Priority Queue
      const pq = new PriorityQueue<DestinationMetadata>();

      for (const dest of DESTINATIONS) {
        // Calculate matching score
        let matchCount = 0;
        for (const interest of selectedInterests) {
          if (dest.interests.includes(interest)) {
            matchCount++;
          }
        }

        // We want higher match count to dequeue first.
        // Since our PriorityQueue is a Min-Heap, we can define priority = (10 - matchCount).
        // Max match count (e.g. 4) -> priority = 6. Min match count (0) -> priority = 10.
        // This ensures highest matches rise to the top.
        const priorityScore = 10 - matchCount;
        pq.enqueue(dest, priorityScore);
      }

      const sortedRecommendations: DestinationMetadata[] = [];
      while (!pq.isEmpty()) {
        const item = pq.dequeue();
        if (item) {
          sortedRecommendations.push(item);
        }
      }

      res.status(200).json({
        status: "success",
        data: {
          recommendations: sortedRecommendations
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dsaController = new DSAController();
export default dsaController;
