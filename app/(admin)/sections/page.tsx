// app/admin/sections/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";

interface Section {
  id: string;
  title: string;
  description: string | null;
  order: number;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
  });

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sections");
      if (!res.ok) throw new Error("Failed to fetch sections");
      const data = await res.json();
      setSections(data);
    } catch (err) {
      setError("Error loading sections");
      toast.error("Failed to load sections");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSection) {
        // Update existing section
        const res = await fetch("/api/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSection.id,
            ...formData,
            order: parseInt(formData.order.toString()),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update section");
        }

        toast.success("Section updated successfully");
      } else {
        // Create new section
        const res = await fetch("/api/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            order: parseInt(formData.order.toString()),
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to create section");
        }

        toast.success("Section created successfully");
      }

      // Reset form and refresh data
      resetForm();
      fetchSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleEdit = (section: Section) => {
    setEditingSection(section);
    setFormData({
      title: section.title,
      description: section.description || "",
      order: section.order,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    
    try {
      const res = await fetch(`/api/sections?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete section");
      }

      toast.success("Section deleted successfully");
      fetchSections();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete section");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", order: 0 });
    setEditingSection(null);
    setIsCreating(false);
  };

  const moveSection = async (id: string, direction: "up" | "down") => {
    const sectionIndex = sections.findIndex(s => s.id === id);
    if (
      (direction === "up" && sectionIndex === 0) ||
      (direction === "down" && sectionIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === "up" ? sectionIndex - 1 : sectionIndex + 1;
    
    // Swap order values
    const currentOrder = newSections[sectionIndex].order;
    newSections[sectionIndex].order = newSections[targetIndex].order;
    newSections[targetIndex].order = currentOrder;

    try {
      // Update both sections
      await Promise.all([
        fetch("/api/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newSections[sectionIndex].id,
            title: newSections[sectionIndex].title,
            description: newSections[sectionIndex].description,
            order: newSections[sectionIndex].order,
          }),
        }),
        fetch("/api/sections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newSections[targetIndex].id,
            title: newSections[targetIndex].title,
            description: newSections[targetIndex].description,
            order: newSections[targetIndex].order,
          }),
        }),
      ]);

      toast.success("Section order updated");
      fetchSections();
    } catch (err) {
      toast.error("Failed to update section order");
    }
  };

  if (loading && sections.length === 0) {
    return <div className="container mx-auto p-4">Loading sections...</div>;
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
        <h1 className="text-3xl font-bold">Manage Sections</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? "Cancel" : "Add Section"}
        </Button>
      </div>

      {isCreating && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingSection ? "Edit Section" : "Create New Section"}</CardTitle>
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
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingSection ? "Update Section" : "Create Section"}
                </Button>
                {editingSection && (
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

      {sections.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section.id}>
                <TableCell className="font-medium">{section.order}</TableCell>
                <TableCell>{section.title}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {section.description || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveSection(section.id, "up")}
                      disabled={sections.indexOf(section) === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveSection(section.id, "down")}
                      disabled={sections.indexOf(section) === sections.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(section)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(section.id)}
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
          <p className="text-gray-500">No sections found. Create your first section to get started.</p>
        </div>
      )}
      </SidebarInset>
    </div>
  );
}
