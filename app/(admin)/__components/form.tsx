// components/EventForm.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { UploadButton } from "@/components/ui/uploadbutton";
import { SimpleUpload } from "@/components/ui/simple-upload";
import { Editor } from "@/components/ui/editor";
import { GalleryViewer } from "@/components/ui/gallery-viewer";
import { deleteUploadThingFileClient } from "@/lib/uploadthing";

interface EventFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  sections: Array<{ id: string; title: string }>;
}

export default function EventForm({ initialData, onSubmit, onCancel, sections = [] }: EventFormProps) {
  let galleryImages: string[] = [];
  if (initialData?.galleryImages) {
    try {
      galleryImages = JSON.parse(initialData.galleryImages);
      if (!Array.isArray(galleryImages)) galleryImages = [];
    } catch {
      galleryImages = [];
    }
  }
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    eventDate: initialData?.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : "",
    location: initialData?.location || "",
    maxAttendees: initialData?.maxAttendees?.toString() || "",
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    showCapacity: initialData?.showCapacity !== undefined ? initialData.showCapacity : true,
    sectionId: initialData?.sectionId || "none",
    
    // New fields
    eventType: initialData?.eventType || "event",
    logoType: initialData?.logoType || "jsl",
    allowSignups: initialData?.allowSignups !== undefined ? initialData.allowSignups : true,
    participantsPerSignup: initialData?.participantsPerSignup || 1,
    featuredImage: initialData?.featuredImage || "",
    galleryImages,
    detailedContent: initialData?.detailedContent || "",
    quickLinks: initialData?.quickLinks || [],
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [galleryViewerOpen, setGalleryViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (field: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: string) => (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, detailedContent: content }));
  };

  const handleFeaturedImageUpload = (url: string) => {
    console.log("Setting featured image URL:", url);
    setFormData(prev => ({ ...prev, featuredImage: url }));
    toast.success("Featured image uploaded");
  };

  const removeFeaturedImage = async () => {
    const imageUrl = formData.featuredImage;
    
    // Remove from form state first
    setFormData(prev => ({
      ...prev,
      featuredImage: ""
    }));

    // Delete from UploadThing if it's a new image (not from initial data)
    if (imageUrl && imageUrl !== initialData?.featuredImage) {
      try {
        await deleteUploadThingFileClient(imageUrl);
        console.log('Deleted featured image from UploadThing:', imageUrl);
      } catch (error) {
        console.error('Error deleting featured image from UploadThing:', error);
      }
    }
  };

  const handleGalleryImageUpload = (url: string) => {
    console.log("Adding gallery image URL:", url);
    setFormData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, url] }));
    toast.success("Gallery image uploaded");
  };

  const removeGalleryImage = async (index: number) => {
    const imageUrl = formData.galleryImages[index];
    
    // Remove from form state first
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== index)
    }));

    // Delete from UploadThing if it's a new image (not from initial data)
    if (imageUrl && !initialData?.galleryImages?.includes(imageUrl)) {
      try {
        await deleteUploadThingFileClient(imageUrl);
        console.log('Deleted gallery image from UploadThing:', imageUrl);
      } catch (error) {
        console.error('Error deleting gallery image from UploadThing:', error);
      }
    }
  };

  const addQuickLink = () => {
    setFormData(prev => ({
      ...prev,
      quickLinks: [...prev.quickLinks, { title: "", url: "", order: prev.quickLinks.length }]
    }));
  };

  const updateQuickLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link: any, i: number) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeQuickLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      quickLinks: prev.quickLinks.filter((_: any, i: number) => i !== index).map((link: any, i: number) => ({
        ...link,
        order: i
      }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Process the data for submission
      const processedData = {
        ...formData,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        sectionId: formData.sectionId === "none" ? null : formData.sectionId,
        galleryImages: JSON.stringify(formData.galleryImages),
      };
      
      await onSubmit(processedData);
      
      // Always update quick links for existing events, even if empty
      if (initialData?.id) {
        try {
          const quickLinksRes = await fetch(`/api/events/${initialData.id}/links`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quickLinks: formData.quickLinks
            }),
          });
          
          if (!quickLinksRes.ok) {
            console.error('Failed to save quick links');
          }
        } catch (error) {
          console.error('Error saving quick links:', error);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 overflow-x-auto whitespace-nowrap px-1 sm:px-0">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details & Content</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="links">Quick Links</TabsTrigger>
          <TabsTrigger value="signup">Signup Options</TabsTrigger>
        </TabsList>
        
        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
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
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sectionId">Section</Label>
            <Select
              value={formData.sectionId}
              onValueChange={handleSelectChange("sectionId")}
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
          
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select
              value={formData.eventType}
              onValueChange={handleSelectChange("eventType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="league">League</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logoType">Logo Type</Label>
            <Select
              value={formData.logoType}
              onValueChange={handleSelectChange("logoType")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select logo type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jsl">JSL Logo</SelectItem>
                <SelectItem value="jax">JAX Logo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange("isActive")}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </TabsContent>
        
        {/* Details & Content Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="space-y-2">
            <Label>Detailed Content</Label>
            <Editor 
              value={formData.detailedContent} 
              onChange={handleEditorChange}
            />
          </div>
        </TabsContent>
        
        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label>Featured Image</Label>
                <SimpleUpload
                  endpoint="eventImage"
                  onClientUploadComplete={(res) => {
                    console.log('Upload response:', res);
                    if (res && res[0] && res[0].url) {
                      handleFeaturedImageUpload(res[0].url);
                    } else {
                      toast.error('Upload completed but no URL received');
                    }
                  }}
                  onUploadError={(error: Error) => {
                    console.error('Upload error:', error);
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                />
                
                {formData.featuredImage && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600 mb-2 block">Current Featured Image:</Label>
                    <div className="relative">
                      <img 
                        src={formData.featuredImage} 
                        alt="Featured" 
                        className="w-full h-48 object-cover object-center rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeFeaturedImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Label>Gallery Images</Label>
                <SimpleUpload
                  endpoint="galleryImages"
                  onClientUploadComplete={(res) => {
                    console.log('Gallery upload response:', res);
                    if (res && Array.isArray(res)) {
                      res.forEach((file: any) => {
                        if (file && file.url) {
                          handleGalleryImageUpload(file.url);
                        }
                      });
                    } else {
                      toast.error('Upload completed but no files received');
                    }
                  }}
                  onUploadError={(error: Error) => {
                    console.error('Gallery upload error:', error);
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                />
                
                {formData.galleryImages.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600 mb-2 block">Current Gallery Images ({formData.galleryImages.length}):</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.galleryImages.map((image: string, index: number) => (
                        <div key={index} className="relative group cursor-pointer">
                          <img 
                            src={image} 
                            alt={`Gallery ${index + 1}`} 
                            className="w-full h-32 object-cover object-center rounded-md transition-transform group-hover:scale-105"
                            onClick={() => {
                              setSelectedImageIndex(index);
                              setGalleryViewerOpen(true);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                              Click to view
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeGalleryImage(index);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Quick Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Quick Links</Label>
            <Button type="button" onClick={addQuickLink} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Link
            </Button>
          </div>
          
          <div className="space-y-4">
            {formData.quickLinks.map((link: { title: string; url: string; order: number }, index: number) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <Label>Link #{index + 1}</Label>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeQuickLink(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Link Title</Label>
                    <Input
                      value={link.title}
                      onChange={(e) => updateQuickLink(index, "title", e.target.value)}
                      placeholder="e.g., Register Now"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => updateQuickLink(index, "url", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {formData.quickLinks.length === 0 && (
              <div className="text-center py-8 text-gray-500 border rounded-md">
                No quick links added yet. Click "Add Link" to create one.
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Signup Options Tab */}
        <TabsContent value="signup" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="allowSignups"
              checked={formData.allowSignups}
              onCheckedChange={handleSwitchChange("allowSignups")}
            />
            <Label htmlFor="allowSignups">Allow Signups</Label>
          </div>
          
          {formData.allowSignups && (
            <>
              <div className="space-y-2">
                <Label htmlFor="participantsPerSignup">Participants Per Signup</Label>
                <Select
                  value={formData.participantsPerSignup.toString()}
                  onValueChange={(value) => handleNumberChange("participantsPerSignup")(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of participants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 person</SelectItem>
                    <SelectItem value="2">2 people</SelectItem>
                    <SelectItem value="3">3 people</SelectItem>
                    <SelectItem value="4">4 people</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Allow registrants to add multiple participants in a single signup
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCapacity"
                    checked={formData.showCapacity}
                    onCheckedChange={handleSwitchChange("showCapacity")}
                  />
                  <Label htmlFor="showCapacity">Show & Enforce Capacity Limits</Label>
                </div>
                
                {formData.showCapacity && (
                  <div className="pl-6 pt-2">
                    <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                    <Input
                      id="maxAttendees"
                      name="maxAttendees"
                      type="number"
                      value={formData.maxAttendees}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Set to 0 or leave empty for unlimited capacity
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
