import React from "react";
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

export const revalidate = 60;

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
}

export default async function EventsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const sectionsRes = await fetch(`${baseUrl}/api/sections`, { next: { revalidate: 60 } });
  const sections: Section[] = sectionsRes.ok ? await sectionsRes.json() : [];
  const eventsRes = await fetch(`${baseUrl}/api/events`, { next: { revalidate: 60 } });
  const eventsData: Event[] = eventsRes.ok ? await eventsRes.json() : [];
  // Fetch quick links for each event
  const eventsWithLinks: Event[] = await Promise.all(
    eventsData.map(async (event) => {
      const linksRes = await fetch(`${baseUrl}/api/events/${event.id}/links`, { next: { revalidate: 60 } });
      const quickLinks = linksRes.ok ? await linksRes.json() : [];
      return { ...event, quickLinks };
    })
  );
  // Render your admin event list page here, passing eventsWithLinks and sections to client components as needed
  // ... existing code ...
}
