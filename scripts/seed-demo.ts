import "dotenv/config";
import { prisma } from "../lib/db";
import { Prisma } from "../generated/prisma/client";

const categoryNames = ["Music", "Workshop", "Food", "Sports", "Kids", "Art", "Theatre", "Wellness"];
const events = [
  { title: "Acoustic night under the stars", category: "Music", city: "Coimbatore", days: 2, time: "18:30", price: "499", status: true, description: "An easygoing evening of acoustic performances by local musicians. Bring your friends and settle in for original songs, familiar favourites, and a little community magic. There will be comfortable seating, a short interval, and time to meet the performers afterwards. Gates open thirty minutes before the music starts. This event is suitable for all ages; children should attend with an adult." },
  { title: "Weekend pottery for beginners", category: "Workshop", city: "Chennai", days: 3, time: "10:00", price: "1200", status: true, description: "Shape your first clay bowl with a local artist. Materials and tools are included, and no experience is needed." },
  { title: "Neighbourhood street food fair", category: "Food", city: "Coimbatore", days: 4, time: "16:00", price: "0", status: true, description: "Explore local food stalls, family recipes, and seasonal treats. Entry is free; food is purchased separately." },
  { title: "Sunday badminton social", category: "Sports", city: "Bengaluru", days: 5, time: "07:30", price: "250", status: true, description: "Join friendly doubles games and meet other badminton enthusiasts. Beginners are welcome; bring your own racket." },
  { title: "Little makers craft morning", category: "Kids", city: "Chennai", days: 6, time: "11:00", price: "350", status: true, description: "A colourful morning of paper crafts and creative play for ages 5–10. An accompanying adult is required." },
  { title: "Sunrise yoga in the park", category: "Wellness", city: "Coimbatore", days: 7, time: "06:00", price: "0", status: true, description: "Start your day with gentle movement and guided breathing. Bring a yoga mat, water, and comfortable clothing." },
  { title: "Watercolour postcards workshop", category: "Art", city: "Madurai", days: 8, time: "14:30", price: "799.50", status: true, description: "Paint a set of postcards inspired by local streets and gardens. All art materials are included." },
  { title: "Community theatre evening", category: "Theatre", city: "Kochi", days: 9, time: "19:00", price: "650", status: false, description: "A collection of short plays performed by a local theatre group. This listing is currently inactive." },
  { title: "Coffee and conversations", category: "Food", city: "Bengaluru", days: 10, time: "09:30", price: "450", status: true, description: "Discover brewing techniques, sample different roasts, and enjoy a relaxed conversation with fellow coffee lovers." },
  { title: "Indie music rooftop night", category: "Music", city: "Chennai", days: 12, time: "18:00", price: "999", status: false, description: "An intimate rooftop show featuring emerging indie artists. Booking details will be announced when the event becomes active." },
  { title: "Build your first terrarium", category: "Workshop", city: "Kochi", days: 14, time: "15:00", price: "1500", status: true, description: "Create a tiny green world to take home. Plants, containers, and a beginner care guide are included." },
  { title: "Community football morning", category: "Sports", city: "Madurai", days: 16, time: "08:00", price: "150", status: true, description: "Friendly small-team football matches for adults. Bring sports shoes and water; teams are assigned at the venue." },
  { title: "Art festival group experience", category: "Art", city: "Bengaluru", days: 21, time: "10:30", price: "150000", status: true, description: "A curated full-day art festival package for a private group, including guided sessions and materials. The listed price is for the entire group package." },
  { title: "Last weekend jazz jam", category: "Music", city: "Coimbatore", days: -7, time: "18:30", price: "399", status: true, description: "A past jazz evening with community musicians. Kept as sample data for checking past-event behaviour." },
  { title: "Family storytelling afternoon", category: "Kids", city: "Chennai", days: -3, time: "16:30", price: "0", status: false, description: "A past, inactive storytelling session with interactive tales and drawing activities for families." },
];

function eventDate(days: number) {
  const parts = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day") + days));
}

async function main() {
  try {
    const counts = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(20261016, 1)`;
      let categoriesCreated = 0;
      let eventsCreated = 0;
      const ids = new Map<string, number>();
      for (const name of categoryNames) {
        let category = await tx.category.findFirst({ where: { category: { equals: name, mode: "insensitive" } }, orderBy: { id: "asc" } });
        if (!category) {
          category = await tx.category.create({ data: { category: name, status: name !== "Theatre" } });
          categoriesCreated += 1;
        }
        ids.set(name, category.id);
      }
      for (const event of events) {
        const existing = await tx.event.findFirst({ where: { title: event.title, description: { startsWith: "Demo event: " } }, select: { id: true } });
        if (existing) continue;
        await tx.event.create({ data: {
          title: event.title, categoryId: ids.get(event.category)!, city: event.city,
          date: eventDate(event.days), time: new Date(`1970-01-01T${event.time}:00.000Z`),
          price: new Prisma.Decimal(event.price), status: event.status,
          image: `https://placehold.co/1200x800/eee5f7/59416d.png?text=${encodeURIComponent(event.category + " · " + event.city)}`,
          description: `Demo event: ${event.description}`,
        } });
        eventsCreated += 1;
      }
      return { categoriesCreated, categoriesReused: categoryNames.length - categoriesCreated, eventsCreated, eventsSkipped: events.length - eventsCreated };
    }, { maxWait: 10000, timeout: 60000 });
    console.log("Dummy data saved:", counts);
    console.log("Existing records were preserved. Demo images use placeholder URLs.");
  } catch {
    console.error("Dummy data could not be saved. The transaction was rolled back; check database connectivity and applied migrations.");
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
}

void main();
