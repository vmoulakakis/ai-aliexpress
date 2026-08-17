const RETRIEVAL_QUERIES: Record<string, string[]> = {
  "pet-hair-home": ["robot vacuum pet hair", "cordless vacuum pet hair"],
  "bedroom-heat-no-ac": ["quiet tower fan bedroom", "portable air cooler bedroom"],
  "small-home-storage": ["space saving storage organizer", "slim storage cabinet organizer"],
  "wifi-dead-zone": ["mesh wifi 6 system", "wifi 6 range extender"],
  "ergonomic-home-office": ["ergonomic office chair lumbar support", "monitor arm ergonomic desk"],
  "student-smart-setup": ["ergonomic study chair", "student desk lamp eye care"],
  "car-summer-comfort": ["carplay display wireless", "car vacuum cordless"],
  "elderly-home-safety": ["motion sensor night light", "smart door sensor alarm"],
  "home-humidity": ["home dehumidifier", "digital hygrometer humidity monitor"],
  "home-cinema-projector": ["4k smart projector home cinema", "full hd projector auto focus"],
  "power-backup-home": ["lifepo4 portable power station", "portable power station 1000w"],
  "smart-cleaning-premium": ["robot vacuum self empty mop", "robot vacuum auto wash station"],
};

export function retrievalQueriesFor(slug: string, fallback: string) {
  const values = RETRIEVAL_QUERIES[slug] || [];
  return [...new Set([...values, fallback].map((value) => value.trim()).filter(Boolean))].slice(0, 3);
}
