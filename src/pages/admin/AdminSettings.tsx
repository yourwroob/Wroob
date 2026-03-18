import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Globe, Bell } from "lucide-react";

const AdminSettings = () => {
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
              <Badge variant="secondary">7</Badge>
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
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle>
            <CardDescription>Notification system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Real-time</span>
              <Badge variant="default">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email alerts</span>
              <Badge variant="secondary">Not configured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
