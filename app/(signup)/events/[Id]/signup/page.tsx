// app/events/[Id]/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { use } from "react"; // Import React.use

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
}

export default function SignupPage({ params }: { params: Promise<{ Id: string }> }) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const Id = resolvedParams.Id;
  
  const router = useRouter();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: ""
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log("Fetching event with ID:", Id);
        
        // Use the correct case for the ID parameter
        const res = await fetch(`/api/events?id=${Id}`, {
          cache: 'no-store'
        });
        
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Error response:", errorText);
          
          if (res.status === 404) {
            throw new Error("Event not found");
          }
          throw new Error(`Failed to fetch event: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Event data:", data);
        setEvent(data);
      } catch (err) {
        console.error("Error details:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [Id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          eventId: Id, // Use the correct case for the ID parameter
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit signup");
      }

      toast.success("Your signup has been submitted successfully!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit signup");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="container mx-auto p-4 text-center">
      <div className="animate-pulse">Loading event details...</div>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto p-4">
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
        <h2 className="font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!event) return (
    <div className="container mx-auto p-4">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded">
        <h2 className="font-bold mb-2">Event Not Found</h2>
        <p>The event you're looking for could not be found.</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Sign Up for {event.title}</CardTitle>
          {event.eventDate && (
            <CardDescription>
              {new Date(event.eventDate).toLocaleDateString()}
              {event.location && ` • ${event.location}`}
            </CardDescription>
          )}
          {!event.eventDate && event.location && (
            <CardDescription>
              Location: {event.location}
            </CardDescription>
          )}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
