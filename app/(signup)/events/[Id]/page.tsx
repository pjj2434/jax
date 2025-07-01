// app/events/[Id]/page.tsx
import EventDetailClient from './EventDetailClient';

export const revalidate = 31536000;

export default async function EventDetailPage({ params }: { params: { Id: string } }) {
  const { Id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventRes = await fetch(`${baseUrl}/api/events?id=${Id}`);
  if (!eventRes.ok) return <div>Event not found</div>;
  const eventData = await eventRes.json();
  if (eventData.galleryImages && typeof eventData.galleryImages === "string") {
    try { eventData.galleryImages = JSON.parse(eventData.galleryImages); } catch { eventData.galleryImages = []; }
  }
  const linksRes = await fetch(`${baseUrl}/api/events/${Id}/links`);
  const quickLinks = linksRes.ok ? await linksRes.json() : [];
  return <EventDetailClient event={eventData} quickLinks={quickLinks} />;
}
