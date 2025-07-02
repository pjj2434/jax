// app/events/[Id]/page.tsx
import EventDetailClient from './EventDetailClient';
import type { Metadata } from "next";

export const revalidate = 31536000;

export default async function EventDetailPage({ params }: { params: Promise<{ Id: string }> }) {
  const { Id } = await params;
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

export async function generateMetadata({ params }: { params: Promise<{ Id: string }> }): Promise<Metadata> {
  const { Id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const eventRes = await fetch(`${baseUrl}/api/events?id=${Id}`);
  if (!eventRes.ok) return {};
  const eventData = await eventRes.json();

  // Use the same logo logic as the event detail page
  const getLogoConfig = (logoType: string) => {
    const logoMap: Record<string, { src: string; alt: string }> = {
      'jax': { src: '/logo.png', alt: 'JAX Logo' },
      'jsl': { src: '/jsl.png', alt: 'JSL Logo' }
    };
    return logoMap[logoType] || logoMap['jsl'];
  };

  const ogImage = eventData.featuredImage
    ? (eventData.featuredImage.startsWith("http") ? eventData.featuredImage : `${baseUrl}${eventData.featuredImage}`)
    : `${baseUrl}${getLogoConfig(eventData.logoType || 'jsl').src}`;

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
