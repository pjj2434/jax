// app/admin/signups/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Download, Eye, Search, X } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface Event {
  id: string;
  title: string;
}

interface Signup {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function SignupsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filteredSignups, setFilteredSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("all"); // Changed from empty string to "all"
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewingSignup, setViewingSignup] = useState<Signup | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch events
      const eventsRes = await fetch("/api/events");
      if (!eventsRes.ok) throw new Error("Failed to fetch events");
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
      
      // Fetch all signups
      const signupsRes = await fetch("/api/signups");
      if (!signupsRes.ok) throw new Error("Failed to fetch signups");
      const signupsData = await signupsRes.json();
      setSignups(signupsData);
      setFilteredSignups(signupsData);
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

  useEffect(() => {
    // Apply filters whenever selectedEventId or searchTerm changes
    let filtered = [...signups];
    
    if (selectedEventId && selectedEventId !== "all") { // Changed condition
      filtered = filtered.filter(signup => signup.eventId === selectedEventId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(signup => 
        signup.name.toLowerCase().includes(term) || 
        signup.email.toLowerCase().includes(term) || 
        signup.phone.toLowerCase().includes(term)
      );
    }
    
    setFilteredSignups(filtered);
  }, [selectedEventId, searchTerm, signups]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signup?")) return;
    
    try {
      const res = await fetch(`/api/signups?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete signup");
      }

      toast.success("Signup deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete signup");
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Name", "Email", "Phone", "Event", "Status", "Notes", "Signup Date"];
    
    const csvRows = [
      headers.join(","),
      ...filteredSignups.map(signup => {
        const event = events.find(e => e.id === signup.eventId)?.title || "Unknown Event";
        const date = new Date(signup.createdAt).toLocaleDateString();
        
        // Properly escape fields that might contain commas
        const escapeCsvField = (field: string) => {
          if (field && (field.includes(",") || field.includes('"') || field.includes("\n"))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };
        
        return [
          escapeCsvField(signup.name),
          escapeCsvField(signup.email),
          escapeCsvField(signup.phone),
          escapeCsvField(event),
          escapeCsvField(signup.status),
          escapeCsvField(signup.notes || ""),
          date
        ].join(",");
      })
    ].join("\n");
    
    // Create and trigger download
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `signups-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSelectedEventId("all"); // Changed from empty string to "all"
    setSearchTerm("");
  };

  if (loading && signups.length === 0) {
    return <div className="container mx-auto p-4">Loading signups...</div>;
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
        <h1 className="text-3xl font-bold">Event Signups</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="eventFilter" className="mb-2 block">Filter by Event</Label>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger id="eventFilter">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem> {/* Changed from empty string to "all" */}
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="searchFilter" className="mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchFilter"
                  placeholder="Search by name, email, or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {filteredSignups.length > 0 ? (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredSignups.length} {filteredSignups.length === 1 ? 'signup' : 'signups'}
            {selectedEventId !== "all" && ` for ${events.find(e => e.id === selectedEventId)?.title}`} {/* Changed condition */}
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSignups.map((signup) => {
                const event = events.find(e => e.id === signup.eventId);
                return (
                  <TableRow key={signup.id}>
                    <TableCell className="font-medium">{signup.name}</TableCell>
                    <TableCell>{signup.email}</TableCell>
                    <TableCell>{signup.phone}</TableCell>
                    <TableCell>{event?.title || "Unknown Event"}</TableCell>
                    <TableCell>
                      {new Date(signup.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setViewingSignup(signup)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(signup.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {signups.length === 0 
              ? "No signups found." 
              : "No signups match your current filters."}
          </p>
        </div>
      )}

      {/* Signup Details Dialog */}
      <Dialog open={!!viewingSignup} onOpenChange={(open) => !open && setViewingSignup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signup Details</DialogTitle>
            <DialogDescription>
              {viewingSignup && new Date(viewingSignup.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          {viewingSignup && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 font-medium">Name:</div>
                <div className="col-span-3">{viewingSignup.name}</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 font-medium">Email:</div>
                <div className="col-span-3">{viewingSignup.email}</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 font-medium">Phone:</div>
                <div className="col-span-3">{viewingSignup.phone}</div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 font-medium">Event:</div>
                <div className="col-span-3">
                  {events.find(e => e.id === viewingSignup.eventId)?.title || "Unknown Event"}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1 font-medium">Status:</div>
                <div className="col-span-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    viewingSignup.status === "registered" 
                      ? "bg-blue-100 text-blue-800" 
                      : viewingSignup.status === "attended"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {viewingSignup.status.charAt(0).toUpperCase() + viewingSignup.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {viewingSignup.notes && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 font-medium">Notes:</div>
                  <div className="col-span-3 whitespace-pre-wrap">{viewingSignup.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </SidebarInset>
    </div>
  );
}
