"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";

interface ScheduleEvent {
  id: string;
  eventId: string;
  order: number;
  event: {
    id: string;
    title: string;
    description: string | null;
    eventDate: string | null;
    location: string | null;
    eventType: string;
    featuredImage: string | null;
    isActive: boolean;
  };
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch('/api/schedule', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!res.ok) throw new Error('Failed to fetch schedule');
        const data = await res.json();
        setSchedule(data);
      } catch (err) {
        setError('Error loading schedule. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

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
    <div className="bg-black text-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 flex-shrink-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/logo.png" 
                  alt="JAX" 
                  width={80} 
                  height={32} 
                  className="h-8 w-auto"
                />
              </Link>
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold">Schedule</h1>
                <p className="text-gray-400 text-sm">Upcoming events and activities</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-gray-700 text-black hover:bg-gray-800">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-lg text-gray-400">Loading schedule...</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Events Scheduled</h2>
              <p className="text-gray-400 mb-6">
                Check back later for upcoming events and activities.
              </p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Event Schedule</h1>
              <p className="text-gray-400 text-lg">Upcoming events and activities at JAX</p>
            </div>

            <div className="grid gap-6">
              {schedule.map((scheduleItem, index) => (
                <motion.div
                  key={scheduleItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-1 rounded-full bg-primary/10 text-white text-xs font-medium">
                              {scheduleItem.event.eventType === "league" ? "League" : 
                               scheduleItem.event.eventType === "tournament" ? "Tournament" :
                               scheduleItem.event.eventType === "workshop" ? "Workshop" :
                               scheduleItem.event.eventType === "social" ? "Social" :
                               scheduleItem.event.eventType === "competition" ? "Competition" :
                               "Event"}
                            </span>
                            <span className="text-sm text-gray-00">#{scheduleItem.order + 1}</span>
                          </div>
                          <CardTitle className="text-xl md:text-2xl text-white">{scheduleItem.event.title}</CardTitle>
                          {scheduleItem.event.description && (
                            <CardDescription className="text-gray-400 mt-2">
                              {scheduleItem.event.description}
                            </CardDescription>
                          )}
                        </div>
                        
                        {scheduleItem.event.featuredImage && (
                          <div className="relative w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={scheduleItem.event.featuredImage}
                              alt={scheduleItem.event.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scheduleItem.event.eventDate && (
                          <div className="flex items-center space-x-2 text-gray-300">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>
                              {new Date(scheduleItem.event.eventDate).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        
                        {scheduleItem.event.location && (
                          <div className="flex items-center space-x-2 text-gray-300">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{scheduleItem.event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        {scheduleItem.event.isActive ? (
                          <Link href={`/events/${scheduleItem.event.id}`}>
                            <Button className="bg-primary hover:bg-primary/90">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        ) : (
                          <div className="text-center">
                            <span className="text-sm text-gray-500"></span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-gray-800 flex-shrink-0">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Image 
                src="/logo.png"
                alt="JAX"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>© {new Date().getFullYear()} JAX. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 