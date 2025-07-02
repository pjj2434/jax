"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react";
import { GalleryViewer } from "@/components/ui/gallery-viewer";
import { getImagePropsForFill } from "@/lib/image-utils";

function fallbackCopyToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    toast.success("Link copied to clipboard!");
  } catch (err) {
    toast.error("Failed to copy link. Please copy manually.");
  }
  document.body.removeChild(textArea);
}

// Helper functions for event types and logos
const getEventTypeDisplay = (eventType: string) => {
  const typeMap: Record<string, string> = {
    'league': 'League',
    'tournament': 'Tournament',
    'workshop': 'Workshop',
    'social': 'Social',
    'competition': 'Competition',
    'event': 'Event'
  };
  return typeMap[eventType] || 'Event';
};

const getLogoConfig = (logoType: string) => {
  const logoMap: Record<string, { src: string; alt: string }> = {
    'jax': { src: '/logo.png', alt: 'JAX Logo' },
    'jsl': { src: '/jsl.png', alt: 'JSL Logo' }
  };
  return logoMap[logoType] || logoMap['jsl'];
};

export default function EventDetailClient({ event, quickLinks }: { event: any, quickLinks: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    additionalParticipants: event.allowSignups && event.participantsPerSignup > 1
      ? Array(event.participantsPerSignup - 1).fill({ name: "", email: "" })
      : [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [galleryViewerOpen, setGalleryViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (event.allowSignups && event.participantsPerSignup > 1) {
      setFormData((prev) => ({
        ...prev,
        additionalParticipants: Array(event.participantsPerSignup - 1).fill({ name: "", email: "" })
      }));
    }
  }, [event.participantsPerSignup, event.allowSignups]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalParticipants: prev.additionalParticipants.map((p: any, i: number) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/signups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          eventId: event.id,
          additionalParticipants: formData.additionalParticipants.length > 0
            ? JSON.stringify(formData.additionalParticipants)
            : null
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit signup");
      }
      toast.success("Your signup has been submitted successfully!");
      setShowSignupForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        notes: "",
        additionalParticipants: formData.additionalParticipants.map(() => ({ name: "", email: "" }))
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit signup");
    } finally {
      setSubmitting(false);
    }
  };

  const isEventFull = () => {
    if (!event?.showCapacity || !event?.maxAttendees) return false;
    return event.attendeeCount >= event.maxAttendees;
  };

  const getRemainingSpots = () => {
    if (!event?.showCapacity || !event?.maxAttendees) return null;
    return Math.max(0, event.maxAttendees - event.attendeeCount);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto p-4 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.push("/")} className="border-gray-600 text-black hover:bg-gray-800">
            ← Back to Events
          </Button>
        </div>

        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <Image
              src={getLogoConfig(event.logoType).src}
              alt={getLogoConfig(event.logoType).alt}
              width={200}
              height={60}
              className="mx-auto mb-2"
              priority
            />
          </div>
        </div>

        {/* Event Header */}
        <div className="relative mb-8">
          {event.featuredImage && (event.featuredImage.startsWith('/') || event.featuredImage.startsWith('http')) ? (
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-6">
              <Image
                {...getImagePropsForFill(event.featuredImage, event.title, 'featured', { quality: 90 })}
                fill
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-medium mb-2">
                  {getEventTypeDisplay(event.eventType)}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-medium mb-2">
                {getEventTypeDisplay(event.eventType)}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
            </div>
          )}

          {/* Event Meta Info */}
          <div className="flex flex-wrap gap-4 mb-6">
            {event.eventDate && (
              <div className="flex items-center text-gray-300">
                <Calendar className="h-5 w-5 mr-2" />
                <span>{new Date(event.eventDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            )}

            {event.location && (
              <div className="flex items-center text-gray-300">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{event.location}</span>
              </div>
            )}

            {event.showCapacity && event.maxAttendees && (
              <div className="flex items-center text-gray-300">
                <Users className="h-5 w-5 mr-2" />
                <span>
                  {event.attendeeCount} / {event.maxAttendees} registered
                  {getRemainingSpots() !== null && (
                    <span className={isEventFull() ? "text-red-300 ml-2" : "text-green-300 ml-2"}>
                      ({isEventFull() ? "Full" : `${getRemainingSpots()} spots left`})
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {quickLinks.map((link: any) => (
                <a
                  key={link.id}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-white border border-gray-700"
                >
                  {link.title}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {event.allowSignups && (
              <>
                {isEventFull() ? (
                  <Button disabled>Event Full</Button>
                ) : (
                  <Button onClick={() => {
                    const newShowForm = !showSignupForm;
                    setShowSignupForm(newShowForm);
                    if (newShowForm) {
                      setTimeout(() => {
                        const formElement = document.getElementById('signup-form');
                        if (formElement) {
                          formElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }
                      }, 100);
                    }
                  }}>
                    {showSignupForm ? "Hide Signup Form" : "Sign Up Now"}
                  </Button>
                )}
              </>
            )}

            {event.eventDate && (
              <Button variant="outline" onClick={() => window.open(`/api/events/${event.id}/calendar`, "_blank")} className="border-gray-600 text-black hover:bg-gray-800">
                Add to Calendar
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                const url = window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(url)
                    .then(() => {
                      toast.success("Link copied to clipboard!");
                    })
                    .catch(() => {
                      fallbackCopyToClipboard(url);
                    });
                } else {
                  fallbackCopyToClipboard(url);
                }
              }}
              className="border-gray-600 text-black hover:bg-gray-800"
            >
              Share
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger
              value="details"
              className="text-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white"
            >
              Details
            </TabsTrigger>
            {event.galleryImages && event.galleryImages.length > 0 && (
              <TabsTrigger
                value="gallery"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white"
              >
                Gallery
              </TabsTrigger>
            )}
            {event.allowSignups && (
              <TabsTrigger
                value="participants"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:border-white"
              >
                Participants
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="mt-6">
            {event.description && (
              <div className="prose max-w-none mb-6">
                <p>{event.description}</p>
              </div>
            )}

            {event.detailedContent ? (
              <div className="prose max-w-none prose-invert prose-p:text-gray-300 prose-headings:text-white" dangerouslySetInnerHTML={{ __html: event.detailedContent }} />
            ) : (
              <div className="text-gray-300 italic">No detailed information available.</div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            {event.galleryImages && event.galleryImages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {event.galleryImages.map((image: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setGalleryViewerOpen(true);
                    }}
                  >
                    <Image
                      {...getImagePropsForFill(
                        image && (image.startsWith('/') || image.startsWith('http')) ? image : `/${image}`,
                        `${event.title} - Image ${index + 1}`,
                        'gallery',
                        { quality: 85 }
                      )}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-300 italic">No gallery images available.</div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            {event.showCapacity && event.maxAttendees ? (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span>Registration Progress</span>
                  <span className={isEventFull() ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                    {event.attendeeCount} / {event.maxAttendees}
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${isEventFull() ? "bg-red-500" : "bg-green-500"}`}
                    style={{ width: `${Math.min(100, (event.attendeeCount / event.maxAttendees) * 100)}%` }}
                  ></div>
                </div>

                <p className="text-sm text-gray-300 mt-1">
                  {isEventFull()
                    ? "This event is full."
                    : `${getRemainingSpots()} spot${getRemainingSpots() === 1 ? "" : "s"} remaining`}
                </p>
              </div>
            ) : (
              <p className="mb-6 text-gray-300">No capacity limit for this event.</p>
            )}

            <p className="text-gray-300">
              {event.attendeeCount > 0
                ? `${event.attendeeCount} ${event.attendeeCount === 1 ? "person has" : "people have"} registered for this event.`
                : "Be the first to sign up for this event!"}
            </p>
          </TabsContent>
        </Tabs>

        {/* Signup Form */}
        {showSignupForm && event.allowSignups && !isEventFull() && (
          <motion.div
            id="signup-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8 bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Sign Up for {event.title}</CardTitle>
                <CardDescription className="text-gray-300">
                  Fill out the form below to register for this {event.eventType}.
                  {event.participantsPerSignup > 1 && (
                    <span className="block mt-1">
                      You can register up to {event.participantsPerSignup} {event.participantsPerSignup === 1 ? "person" : "people"} with this form.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {/* Primary Participant */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-white">Primary Participant</h3>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Phone *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        disabled={submitting}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Additional Participants */}
                  {formData.additionalParticipants.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-700">
                      <h3 className="font-medium text-white">Additional Participants</h3>

                      {formData.additionalParticipants.map((participant: any, index: number) => (
                        <div key={index} className="space-y-4 p-4 bg-gray-800 rounded-md border border-gray-700">
                          <h4 className="font-medium text-white">Participant {index + 2}</h4>

                          <div className="space-y-2">
                            <Label htmlFor={`participant-${index}-name`} className="text-gray-300">Name</Label>
                            <Input
                              id={`participant-${index}-name`}
                              value={participant.name}
                              onChange={(e) => handleParticipantChange(index, "name", e.target.value)}
                              disabled={submitting}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`participant-${index}-email`} className="text-gray-300">Email</Label>
                            <Input
                              id={`participant-${index}-email`}
                              type="email"
                              value={participant.email}
                              onChange={(e) => handleParticipantChange(index, "email", e.target.value)}
                              disabled={submitting}
                              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-primary"
                            />
                          </div>
                        </div>
                      ))}

                      <p className="text-sm text-gray-300">
                        Additional participants are optional. You can leave these fields blank if you're registering just yourself.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <Label htmlFor="notes" className="text-gray-300">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      disabled={submitting}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-primary"
                    />
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Complete Registration"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Gallery Viewer */}
        {galleryViewerOpen && event?.galleryImages && (
          <GalleryViewer
            images={event.galleryImages}
            initialIndex={selectedImageIndex}
            onClose={() => setGalleryViewerOpen(false)}
          />
        )}
      </div>
    </div>
  );
} 