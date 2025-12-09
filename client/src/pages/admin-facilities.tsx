import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Facility } from "@shared/schema";
import { Building2, Plus, Pencil, Trash2, Users, MapPin, Search, Loader2 } from "lucide-react";

const facilitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  capacity: z.number().min(1).optional(),
  location: z.string().optional(),
  status: z.enum(["available", "maintenance", "closed"]),
  amenities: z.string().optional(),
});

type FacilityFormData = z.infer<typeof facilitySchema>;

function FacilityDialog({ 
  open, 
  onOpenChange, 
  facility,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  facility?: Facility;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!facility;

  const form = useForm<FacilityFormData>({
    resolver: zodResolver(facilitySchema),
    defaultValues: {
      name: facility?.name || "",
      description: facility?.description || "",
      capacity: facility?.capacity || undefined,
      location: facility?.location || "",
      status: facility?.status || "available",
      amenities: facility?.amenities || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FacilityFormData) => {
      if (isEdit) {
        return apiRequest("PATCH", `/api/admin/facilities/${facility.id}`, data);
      }
      return apiRequest("POST", "/api/admin/facilities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      toast({
        title: isEdit ? "Facility updated" : "Facility created",
        description: isEdit ? "The facility has been updated." : "New facility has been added.",
      });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FacilityFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Facility" : "Add New Facility"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
            <Input id="name" {...form.register("name")} data-testid="input-facility-name" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} data-testid="input-facility-description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input 
                id="capacity" 
                type="number" 
                min="1"
                onChange={(e) => form.setValue("capacity", parseInt(e.target.value) || undefined)}
                defaultValue={facility?.capacity || ""}
                data-testid="input-facility-capacity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value: "available" | "maintenance" | "closed") => form.setValue("status", value)}
              >
                <SelectTrigger data-testid="select-facility-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register("location")} data-testid="input-facility-location" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amenities">Amenities</Label>
            <Textarea 
              id="amenities" 
              placeholder="e.g., Projector, Whiteboard, AC"
              {...form.register("amenities")} 
              data-testid="input-facility-amenities"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-facility">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEdit ? "Save Changes" : "Add Facility")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFacilitiesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | undefined>();

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/facilities/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/facilities"] });
      toast({ title: "Facility deleted", description: "The facility has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredFacilities = facilities?.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.location?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingFacility(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facilities</h1>
          <p className="text-muted-foreground mt-1">Manage campus facilities</p>
        </div>
        <Button onClick={handleAdd} data-testid="button-add-facility">
          <Plus className="w-4 h-4 mr-2" />
          Add Facility
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-facilities"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredFacilities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map(facility => (
            <Card key={facility.id} className="hover-elevate overflow-visible" data-testid={`facility-card-${facility.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <Badge 
                    variant={facility.status === "available" ? "outline" : "secondary"}
                    className={facility.status === "available" ? "border-green-600 text-green-600" : ""}
                  >
                    {facility.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground">{facility.name}</h3>
                {facility.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{facility.location}</span>
                  </div>
                )}
                {facility.capacity && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Users className="w-3 h-3" />
                    <span>Capacity: {facility.capacity}</span>
                  </div>
                )}
                {facility.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{facility.description}</p>
                )}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(facility)} data-testid={`button-edit-facility-${facility.id}`}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(facility.id)} data-testid={`button-delete-facility-${facility.id}`}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No facilities found</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first facility
            </Button>
          </CardContent>
        </Card>
      )}

      <FacilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        facility={editingFacility}
        onSuccess={() => setEditingFacility(undefined)}
      />
    </div>
  );
}
