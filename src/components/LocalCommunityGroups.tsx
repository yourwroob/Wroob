import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Search, Loader2 } from "lucide-react";

interface LocalGroup {
  id: string;
  label: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
  member_count: number;
  is_member: boolean;
}

const CITY_TAGS: Record<string, string> = {
  mumbai: "Mumbai",
  delhi: "Delhi",
  bangalore: "Bangalore",
  hyderabad: "Hyderabad",
  pune: "Pune",
};

const extractCity = (label: string): string => {
  const lower = label.toLowerCase();
  for (const [key, city] of Object.entries(CITY_TAGS)) {
    if (lower.includes(key)) return city;
  }
  return "India";
};

const LocalCommunityGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const fetchGroups = async () => {
    if (!user) return;

    const { data: allGroups } = await supabase
      .from("groups")
      .select("id, label, centroid_lat, centroid_lng")
      .eq("type", "local")
      .order("label");

    if (!allGroups) {
      setLoading(false);
      return;
    }

    // Get member counts and membership status in parallel
    const groupIds = allGroups.map((g) => g.id);

    const [{ data: memberCounts }, { data: myMemberships }] = await Promise.all([
      supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds),
      supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .in("group_id", groupIds),
    ]);

    const countMap: Record<string, number> = {};
    (memberCounts || []).forEach((m) => {
      countMap[m.group_id] = (countMap[m.group_id] || 0) + 1;
    });

    const mySet = new Set((myMemberships || []).map((m) => m.group_id));

    setGroups(
      allGroups.map((g) => ({
        id: g.id,
        label: g.label,
        centroid_lat: g.centroid_lat,
        centroid_lng: g.centroid_lng,
        member_count: countMap[g.id] || 0,
        is_member: mySet.has(g.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const handleJoinLeave = async (group: LocalGroup) => {
    if (!user) return;
    setJoiningId(group.id);

    if (group.is_member) {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", user.id);

      if (error) {
        toast({ title: "Error leaving group", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Left ${group.label}` });
      }
    } else {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id });

      if (error) {
        toast({ title: "Error joining group", description: error.message, variant: "destructive" });
      } else {
        toast({ title: `Joined ${group.label}!` });
      }
    }

    setJoiningId(null);
    await fetchGroups();
  };

  const filtered = groups.filter((g) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return g.label.toLowerCase().includes(q) || extractCity(g.label).toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-xl font-bold">Local Community Groups</h2>
        <Badge variant="secondary" className="text-xs">{groups.length} groups</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Join local student communities to connect, collaborate, and grow together.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by location or group name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No groups match your filter.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((group) => (
            <Card key={group.id} className="transition-all hover:shadow-md">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{group.label}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {extractCity(group.label)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {group.member_count} {group.member_count === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={group.is_member ? "outline" : "default"}
                  className="w-full text-xs"
                  disabled={joiningId === group.id}
                  onClick={() => handleJoinLeave(group)}
                >
                  {joiningId === group.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  {group.is_member ? "Leave Group" : "Join Group"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocalCommunityGroups;
