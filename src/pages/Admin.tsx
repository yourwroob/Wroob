import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, FileText, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [stats, setStats] = useState({ students: 0, employers: 0, admins: 0, totalInternships: 0, totalApplications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: profiles }, { data: roles }, { data: interns }, { count: appCount }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("internships").select("*, employer_profiles!internships_employer_id_fkey(company_name)").order("created_at", { ascending: false }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
      ]);

      const userMap = (profiles || []).map((p: any) => {
        const role = roles?.find((r: any) => r.user_id === p.user_id);
        return { ...p, role: role?.role || "unknown" };
      });
      setUsers(userMap);
      setInternships(interns || []);

      const students = roles?.filter((r: any) => r.role === "student").length || 0;
      const employers = roles?.filter((r: any) => r.role === "employer").length || 0;
      const admins = roles?.filter((r: any) => r.role === "admin").length || 0;
      setStats({ students, employers, admins, totalInternships: interns?.length || 0, totalApplications: appCount || 0 });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const updateInternshipStatus = async (id: string, status: "draft" | "published" | "closed") => {
    const { error } = await supabase.from("internships").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setInternships((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      toast({ title: `Internship ${status}` });
    }
  };

  const chartData = [
    { name: "Students", count: stats.students },
    { name: "Employers", count: stats.employers },
    { name: "Internships", count: stats.totalInternships },
    { name: "Applications", count: stats.totalApplications },
  ];

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10"><Skeleton className="h-96" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold mb-8">Admin Panel</h1>

        {/* Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Students", value: stats.students, icon: Users },
            { label: "Employers", value: stats.employers, icon: Briefcase },
            { label: "Internships", value: stats.totalInternships, icon: Briefcase },
            { label: "Applications", value: stats.totalApplications, icon: FileText },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analytics">
          <TabsList>
            <TabsTrigger value="analytics"><BarChart3 className="mr-1.5 h-4 w-4" />Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-1.5 h-4 w-4" />Users</TabsTrigger>
            <TabsTrigger value="internships"><Briefcase className="mr-1.5 h-4 w-4" />Internships</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Platform Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="p-4 text-left font-medium">Name</th><th className="p-4 text-left font-medium">Role</th><th className="p-4 text-left font-medium">Joined</th></tr></thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0">
                          <td className="p-4">{u.full_name || "—"}</td>
                          <td className="p-4"><Badge variant="outline">{u.role}</Badge></td>
                          <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="internships" className="mt-6">
            <div className="space-y-3">
              {internships.map((i) => (
                <Card key={i.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <h4 className="font-medium">{i.title}</h4>
                      <p className="text-sm text-muted-foreground">{i.employer_profiles?.company_name || "Unknown"}</p>
                    </div>
                    <Select value={i.status} onValueChange={(v: "draft" | "published" | "closed") => updateInternshipStatus(i.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
