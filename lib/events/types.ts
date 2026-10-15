export type EventRecord = {
  id: number; title: string; categoryId: number; category: { id: number; category: string };
  city: string; date: string; time: string; price: string; image: string; description: string;
  status: boolean; createdAt: string; updatedAt: string;
};

const themes: Record<string, { colour: string; emoji: string }> = {
  Music: { colour: "bg-violet-100", emoji: "🎵" }, Workshop: { colour: "bg-sky-100", emoji: "🎨" },
  Food: { colour: "bg-orange-100", emoji: "🍋" }, Sports: { colour: "bg-lime-100", emoji: "🏸" }, Kids: { colour: "bg-pink-100", emoji: "🧸" },
};

export function toEventView(event: EventRecord) {
  return { ...event, category: event.category.category, date: `${event.date}T${event.time}:00+05:30`, price: Number(event.price), active: event.status, imageUrl: event.image,
    ...(themes[event.category.category] ?? { colour: "bg-secondary", emoji: "✨" }) };
}

export type EventView = ReturnType<typeof toEventView>;
