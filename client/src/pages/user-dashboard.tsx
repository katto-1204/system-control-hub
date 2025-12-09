import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import type { Facility, BookingWithRelations } from "@shared/schema";
import { 
  Building2, 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Users,
  MapPin
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

function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-facility-${facility.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{facility.name}</h3>
            {facility.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{facility.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {facility.capacity && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{facility.capacity}</span>
                </div>
              )}
              <Badge 
                variant={facility.status === "available" ? "outline" : "secondary"}
                className={facility.status === "available" ? "border-green-600 text-green-600" : ""}
              >
                {facility.status}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking }: { booking: BookingWithRelations }) {
  return (
    <Card className="hover-elevate overflow-visible" data-testid={`card-booking-${booking.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">{booking.eventName}</h3>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {booking.facility?.name || "Facility"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(booking.eventDate), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{booking.startTime} - {booking.endTime}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold mt-1" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithRelations[]>({
    queryKey: ["/api/bookings/my"],
  });

  const availableFacilities = facilities?.filter(f => f.status === "available").length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  const approvedBookings = bookings?.filter(b => b.status === "approved").length || 0;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome back, {user?.firstName || "User"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your facility bookings and event requests
          </p>
        </div>
        <Link href="/request">
          <Button data-testid="button-new-request">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Available Facilities" 
          value={availableFacilities} 
          icon={Building2} 
          color="bg-primary" 
        />
        <StatCard 
          title="Pending Requests" 
          value={pendingBookings} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Approved Events" 
          value={approvedBookings} 
          icon={CheckCircle2} 
          color="bg-green-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg">Available Facilities</CardTitle>
                <Link href="/facilities">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-facilities">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {facilitiesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : facilities && facilities.length > 0 ? (
                facilities.slice(0, 4).map(facility => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No facilities available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-lg">My Recent Requests</CardTitle>
                <Link href="/my-bookings">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-bookings">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : bookings && bookings.length > 0 ? (
                bookings.slice(0, 4).map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No booking requests yet</p>
                  <Link href="/request">
                    <Button variant="outline" className="mt-4" data-testid="button-create-first-request">
                      Create your first request
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
