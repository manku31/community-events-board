const events = [
  { id: 1, title: "Under the stars: music night", category: "Music", city: "Coimbatore", date: "2026-11-07T18:30:00+05:30", price: 499, active: true, emoji: "🎵", colour: "bg-violet-100" },
  { id: 2, title: "A little clay, a lot of creativity", category: "Workshop", city: "Chennai", date: "2026-11-08T10:00:00+05:30", price: 1200, active: true, emoji: "🎨", colour: "bg-sky-100" },
  { id: 3, title: "The neighbourhood food fair", category: "Food", city: "Coimbatore", date: "2026-11-14T16:00:00+05:30", price: 0, active: false, emoji: "🍋", colour: "bg-orange-100" },
  { id: 4, title: "Sunday morning on the court", category: "Sports", city: "Bengaluru", date: "2026-11-15T07:00:00+05:30", price: 250, active: true, emoji: "🏸", colour: "bg-lime-100" },
  { id: 5, title: "Little makers, big imaginations", category: "Kids", city: "Chennai", date: "2026-11-21T11:00:00+05:30", price: 350, active: false, emoji: "🧸", colour: "bg-pink-100" },
];

export const sampleEvents = events.map((event, index) => ({
  ...event,
  description: ["An evening of live music under the stars. Bring your friends, settle in, and enjoy local performers sharing their favourite songs.", "A relaxed pottery workshop for curious beginners. Learn to shape clay and create a small piece of your own with guidance from a local artist.", "Discover delicious food from local cooks and neighbourhood stalls. Come hungry and spend an afternoon sharing flavours with your community.", "Start your Sunday with a friendly game of badminton. All experience levels are welcome for a little movement and good company.", "A playful creative workshop for kids to make, explore, and imagine. Enjoy hands-on activities in a friendly setting with adult supervision."][index],
  imageUrl: `https://example.com/events/${event.id}.jpg`,
}));
