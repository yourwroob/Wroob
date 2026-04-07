import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotificationSkeleton } from "@/components/skeletons";
import { Bell, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setNotifications(data || []);
      setLoading(false);
    });
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (notif: any) => {
    if (!notif.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    }
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <Button variant="outline" size="sm" className="gap-1" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        </div>

        {loading ? (
          <NotificationSkeleton />
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-display text-xl font-semibold">No notifications</h3>
            <p className="mt-2 text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card key={n.id} className={cn("cursor-pointer transition-all hover:shadow-md", !n.read && "border-primary/20 bg-primary/5")} onClick={() => handleClick(n)}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{n.title}</h4>
                    {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
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

export default Notifications;
