// app/events/[Id]/page.tsx
import EventDetailClient from './EventDetailClient';
import type { Metadata } from "next";

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

export async function generateMetadata({ params }: { params: { Id: string } }): Promise<Metadata> {
  const { Id } = params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventRes = await fetch(`${baseUrl}/api/events?id=${Id}`);
  if (!eventRes.ok) return {};
  const eventData = await eventRes.json();

  const ogImage = eventData.featuredImage
    ? (eventData.featuredImage.startsWith("http") ? eventData.featuredImage : `${baseUrl}${eventData.featuredImage}`)
    : `${baseUrl}/jsl.png`;

  return {
    title: eventData.title || "Event",
    openGraph: {
      title: eventData.title || "Event",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: eventData.title || "Event",
        },
      ],
    },
  };
}
