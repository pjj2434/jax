// app/events/[Id]/page.tsx
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
import { Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  maxAttendees: number | null;
  isActive: boolean;
  showCapacity: boolean;
  eventType: string;
  allowSignups: boolean;
  participantsPerSignup: number;
  featuredImage: string | null;
  galleryImages: string[] | null;
  detailedContent: string | null;
  attendeeCount: number;
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface Participant {
  name: string;
  email: string;
}

export default function EventDetailPage({ params }: { params: { Id: string } }) {
  const { Id } = params;
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  
  // For signup form
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    additionalParticipants: [] as Participant[]
  });
  const [submitting, setSubmitting] = useState(false);

  // Move fetchEventData outside useEffect
  const fetchEventData = async () => {
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/events?id=${Id}`, {
        cache: 'no-store'
      });
      
      if (!eventRes.ok) {
        if (eventRes.status === 404) {
          throw new Error("Event not found");
        }
        throw new Error(`Failed to fetch event: ${eventRes.status}`);
      }
      
      const eventData = await eventRes.json();
      
      // Parse gallery images if they exist
      if (eventData.galleryImages) {
        try {
          const parsedImages = JSON.parse(eventData.galleryImages);
          eventData.galleryImages = Array.isArray(parsedImages) ? parsedImages : [];
        } catch (e) {
          console.error("Error parsing gallery images:", e);
          eventData.galleryImages = [];
        }
      } else {
        eventData.galleryImages = [];
      }
      
      setEvent(eventData);
      
      // Fetch quick links
      try {
        const linksRes = await fetch(`/api/events/${Id}/links`);
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          setQuickLinks(linksData);
        }
      } catch (linkErr) {
        console.error("Error fetching quick links:", linkErr);
        // Don't fail the whole page if quick links fail
      }
      
      // Update additional participants array based on event settings
      if (eventData.allowSignups && eventData.participantsPerSignup > 1) {
        const additionalCount = eventData.participantsPerSignup - 1;
        const newParticipants: Participant[] = Array(additionalCount)
          .fill(null)
          .map(() => ({ name: "", email: "" }));
          
        setFormData(prev => ({
          ...prev,
          additionalParticipants: newParticipants
        }));
      }
    } catch (err) {
      console.error("Error details:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [Id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalParticipants: prev.additionalParticipants.map((p, i) => 
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          eventId: Id,
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
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        notes: "",
        additionalParticipants: formData.additionalParticipants.map(() => ({ name: "", email: "" }))
      });
      
      // Refresh event data to update attendee count
      fetchEventData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit signup");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if event is full
  const isEventFull = () => {
    if (!event?.showCapacity || !event?.maxAttendees) return false;
    return event.attendeeCount >= event.maxAttendees;
  };

  // Get remaining spots
  const getRemainingSpots = () => {
    if (!event?.showCapacity || !event?.maxAttendees) return null;
    return Math.max(0, event.maxAttendees - event.attendeeCount);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="animate-pulse">Loading event details...</div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error || "Event not found"}</p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          ← Back to Events
        </Button>
      </div>
      
      {/* Event Header */}
      <div className="relative mb-8">
        {event.featuredImage ? (
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-6">
            <Image 
              src={event.featuredImage}
              alt={event.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <div className="inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-medium mb-2">
                {event.eventType === "league" ? "League" : "Event"}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary text-white text-sm font-medium mb-2">
              {event.eventType === "league" ? "League" : "Event"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
          </div>
        )}
        
        {/* Event Meta Info */}
        <div className="flex flex-wrap gap-4 mb-6">
          {event.eventDate && (
            <div className="flex items-center text-gray-600">
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
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
          
          {event.showCapacity && event.maxAttendees && (
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>
                {event.attendeeCount} / {event.maxAttendees} registered
                {getRemainingSpots() !== null && (
                  <span className={isEventFull() ? "text-red-500 ml-2" : "text-green-600 ml-2"}>
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
            {quickLinks.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
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
                <Button onClick={() => setShowSignupForm(!showSignupForm)}>
                  {showSignupForm ? "Hide Signup Form" : "Sign Up Now"}
                </Button>
              )}
            </>
          )}
          
          <Button variant="outline" onClick={() => window.open(`/api/events/${Id}/calendar`, "_blank")}>
            Add to Calendar
          </Button>
          
          <Button variant="outline" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Check out this event: ${window.location.href}`)}`)} >
            Share
          </Button>
        </div>
      </div>
      
      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {event.galleryImages && event.galleryImages.length > 0 && (
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
          )}
          {event.allowSignups && (
            <TabsTrigger value="participants">Participants</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="details" className="mt-6">
          {event.description && (
            <div className="prose max-w-none mb-6">
              <p>{event.description}</p>
            </div>
          )}
          
          {event.detailedContent ? (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.detailedContent }} />
          ) : (
            <div className="text-gray-500 italic">No detailed information available.</div>
          )}
        </TabsContent>
        
        <TabsContent value="gallery" className="mt-6">
          {event.galleryImages && event.galleryImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {event.galleryImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <Image 
                    src={image}
                    alt={`${event.title} - Image ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No gallery images available.</div>
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
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${isEventFull() ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(100, (event.attendeeCount / event.maxAttendees) * 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {isEventFull() 
                  ? "This event is full." 
                  : `${getRemainingSpots()} spot${getRemainingSpots() === 1 ? "" : "s"} remaining`}
              </p>
            </div>
          ) : (
            <p className="mb-6">No capacity limit for this event.</p>
          )}
          
          {/* This would typically show a list of participants, but for privacy reasons,
              we'll just show a count or a message */}
          <p className="text-gray-600">
            {event.attendeeCount > 0 
              ? `${event.attendeeCount} ${event.attendeeCount === 1 ? "person has" : "people have"} registered for this event.` 
              : "Be the first to sign up for this event!"}
          </p>
        </TabsContent>
      </Tabs>
      
      {/* Signup Form */}
      {showSignupForm && event.allowSignups && !isEventFull() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sign Up for {event.title}</CardTitle>
              <CardDescription>
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
                  <h3 className="font-medium">Primary Participant</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={submitting}
                    />
                  </div>
                </div>
                
                {/* Additional Participants */}
                {formData.additionalParticipants.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-medium">Additional Participants</h3>
                    
                    {formData.additionalParticipants.map((participant, index) => (
                      <div key={index} className="space-y-4 p-4 bg-gray-50 rounded-md">
                        <h4 className="font-medium">Participant {index + 2}</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`participant-${index}-name`}>Name</Label>
                          <Input
                            id={`participant-${index}-name`}
                            value={participant.name}
                            onChange={(e) => handleParticipantChange(index, "name", e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`participant-${index}-email`}>Email</Label>
                          <Input
                            id={`participant-${index}-email`}
                            type="email"
                            value={participant.email}
                            onChange={(e) => handleParticipantChange(index, "email", e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <p className="text-sm text-gray-500">
                      Additional participants are optional. You can leave these fields blank if you're registering just yourself.
                    </p>
                  </div>
                )}
                
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    disabled={submitting}
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
    </div>
  );
}
