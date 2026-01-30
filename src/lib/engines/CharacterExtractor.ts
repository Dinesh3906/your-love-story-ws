export interface Character {
  id: string;
  name: string;
  role: string;
  image?: string;
}

export const CharacterExtractor = {
  extract: async (story: string): Promise<Character[]> => {
    try {
      // List of available character files in "game chars"
      const availableFiles = [
        "another_female.png", "boy_friend_in_other_dress.png", "boy_friend.jpeg",
        "employ.png", "father.png", "female.png", "girl_friend.png",
        "girl_with_bag.png", "girl_with_white_hair.png", "girl.png",
        "mom_a.png", "mom_b.png", "officer.png", "pet.png", "villen.png"
      ];

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/extract_characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, files: availableFiles }),
      });

      const data = await res.json();
      return data.characters.map((char: any) => ({
        ...char,
        // Map the image path and sanitize spaces (AI often returns spaces)
        image: `/game_chars/${char.image?.replace(/\s+/g, '_')}`
      }));
    } catch (error) {
      console.error("Character extraction failed:", error);
      return [{ id: 'player', name: 'You', role: 'Protagonist', image: '/game_chars/boy_friend.jpeg' }];
    }
  }
};