import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BookingWithRelations } from "@shared/schema";
import {
  Calendar,
  Clock,
  Building2,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; className: string }> = {
    approved: { variant: "default", icon: CheckCircle2, className: "bg-green-600 hover:bg-green-600" },
    pending: { variant: "secondary", icon: AlertCircle, className: "bg-amber-500 hover:bg-amber-500 text-white" },
    rejected: { variant: "destructive", icon: XCircle, className: "" },
  };
  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} gap-1`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function BookingCard({ 
  booking, 
  onDelete 
}: { 
  booking: BookingWithRelations;
  onDelete: (id: number) => void;
}) {
  const canEdit = booking.status === "pending";

  return (
    <Card className="hover-elevate overflow-visible" data-testid={`my-booking-card-${booking.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground">{booking.eventName}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{booking.facility?.name || "N/A"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={booking.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{format(new Date(booking.eventDate), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{booking.startTime} - {booking.endTime}</span>
            </div>
            {booking.attendees && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span>{booking.attendees} attendees</span>
              </div>
            )}
          </div>

          {booking.purpose && (
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm font-medium text-foreground mb-1">Purpose</p>
              <p className="text-sm text-muted-foreground">{booking.purpose}</p>
            </div>
          )}

          {booking.adminNotes && (
            <div className={`rounded-md p-3 ${booking.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted/50'}`}>
              <p className="text-sm font-medium text-foreground mb-1">Admin Notes</p>
              <p className="text-sm text-muted-foreground">{booking.adminNotes}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Submitted on {booking.createdAt ? format(new Date(booking.createdAt), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Link href={`/request?edit=${booking.id}`}>
                  <Button size="sm" variant="outline" data-testid={`button-edit-${booking.id}`}>
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => onDelete(booking.id)}
                  data-testid={`button-delete-${booking.id}`}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBookingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: bookings, isLoading } = useQuery<BookingWithRelations[]>({
    queryKey: ["/api/bookings/my"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bookings/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my"] });
      toast({
        title: "Booking deleted",
        description: "Your booking request has been deleted.",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings?.filter(booking => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  }) || [];

  const pendingCount = bookings?.filter(b => b.status === "pending").length || 0;
  const approvedCount = bookings?.filter(b => b.status === "approved").length || 0;
  const rejectedCount = bookings?.filter(b => b.status === "rejected").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground mt-1">
            View and track all your booking requests
          </p>
        </div>
        <Link href="/request">
          <Button data-testid="button-new-request-bookings">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-bookings">
            All ({bookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-bookings">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved-bookings">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected-bookings">
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No bookings found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab !== "all" 
                    ? `No ${activeTab} bookings` 
                    : "You haven't made any booking requests yet"
                  }
                </p>
                {activeTab === "all" && (
                  <Link href="/request">
                    <Button className="mt-4" data-testid="button-create-first-booking">
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first booking
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
