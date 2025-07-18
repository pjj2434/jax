// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/nav";

interface Section {
  id: string;
  title: string;
  description: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  sectionId: string | null;
  maxAttendees: number | null;
  showCapacity: boolean;
  attendeeCount: number;
  eventType: string;
  isActive: boolean;
}

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  // Refs for scrolling
  const eventsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sections
        const sectionsRes = await fetch('/api/sections', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!sectionsRes.ok) throw new Error('Failed to fetch sections');
        const sectionsData = await sectionsRes.json();
        setSections(sectionsData);

        // Fetch events
        const eventsRes = await fetch('/api/events', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (!eventsRes.ok) throw new Error('Failed to fetch events');
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      } catch (err) {
        setError('Error loading data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group events by section and filter out sections with no active events
  const eventsBySection = sections
    .map(section => {
      const sectionEvents = events.filter(event => event.sectionId === section.id && event.isActive);
      return {
        ...section,
        events: sectionEvents
      };
    })
    .filter(section => section.events.length > 0); // Only show sections with active events

  // Check if there are any active events at all
  const hasAnyActiveEvents = events.filter(event => event.isActive).length > 0;

  // Determine if an event has minimal content
  const hasMinimalContent = (event: Event) => {
    return !event.description && !event.eventDate && !event.location;
  };

  // Check if an event is full - only if showCapacity is true
  const isEventFull = (event: Event) => {
    if (!event.showCapacity || !event.maxAttendees) return false;
    return event.attendeeCount >= event.maxAttendees;
  };

  // Get remaining spots for an event - only if showCapacity is true
  const getRemainingSpots = (event: Event) => {
    if (!event.showCapacity || !event.maxAttendees) return null;
    return Math.max(0, event.maxAttendees - event.attendeeCount);
  };

  // Handle contact form changes
 const [contactForm, setContactForm] = useState({
  name: "",
  email: "",
  message: ""
});

const [submitting, setSubmitting] = useState(false);

const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setContactForm(prev => ({ ...prev, [name]: value }));
};

const handleContactSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(contactForm),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    toast.success("Message sent successfully! We'll get back to you soon.");
    
    // Reset form
    setContactForm({
      name: "",
      email: "",
      message: ""
    });
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to send message");
    console.error("Contact form error:", err);
  } finally {
    setSubmitting(false);
  }
};

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen p-4">
        <div className="container mx-auto">
          <div className="bg-red-900/50 border border-red-700 text-red-100 p-4 rounded">
            <h2 className="font-bold mb-2">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      <Navbar hasActiveEvents={hasAnyActiveEvents} />
      {/* Hero Section with Full-Screen Height Image */}
      <div id="hero" className="relative overflow-hidden h-screen">
        {/* Semi-transparent overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src="/jax.jpg"
            alt="Darts Bar background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
            quality={90}
          />
        </div>
        
        {/* Hero Content - Centered Vertically and Horizontally */}
        <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-20">
          <div className="max-w-3xl text-center">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              JAX
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-white/90"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Join our dart tournaments, leagues, and special events
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {hasAnyActiveEvents && (
                <Button size="lg" variant="default" asChild className="font-medium bg-primary hover:bg-primary/90">
                  <a href="#events">View Events</a>
                </Button>
              )}
              <Button size="lg" variant="default" asChild className="font-medium  text-white hover:bg-black/10">
                <a href="#about">About Us</a>
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll Down Indicator - Only show if there are events */}
        {hasAnyActiveEvents && (
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ 
              opacity: { delay: 1, duration: 1 },
              y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            }}
          >
            <a href="#events" className="flex flex-col items-center text-white">
              <span className="text-sm mb-2">Scroll Down</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </a>
          </motion.div>
        )}
      </div>

      {/* Events Section - Only show if there are active events */}
      {hasAnyActiveEvents && (
        <div id="events" ref={eventsRef} className="py-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Upcoming Tournaments & Events
          </motion.h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-lg">Loading events...</p>
            </div>
          ) : (
            eventsBySection.map((section, sectionIndex) => (
              <motion.div 
                key={section.id} 
                className="mb-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeIn}
                transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
              >
                <h3 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-3">{section.title}</h3>
                {section.description && (
                  <p className="text-gray-400 mb-6 ml-4">{section.description}</p>
                )}

                {section.events.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                  >
                    {section.events.map(event => {
                      const eventIsFull = isEventFull(event);
                      const remainingSpots = getRemainingSpots(event);
                      
                      return (
                        <motion.div 
                          key={event.id}
                          variants={fadeIn}
                          className={hasMinimalContent(event) ? "col-span-1" : "col-span-1 md:col-span-1 lg:col-span-1"}
                        >
                         <Card key={event.id} className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
  <CardHeader className={hasMinimalContent(event) ? "pb-2" : ""}>
    <div className="flex justify-between items-start mb-2">
      <div className="inline-block px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {event.eventType === "league" ? "League" : 
                 event.eventType === "tournament" ? "Tournament" :
                 event.eventType === "workshop" ? "Workshop" :
                 event.eventType === "social" ? "Social" :
                 event.eventType === "competition" ? "Competition" :
                 "Event"}
      </div>
      {event.showCapacity && event.maxAttendees && (
        <div className={`text-xs font-medium ${isEventFull(event) ? "text-red-500" : "text-green-600"}`}>
          {event.attendeeCount}/{event.maxAttendees}
        </div>
      )}
    </div>
    <CardTitle>{event.title}</CardTitle>
    {event.eventDate && (
      <CardDescription>
        {new Date(event.eventDate).toLocaleDateString()}
      </CardDescription>
    )}
  </CardHeader>
  
  <CardContent className="flex-grow">
    {event.description && <p>{event.description}</p>}
    {event.location && (
      <p className="mt-2 text-sm text-gray-500">
        Location: {event.location}
      </p>
    )}
    
    {/* Show capacity information only if showCapacity is true and maxAttendees is set */}
    {event.showCapacity && event.maxAttendees && (
      <div className="mt-3">
        {/* Capacity display code... */}
      </div>
    )}
  </CardContent>
  
  <CardFooter className={hasMinimalContent(event) ? "pt-2" : ""}>
    {event.isActive ? (
      <Link href={`/events/${event.id}`} passHref className="w-full">
        <Button className="w-full">
          {event.eventType === "league" ? "View League" : 
   event.eventType === "tournament" ? "View Tournament" :
   event.eventType === "workshop" ? "View Workshop" :
   event.eventType === "social" ? "View Social" :
   event.eventType === "competition" ? "View Competition" :
   "View Event"}
        </Button>
      </Link>
    ) : (
      <div className="w-full text-center">
        <span className="text-sm text-gray-500">Event Inactive</span>
      </div>
    )}
  </CardFooter>
</Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <p className="text-gray-400 text-center">No events in this section.</p>
                )}
              </motion.div>
            ))
          )}

          {/* Show events without a section */}
          {events.filter(event => !event.sectionId && event.isActive).length > 0 && (
            <motion.div 
              className="mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-2xl font-semibold mb-4 border-l-4 border-primary pl-3">Other Events</h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {events
                  .filter(event => !event.sectionId && event.isActive)
                  .map(event => {
                    const eventIsFull = isEventFull(event);
                    const remainingSpots = getRemainingSpots(event);
                    
                    return (
                      <motion.div 
                        key={event.id}
                        variants={fadeIn}
                        className={hasMinimalContent(event) ? "col-span-1" : "col-span-1 md:col-span-1 lg:col-span-1"}
                      >
                        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 bg-gray-600 border-gray-800">
                          <CardHeader className={`${hasMinimalContent(event) ? "pb-2" : ""} text-center`}>
                            <CardTitle className="text-white">{event.title}</CardTitle>
                            {event.eventDate && (
                              <CardDescription className="text-gray-400">
                                {new Date(event.eventDate).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </CardDescription>
                            )}
                          </CardHeader>
                          
                          <CardContent className="flex-grow text-center">
                            {event.description && <p className="text-gray-300">{event.description}</p>}
                            {event.location && (
                              <p className="mt-2 text-sm text-gray-400">
                                Location: {event.location}
                              </p>
                            )}
                            
                            {/* Show capacity information only if showCapacity is true and maxAttendees is set */}
                            {event.showCapacity && event.maxAttendees && (
                              <div className="mt-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-400">Capacity:</span>
                                  <span className={eventIsFull ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                                    {event.attendeeCount} / {event.maxAttendees}
                                  </span>
                                </div>
                                
                                {/* Progress bar for capacity */}
                                <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
                                  <div 
                                    className={`h-2 rounded-full ${eventIsFull ? "bg-red-500" : "bg-green-500"}`}
                                    style={{ width: `${Math.min(100, (event.attendeeCount / event.maxAttendees) * 100)}%` }}
                                  ></div>
                                </div>
                                
                                {/* Remaining spots text */}
                                <p className="text-xs mt-1 text-gray-500">
                                  {eventIsFull 
                                    ? "No spots remaining" 
                                    : `${remainingSpots} spot${remainingSpots === 1 ? "" : "s"} remaining`}
                                </p>
                              </div>
                            )}
                          </CardContent>
                          
                          <CardFooter className={`${hasMinimalContent(event) ? "pt-2" : ""} flex justify-center`}>
                            {/* Show disabled button only if capacity is enabled and the event is full */}
                            {event.showCapacity && eventIsFull ? (
                              <Button 
                                className="w-full" 
                                variant="outline" 
                                disabled
                              >
                                Signup Full
                              </Button>
                            ) : (
                              <Link href={`/events/${event.id}/signup`} passHref className="w-full">
                                <Button className="w-full bg-primary hover:bg-primary/90">Sign Up</Button>
                              </Link>
                            )}
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </motion.div>
          )}


        </div>
      </div>
      )}

{/* About Section */}
<div id="about" ref={aboutRef} className="py-16 bg-gray-600 border-t border-gray-800">
  <div className="container mx-auto px-4">
    <motion.h2 
      className="text-3xl font-bold mb-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      About JAX 
    </motion.h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image 
            src="/jax.jpg" // Replace with an image of your bar
            alt="JAX Darts Bar"
            fill
            className="object-cover"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        <h3 className="text-2xl font-semibold border-l-4 border-primary pl-3">The Premier Darts Destination</h3>
        <div className="text-gray-300 space-y-4">
          <p>
            Established in January 1980, Jax has proudly served as a cornerstone of Long Island's dart community for over four decades. Our welcoming atmosphere has made us a beloved Stapleton institution where both seasoned players and newcomers gather to enjoy the timeless sport of darts.
          </p>
          <p>
            We're passionate about cultivating the dart community through our comprehensive monthly tournaments and league opportunities. Whether you're looking to join a team or showcase your individual skills, we offer leagues tailored to every ability level—from beginners just learning the basics to experienced sharpshooters aiming for the bullseye.
          </p>
          <p>
            Conveniently located just three minutes from the Long Island Expressway, Jax combines accessibility with tradition. Stop by to enjoy a cold drink, test your dart skills, and become part of a community that has been bringing people together through friendly competition for generations.
          </p>
        </div>
      </motion.div>
    </div>

    
  </div>
</div>


      {/* Contact Section */}
      <div id="contact" ref={contactRef} className="py-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <motion.h2 
            className="text-3xl font-bold mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Contact Us
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h3 className="text-2xl font-semibold border-l-4 border-primary pl-3">Get In Touch</h3>
              <p className="text-gray-300">
                Have questions about our events, leagues, or private bookings? 
                Send us a message and we'll get back to you as soon as possible.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Address</h4>
                    <p className="text-gray-400">720 Portion Rd, Ronkonkoma, NY 11779</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Phone</h4>
                    <p className="text-gray-400">(631) 467-9703</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Email</h4>
                    <p className="text-gray-400">info@jaxdartsbar.com</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">Hours</h4>
                    <p className="text-gray-400">Mon-Thu: 2pm-12am | Fri & Sat: 12pm-12am |Sun: 12pm-10pm</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <form onSubmit={handleContactSubmit} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
  <div className="space-y-4">
    <div>
      <Label htmlFor="name" className="text-white">Name</Label>
      <Input 
        id="name" 
        name="name" 
        value={contactForm.name} 
        onChange={handleContactChange} 
        required 
        className="bg-gray-800 border-gray-700 text-white"
        disabled={submitting}
      />
    </div>
    
    <div>
      <Label htmlFor="email" className="text-white">Email</Label>
      <Input 
        id="email" 
        name="email" 
        type="email" 
        value={contactForm.email} 
        onChange={handleContactChange} 
        required 
        className="bg-gray-800 border-gray-700 text-white"
        disabled={submitting}
      />
    </div>
    
    <div>
      <Label htmlFor="message" className="text-white">Message</Label>
      <Textarea 
        id="message" 
        name="message" 
        value={contactForm.message} 
        onChange={handleContactChange} 
        required 
        rows={5}
        className="bg-gray-800 border-gray-700 text-white"
        disabled={submitting}
      />
    </div>
    
    <Button 
      type="submit" 
      className="w-full bg-primary hover:bg-primary/90"
      disabled={submitting}
    >
      {submitting ? "Sending..." : "Send Message"}
    </Button>
  </div>
</form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Image 
                src="/logo.png" // Replace with your logo
                alt="JAX  Bar"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© {new Date().getFullYear()} JAX. All rights reserved.</p>
              <p className="mt-1">
                <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a> | 
                <a href="#" className="text-primary hover:text-primary/80 ml-2">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
