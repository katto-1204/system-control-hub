import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Facility } from "@shared/schema";
import { Calendar as CalendarIcon, Loader2, Clock, Users, Building2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const eventRequestSchema = z.object({
  facilityId: z.number({ required_error: "Please select a facility" }),
  eventName: z.string().min(1, "Event name is required"),
  eventDescription: z.string().optional(),
  purpose: z.string().min(1, "Purpose is required"),
  eventDate: z.date({ required_error: "Event date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  attendees: z.number().min(1, "Number of attendees is required").optional(),
  equipmentNeeded: z.string().optional(),
});

type EventRequestFormData = z.infer<typeof eventRequestSchema>;

export default function EventRequestPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const availableFacilities = facilities?.filter(f => f.status === "available") || [];

  const form = useForm<EventRequestFormData>({
    resolver: zodResolver(eventRequestSchema),
    defaultValues: {
      eventName: "",
      eventDescription: "",
      purpose: "",
      startTime: "",
      endTime: "",
      equipmentNeeded: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: EventRequestFormData) => {
      const payload = {
        ...data,
        userId: user?.id,
        eventDate: format(data.eventDate, "yyyy-MM-dd"),
      };
      return apiRequest("POST", "/api/bookings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Request submitted!",
        description: "Your event request has been submitted for review.",
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Could not submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventRequestFormData) => {
    submitMutation.mutate(data);
  };

  const selectedDate = form.watch("eventDate");
  const selectedFacilityId = form.watch("facilityId");
  const selectedFacility = facilities?.find(f => f.id === selectedFacilityId);

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Submit Event Request</CardTitle>
          <CardDescription>
            Fill out the form below to request a facility booking for your event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Facility Selection
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="facility">Select Facility <span className="text-destructive">*</span></Label>
                {facilitiesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedFacilityId?.toString()}
                    onValueChange={(value) => form.setValue("facilityId", parseInt(value))}
                  >
                    <SelectTrigger data-testid="select-facility">
                      <SelectValue placeholder="Choose a facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFacilities.length > 0 ? (
                        availableFacilities.map(facility => (
                          <SelectItem key={facility.id} value={facility.id.toString()}>
                            {facility.name} {facility.capacity && `(Capacity: ${facility.capacity})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No facilities available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {form.formState.errors.facilityId && (
                  <p className="text-sm text-destructive">{form.formState.errors.facilityId.message}</p>
                )}
              </div>

              {selectedFacility && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedFacility.name}</p>
                        {selectedFacility.location && (
                          <p className="text-sm text-muted-foreground">{selectedFacility.location}</p>
                        )}
                        {selectedFacility.capacity && (
                          <p className="text-sm text-muted-foreground">Capacity: {selectedFacility.capacity} people</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Event Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name <span className="text-destructive">*</span></Label>
                <Input
                  id="eventName"
                  placeholder="Enter event name"
                  data-testid="input-event-name"
                  {...form.register("eventName")}
                />
                {form.formState.errors.eventName && (
                  <p className="text-sm text-destructive">{form.formState.errors.eventName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose <span className="text-destructive">*</span></Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of your event"
                  data-testid="input-purpose"
                  {...form.register("purpose")}
                />
                {form.formState.errors.purpose && (
                  <p className="text-sm text-destructive">{form.formState.errors.purpose.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDescription">Event Description</Label>
                <Textarea
                  id="eventDescription"
                  placeholder="Provide additional details about your event (optional)"
                  data-testid="input-event-description"
                  {...form.register("eventDescription")}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Date & Time
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Event Date <span className="text-destructive">*</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                        data-testid="button-select-date"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && form.setValue("eventDate", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.eventDate && (
                    <p className="text-sm text-destructive">{form.formState.errors.eventDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time <span className="text-destructive">*</span></Label>
                  <Input
                    id="startTime"
                    type="time"
                    data-testid="input-start-time"
                    {...form.register("startTime")}
                  />
                  {form.formState.errors.startTime && (
                    <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time <span className="text-destructive">*</span></Label>
                  <Input
                    id="endTime"
                    type="time"
                    data-testid="input-end-time"
                    {...form.register("endTime")}
                  />
                  {form.formState.errors.endTime && (
                    <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Additional Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="attendees">Expected Attendees</Label>
                  <Input
                    id="attendees"
                    type="number"
                    min="1"
                    placeholder="Number of attendees"
                    data-testid="input-attendees"
                    onChange={(e) => form.setValue("attendees", parseInt(e.target.value) || undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipmentNeeded">Equipment Needed</Label>
                  <Input
                    id="equipmentNeeded"
                    placeholder="e.g., Projector, Microphone"
                    data-testid="input-equipment"
                    {...form.register("equipmentNeeded")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitMutation.isPending}
                data-testid="button-submit-request"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
