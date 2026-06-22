class TrieNode {
  public children: Map<string, TrieNode>;
  public isEndOfWord: boolean;
  public word: string | null;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.word = null;
  }
}

export class Trie {
  private root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  public insert(word: string): void {
    let current = this.root;
    const cleanWord = word.trim();
    for (const char of cleanWord.toLowerCase()) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    current.word = cleanWord;
  }

  public search(word: string): boolean {
    let current = this.root;
    for (const char of word.trim().toLowerCase()) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }
    return current.isEndOfWord;
  }

  public getSuggestions(prefix: string, limit = 10): string[] {
    let current = this.root;
    for (const char of prefix.trim().toLowerCase()) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    const results: string[] = [];
    this.collectWords(current, results, limit);
    return results;
  }

  private collectWords(node: TrieNode, results: string[], limit: number): void {
    if (results.length >= limit) return;

    if (node.isEndOfWord && node.word) {
      results.push(node.word);
    }

    for (const child of node.children.values()) {
      this.collectWords(child, results, limit);
    }
  }
}

// Default popular destinations list to initialize the Trie
export const popularDestinations = [
  "Tokyo, Japan",
  "Paris, France",
  "Dubai, United Arab Emirates",
  "Bali, Indonesia",
  "Switzerland, Europe",
  "London, United Kingdom",
  "New York City, USA",
  "Rome, Italy",
  "Singapore",
  "Sydney, Australia",
  "Cairo, Egypt",
  "Cape Town, South Africa",
  "Barcelona, Spain",
  "Bangkok, Thailand",
  "Amsterdam, Netherlands",
  "Rio de Janeiro, Brazil",
  "Vancouver, Canada",
  "Kyoto, Japan",
  "Istanbul, Turkey",
  "Venice, Italy",
  "Santorini, Greece",
  "Machu Picchu, Peru",
  "Prague, Czech Republic",
  "Seoul, South Korea",
  "Mumbai, India",
  "Delhi, India"
];

export const getInitializedTrie = (): Trie => {
  const trie = new Trie();
  for (const dest of popularDestinations) {
    trie.insert(dest);
  }
  return trie;
};
