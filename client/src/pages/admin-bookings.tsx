import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BookingWithRelations } from "@shared/schema";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Users,
  Building2,
  Loader2,
  MapPin,
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
  onApprove, 
  onReject 
}: { 
  booking: BookingWithRelations; 
  onApprove: (id: number) => void;
  onReject: (id: number, notes: string) => void;
}) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  return (
    <>
      <Card className="hover-elevate overflow-visible" data-testid={`admin-booking-card-${booking.id}`}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground">{booking.eventName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Requested by {booking.user?.firstName} {booking.user?.lastName}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{booking.facility?.name || "N/A"}</span>
              </div>
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

            {booking.equipmentNeeded && (
              <div className="text-sm">
                <span className="font-medium">Equipment needed:</span>{" "}
                <span className="text-muted-foreground">{booking.equipmentNeeded}</span>
              </div>
            )}

            {booking.status === "pending" && (
              <div className="flex items-center justify-end gap-3 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  data-testid={`button-reject-${booking.id}`}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => onApprove(booking.id)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid={`button-approve-${booking.id}`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}

            {booking.adminNotes && (
              <div className="bg-muted/50 rounded-md p-3 mt-2">
                <p className="text-sm font-medium text-foreground mb-1">Admin Notes</p>
                <p className="text-sm text-muted-foreground">{booking.adminNotes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this booking request.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              data-testid="input-reject-notes"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onReject(booking.id, rejectNotes);
                setShowRejectDialog(false);
                setRejectNotes("");
              }}
              data-testid="button-confirm-reject"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminBookingsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: bookings, isLoading } = useQuery<BookingWithRelations[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/admin/bookings/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Request approved",
        description: "The booking request has been approved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/bookings/${id}/reject`, { adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({
        title: "Request rejected",
        description: "The booking request has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = 
      booking.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.facility?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && booking.status === activeTab;
  }) || [];

  const pendingCount = bookings?.filter(b => b.status === "pending").length || 0;
  const approvedCount = bookings?.filter(b => b.status === "approved").length || 0;
  const rejectedCount = bookings?.filter(b => b.status === "rejected").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Booking Requests</h1>
        <p className="text-muted-foreground mt-1">
          Manage and process facility booking requests
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by event, user, or facility..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-bookings"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({bookings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id, notes) => rejectMutation.mutate({ id, notes })}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No bookings found</p>
                  <p className="text-sm mt-1">
                    {searchQuery 
                      ? "Try adjusting your search query" 
                      : "No booking requests match the current filter"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
