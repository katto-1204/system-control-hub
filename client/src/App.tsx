import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { UserLayout } from "@/components/user-layout";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Facilities from "@/pages/facilities";
import EventRequest from "@/pages/event-request";
import MyBookings from "@/pages/my-bookings";
import AdminBookings from "@/pages/admin-bookings";
import AdminFacilities from "@/pages/admin-facilities";
import AdminUsers from "@/pages/admin-users";
import AdminReports from "@/pages/admin-reports";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";

function HomeRedirect() {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return <Redirect to={isAdmin ? "/admin" : "/dashboard"} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/dashboard">
        <UserLayout>
          <UserDashboard />
        </UserLayout>
      </Route>
      
      <Route path="/facilities">
        <UserLayout>
          <Facilities />
        </UserLayout>
      </Route>
      
      <Route path="/request-event">
        <UserLayout>
          <EventRequest />
        </UserLayout>
      </Route>
      
      <Route path="/request">
        <UserLayout>
          <EventRequest />
        </UserLayout>
      </Route>
      
      <Route path="/my-bookings">
        <UserLayout>
          <MyBookings />
        </UserLayout>
      </Route>
      
      <Route path="/profile">
        <UserLayout>
          <Profile />
        </UserLayout>
      </Route>
      
      <Route path="/notifications">
        <UserLayout>
          <Notifications />
        </UserLayout>
      </Route>
      
      <Route path="/admin">
        <UserLayout requireAdmin>
          <AdminDashboard />
        </UserLayout>
      </Route>
      
      <Route path="/admin/bookings">
        <UserLayout requireAdmin>
          <AdminBookings />
        </UserLayout>
      </Route>
      
      <Route path="/admin/facilities">
        <UserLayout requireAdmin>
          <AdminFacilities />
        </UserLayout>
      </Route>
      
      <Route path="/admin/users">
        <UserLayout requireAdmin>
          <AdminUsers />
        </UserLayout>
      </Route>
      
      <Route path="/admin/reports">
        <UserLayout requireAdmin>
          <AdminReports />
        </UserLayout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
