import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shield, Database, Globe, Bell, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast({ title: "Both title and message are required", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-broadcast", {
        body: { title: broadcastTitle.trim(), message: broadcastMessage.trim() },
      });

      if (error) throw error;

      toast({ title: "Broadcast sent!", description: `Notified ${data?.notified || 0} users.` });
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast({ title: "Failed to send broadcast", description: err.message, variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <AdminLayout title="Settings">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Security</CardTitle>
            <CardDescription>Authentication and access control settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Role-based access</span>
              <Badge variant="default">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">RLS policies</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email verification</span>
              <Badge variant="default">Required</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Database</CardTitle>
            <CardDescription>Database configuration overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tables</span>
              <Badge variant="secondary">20+</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Edge functions</span>
              <Badge variant="secondary">9</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage buckets</span>
              <Badge variant="secondary">3</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Platform</CardTitle>
            <CardDescription>General platform settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant="default">Live</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Environment</span>
              <Badge variant="secondary">Development</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Broadcast Message</CardTitle>
            <CardDescription>Send a notification to all users on the platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="e.g., Platform Update"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message to all users..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                maxLength={2000}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">{broadcastMessage.length}/2000</p>
            </div>
            <Button
              onClick={handleBroadcast}
              disabled={sending || !broadcastTitle.trim() || !broadcastMessage.trim()}
              className="w-full gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Sending..." : "Send to All Users"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
