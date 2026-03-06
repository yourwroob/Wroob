import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useUserGroups, UserGroup } from "@/hooks/useUserGroups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Briefcase, MessageCircle } from "lucide-react";
import GroupChat from "@/components/groups/GroupChat";

const Groups = () => {
  const { groups, loading } = useUserGroups();
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-10">
        <h1 className="font-display text-3xl font-bold mb-2">My Groups</h1>
        <p className="text-muted-foreground mb-8">
          Connect with fellow interns in your area and company cohorts.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium mb-2">No groups yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                You'll be automatically added to a local community group when you enable location on your profile, and to cohort groups when your internship applications are accepted.
              </p>
            </CardContent>
          </Card>
        ) : selectedGroup ? (
          <GroupChat
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => setSelectedGroup(group)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${
                        group.type === "geo"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-blue-500/10 text-blue-600"
                      }`}>
                        {group.type === "geo" ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">{group.label}</CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {group.type === "geo" ? "Local Community" : "Intern Cohort"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {group.member_count} member{group.member_count !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <MessageCircle className="h-4 w-4" />
                      Open chat
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
