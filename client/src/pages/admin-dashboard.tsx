import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { BookingWithRelations, User, Facility } from "@shared/schema";
import {
  Building2,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
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

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: number; 
  icon: any; 
  color: string; 
  trend?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold mt-1" data-testid={`admin-stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </p>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentRequestRow({ booking }: { booking: BookingWithRelations }) {
  return (
    <div 
      className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
      data-testid={`admin-request-row-${booking.id}`}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{booking.eventName}</p>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span>{booking.user?.firstName} {booking.user?.lastName}</span>
          <span className="text-border">|</span>
          <span>{booking.facility?.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-sm text-muted-foreground hidden sm:block">
          <p>{format(new Date(booking.eventDate), "MMM d, yyyy")}</p>
          <p>{booking.startTime}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingWithRelations[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: facilities, isLoading: facilitiesLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length || 0;
  const approvedBookings = bookings?.filter(b => b.status === "approved").length || 0;
  const totalUsers = users?.length || 0;
  const totalFacilities = facilities?.length || 0;

  const recentBookings = bookings?.slice(0, 5) || [];

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of facility bookings and system activity
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard 
          title="Total Users" 
          value={totalUsers} 
          icon={Users} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Total Facilities" 
          value={totalFacilities} 
          icon={Building2} 
          color="bg-primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Recent Booking Requests</CardTitle>
              <Link href="/admin/bookings">
                <Button variant="ghost" size="sm" data-testid="button-view-all-admin-bookings">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full mb-3" />
              ))
            ) : recentBookings.length > 0 ? (
              <div>
                {recentBookings.map(booking => (
                  <RecentRequestRow key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No booking requests yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/bookings" className="block">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-manage-requests">
                <Calendar className="w-4 h-4" />
                Manage Requests
                {pendingBookings > 0 && (
                  <Badge className="ml-auto bg-amber-500">{pendingBookings}</Badge>
                )}
              </Button>
            </Link>
            <Link href="/admin/facilities" className="block">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-manage-facilities">
                <Building2 className="w-4 h-4" />
                Manage Facilities
              </Button>
            </Link>
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-manage-users">
                <Users className="w-4 h-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/reports" className="block">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="button-quick-view-reports">
                <TrendingUp className="w-4 h-4" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Facility Status</CardTitle>
              <Link href="/admin/facilities">
                <Button variant="ghost" size="sm" data-testid="button-view-all-facilities-admin">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {facilitiesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))
            ) : facilities && facilities.length > 0 ? (
              <div className="space-y-2">
                {facilities.slice(0, 5).map(facility => (
                  <div 
                    key={facility.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`admin-facility-${facility.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{facility.name}</span>
                    </div>
                    <Badge 
                      variant={facility.status === "available" ? "outline" : "secondary"}
                      className={facility.status === "available" ? "border-green-600 text-green-600" : ""}
                    >
                      {facility.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No facilities added yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Recent Users</CardTitle>
              <Link href="/admin/users">
                <Button variant="ghost" size="sm" data-testid="button-view-all-users-admin">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))
            ) : users && users.length > 0 ? (
              <div className="space-y-2">
                {users.slice(0, 5).map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                    data-testid={`admin-user-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-medium">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users registered yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
