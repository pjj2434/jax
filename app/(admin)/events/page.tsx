"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus, Mail } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import EventForm from "../__components/form";

// Custom hook for media queries
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

interface Section {
  id: string;
  title: string;
}

interface QuickLink {
  id: string;
  title: string;
  url: string;
  order: number;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  maxAttendees: number | null;
  isActive: boolean;
  showCapacity: boolean;
  sectionId: string | null;
  attendeeCount?: number;
  quickLinks?: QuickLink[];
  galleryImages?: string | string[];
  eventType?: string;
  logoType?: string;
  allowSignups?: boolean;
  participantsPerSignup?: number;
  featuredImage?: string;
  detailedContent?: string;
  addToSchedule?: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedEventForEmail, setSelectedEventForEmail] = useState<Event | null>(null);
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    maxAttendees: "",
    isActive: true,
    showCapacity: true,
    sectionId: "none",
    galleryImages: [],
    addToSchedule: false,
  });
  
  // Media query for responsive design
  const isMobile = useMediaQuery("(max-width: 640px)");

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch sections
      const sectionsRes = await fetch("/api/sections");
      if (!sectionsRes.ok) throw new Error("Failed to fetch sections");
      const sectionsData = await sectionsRes.json();
      setSections(sectionsData);
      
      // Fetch events
      const eventsRes = await fetch("/api/events");
      if (!eventsRes.ok) throw new Error("Failed to fetch events");
      const eventsData = await eventsRes.json();
      
      // Fetch quick links for each event
      const eventsWithLinks = await Promise.all(
        eventsData.map(async (event: Event) => {
          try {
            const linksRes = await fetch(`/api/events/${event.id}/links`, {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache'
              }
            });
            if (linksRes.ok) {
              const linksData = await linksRes.json();
              return { ...event, quickLinks: linksData };
            }
          } catch (error) {
            console.error(`Error fetching quick links for event ${event.id}:`, error);
          }
          return { ...event, quickLinks: [] };
        })
      );
      
      setEvents(eventsWithLinks);
    } catch (err) {
      setError("Error loading data");
      toast.error("Failed to load data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (field: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSelectChange = (value: string) => {
    // Convert "none" to null or empty string for the database
    setFormData(prev => ({ 
      ...prev, 
      sectionId: value === "none" ? "" : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Ensure galleryImages is an array
      let galleryImages = formData.galleryImages;
      if (typeof galleryImages === 'string') {
        try {
          galleryImages = JSON.parse(galleryImages);
        } catch {
          galleryImages = [];
        }
      }
      // Build payload, omitting createdAt, updatedAt, createdById if present
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        sectionId: formData.sectionId === "none" ? null : formData.sectionId,
        galleryImages,
      };
      if ('createdAt' in eventData) delete eventData.createdAt;
      if ('updatedAt' in eventData) delete eventData.updatedAt;
      if ('createdById' in eventData) delete eventData.createdById;

      if (editingEvent) {
        // Update existing event
        const res = await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEvent.id, ...eventData }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update event");
        }

        toast.success("Event updated successfully");
      } else {
        // Create new event
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to create event");
        }

        toast.success("Event created successfully");
      }

      // Reset form and refresh data
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = async (event: Event) => {
    setEditingEvent(event);
    
    // Check if event is already in schedule
    let isInSchedule = false;
    try {
      const scheduleRes = await fetch(`/api/schedule?eventId=${event.id}`);
      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        isInSchedule = scheduleData.length > 0;
        console.log('Schedule check for event:', event.id, 'isInSchedule:', isInSchedule, 'scheduleData:', scheduleData); // Debug log
      }
    } catch (error) {
      console.error('Error checking schedule status:', error);
    }
    
    const newFormData = {
      title: event.title,
      description: event.description || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : "",
      location: event.location || "",
      maxAttendees: event.maxAttendees?.toString() || "",
      isActive: event.isActive,
      showCapacity: event.showCapacity !== undefined ? event.showCapacity : true,
      sectionId: event.sectionId || "none",
      galleryImages: Array.isArray(event.galleryImages)
        ? event.galleryImages
        : (typeof event.galleryImages === 'string' && event.galleryImages.trim().startsWith('['))
          ? (() => { try { return JSON.parse(event.galleryImages); } catch { return []; } })()
          : [],
      addToSchedule: isInSchedule,
    };
    
    console.log('Setting form data for editing:', newFormData); // Debug log
    setFormData(newFormData);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const res = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete event");
      }

      toast.success("Event deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const handleEmailParticipants = (event: Event) => {
    setSelectedEventForEmail(event);
    setEmailData({ subject: "", message: "" });
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedEventForEmail || !emailData.subject || !emailData.message) {
      toast.error("Please fill in both subject and message");
      return;
    }

    setSendingEmail(true);
    
    try {
      const res = await fetch(`/api/events/${selectedEventForEmail.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to send email");
      }

      const result = await res.json();
      toast.success(result.message);
      setEmailModalOpen(false);
      setSelectedEventForEmail(null);
      setEmailData({ subject: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      location: "",
      maxAttendees: "",
      isActive: true,
      showCapacity: true,
      sectionId: "none",
      galleryImages: [],
      addToSchedule: false,
    });
    setEditingEvent(null);
    setIsCreating(false);
  };

  if (loading && events.length === 0) {
    return <div className="container mx-auto p-4">Loading events...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Banner Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <SidebarInset>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manage Events</h1>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? "Cancel" : "Add Event"}
          </Button>
        </div>

        {isCreating && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm
                initialData={editingEvent ? { ...editingEvent, addToSchedule: formData.addToSchedule } : undefined}
                onSubmit={async (data) => {
                  try {
                    console.log('Form data being submitted:', data); // Debug log
                    console.log('Form data addToSchedule:', data.addToSchedule); // Debug log
                    if (editingEvent) {
                      // Update event
                      const requestBody = { id: editingEvent.id, ...data };
                      console.log('PUT request body:', requestBody); // Debug log
                      const res = await fetch("/api/events", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                      });
                      if (!res.ok) throw new Error((await res.json()).error || "Failed to update event");
                      toast.success("Event updated successfully");
                    } else {
                      // Create event
                      const res = await fetch("/api/events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                      });
                      if (!res.ok) throw new Error((await res.json()).error || "Failed to create event");
                      toast.success("Event created successfully");
                    }
                    resetForm();
                    fetchData();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "An error occurred");
                  }
                }}
                onCancel={resetForm}
                sections={sections}
              />
            </CardContent>
          </Card>
        )}

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  {!isMobile && (
                    <>
                      <TableHead>Date</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Quick Links</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.title}
                      {isMobile && event.eventDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                      )}
                      {isMobile && (
                        <div className="text-xs text-gray-500">
                          {event.isActive ? "Active" : "Inactive"}
                          {event.sectionId && sections.find(s => s.id === event.sectionId) && 
                            ` • ${sections.find(s => s.id === event.sectionId)?.title}`
                          }
                        </div>
                      )}
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell>
                          {event.eventDate 
                            ? new Date(event.eventDate).toLocaleDateString() 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {event.sectionId 
                            ? sections.find(s => s.id === event.sectionId)?.title || "-" 
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            event.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {event.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {event.showCapacity ? (
                            event.maxAttendees ? (
                              <span className="text-sm">
                                {event.attendeeCount !== undefined ? `${event.attendeeCount}/` : ""}
                                {event.maxAttendees}
                              </span>
                            ) : (
                              <span className="text-sm">Unlimited</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-500">Disabled</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {event.quickLinks && event.quickLinks.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {event.quickLinks.map((link) => (
                                <span
                                  key={link.id}
                                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                                  title={link.url}
                                >
                                  {link.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEmailParticipants(event)}
                          title="Email participants"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(event)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No events found. Create your first event to get started.</p>
          </div>
        )}
      </SidebarInset>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Email Participants</DialogTitle>
            <DialogDescription>
              Send an email to all participants of "{selectedEventForEmail?.title}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject..."
                disabled={sendingEmail}
              />
            </div>
            
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter your message..."
                rows={8}
                disabled={sendingEmail}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEmailModalOpen(false)}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailData.subject || !emailData.message}
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
