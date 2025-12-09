import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function BookingCard({ booking }: { booking: BookingWithRelations }) {
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
            <StatusBadge status={booking.status} />
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

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Submitted on {booking.createdAt ? format(new Date(booking.createdAt), "MMMM d, yyyy 'at' h:mm a") : "N/A"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: bookings, isLoading } = useQuery<BookingWithRelations[]>({
    queryKey: ["/api/bookings/my"],
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
                <BookingCard key={booking.id} booking={booking} />
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
    </div>
  );
}
