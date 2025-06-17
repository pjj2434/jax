// app/admin/events/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Plus } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface Section {
  id: string;
  title: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  location: string | null;
  maxAttendees: number | null;
  isActive: boolean;
  showCapacity: boolean; // Added showCapacity field
  sectionId: string | null;
  attendeeCount?: number; // Optional attendee count
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    maxAttendees: "",
    isActive: true,
    showCapacity: true, // Added showCapacity field
    sectionId: "none",
  });

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
      setEvents(eventsData);
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
      const eventData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        sectionId: formData.sectionId === "none" ? null : formData.sectionId,
      };

      if (editingEvent) {
        // Update existing event
        const res = await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEvent.id,
            ...eventData,
          }),
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

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : "",
      location: event.location || "",
      maxAttendees: event.maxAttendees?.toString() || "",
      isActive: event.isActive,
      showCapacity: event.showCapacity !== undefined ? event.showCapacity : true, // Handle showCapacity
      sectionId: event.sectionId || "none", // Use "none" if sectionId is null or empty
    });
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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      eventDate: "",
      location: "",
      maxAttendees: "",
      isActive: true,
      showCapacity: true, // Reset to default true
      sectionId: "none",
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sectionId">Section</Label>
                <Select
                  value={formData.sectionId}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Section</SelectItem>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Event Status Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleSwitchChange("isActive")}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              {/* Capacity Settings */}
              <div className="border p-4 rounded-md space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCapacity"
                    checked={formData.showCapacity}
                    onCheckedChange={handleSwitchChange("showCapacity")}
                  />
                  <Label htmlFor="showCapacity">Show & Enforce Capacity Limits</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees" className={!formData.showCapacity ? "text-gray-400" : ""}>
                    Maximum Attendees
                  </Label>
                  <Input
                    id="maxAttendees"
                    name="maxAttendees"
                    type="number"
                    value={formData.maxAttendees}
                    onChange={handleChange}
                    disabled={!formData.showCapacity}
                    className={!formData.showCapacity ? "bg-gray-100" : ""}
                  />
                  {formData.showCapacity && (
                    <p className="text-xs text-gray-500">
                      Set to 0 or leave empty for unlimited capacity
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit">
                  {editingEvent ? "Update Event" : "Create Event"}
                </Button>
                {editingEvent && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {events.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No events found. Create your first event to get started.</p>
        </div>
      )}
      </SidebarInset>
    </div>
  );
}
