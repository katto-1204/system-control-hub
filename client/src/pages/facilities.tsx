import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Facility } from "@shared/schema";
import { Building2, Users, MapPin, Search, Calendar, Info } from "lucide-react";

function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <Card className="hover-elevate overflow-visible" data-testid={`facility-card-${facility.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-foreground">{facility.name}</h3>
              <Badge 
                variant={facility.status === "available" ? "outline" : "secondary"}
                className={facility.status === "available" ? "border-green-600 text-green-600" : ""}
              >
                {facility.status}
              </Badge>
            </div>
            {facility.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span>{facility.location}</span>
              </div>
            )}
            {facility.capacity && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Users className="w-3 h-3" />
                <span>Capacity: {facility.capacity} people</span>
              </div>
            )}
            {facility.description && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{facility.description}</p>
            )}
            {facility.amenities && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <Info className="w-3 h-3" />
                <span className="truncate">{facility.amenities}</span>
              </div>
            )}
            {facility.status === "available" && (
              <Link href="/request">
                <Button className="mt-4" size="sm" data-testid={`button-book-${facility.id}`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Book This Facility
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
  });

  const filteredFacilities = facilities?.filter(facility => {
    const matchesSearch = 
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && facility.status === activeTab;
  }) || [];

  const availableCount = facilities?.filter(f => f.status === "available").length || 0;
  const maintenanceCount = facilities?.filter(f => f.status === "maintenance").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Facilities</h1>
          <p className="text-muted-foreground mt-1">
            Browse available facilities and make reservations
          </p>
        </div>
        <Link href="/request">
          <Button data-testid="button-new-booking">
            <Calendar className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities by name, location..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-facilities"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-facilities">
            All ({facilities?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="available" data-testid="tab-available">
            Available ({availableCount})
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
            Maintenance ({maintenanceCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredFacilities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFacilities.map(facility => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No facilities found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery ? "Try adjusting your search" : "No facilities available at the moment"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
