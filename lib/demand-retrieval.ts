const RETRIEVAL_QUERIES: Record<string, string[]> = {
  "pet-hair-home": ["robot vacuum self empty station lidar pet hair", "cordless vacuum cleaner pet hair high power"],
  "bedroom-heat-no-ac": ["quiet tower fan bedroom", "portable air cooler bedroom"],
  "small-home-storage": ["space saving storage organizer", "slim storage cabinet organizer"],
  "wifi-dead-zone": ["mesh wifi 6 router system", "wifi 6 range extender gigabit"],
  "ergonomic-home-office": ["ergonomic office chair adjustable lumbar headrest", "premium mesh office chair lumbar support"],
  "student-smart-setup": ["ergonomic study chair adjustable", "student desk lamp eye care usb"],
  "car-summer-comfort": ["wireless carplay display android auto", "cordless car vacuum high power"],
  "elderly-home-safety": ["motion sensor night light rechargeable", "smart door sensor alarm wifi"],
  "home-humidity": ["electric home dehumidifier compressor", "digital hygrometer humidity monitor"],
  "home-cinema-projector": ["4k smart projector auto focus keystone", "full hd projector android wifi bluetooth"],
  "power-backup-home": ["lifepo4 portable power station 1000w", "portable power station solar generator 1000w"],
  "smart-cleaning-premium": ["robot vacuum self empty station lidar mop", "robot vacuum auto wash mop station"],
};

export function retrievalQueriesFor(slug: string, fallback: string) {
  const values = RETRIEVAL_QUERIES[slug] || [];
  return [...new Set([...values, fallback].map((value) => value.trim()).filter(Boolean))].slice(0, 3);
}
