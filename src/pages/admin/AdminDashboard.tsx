import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, FileText, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(243, 75%, 59%)", "hsl(160, 60%, 45%)", "hsl(30, 90%, 55%)", "hsl(0, 70%, 55%)"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, employers: 0, admins: 0, totalInternships: 0, totalApplications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: roles }, { data: interns }, { count: appCount }] = await Promise.all([
        supabase.from("user_roles").select("*"),
        supabase.from("internships").select("id"),
        supabase.from("applications").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        students: roles?.filter((r: any) => r.role === "student").length || 0,
        employers: roles?.filter((r: any) => r.role === "employer").length || 0,
        admins: roles?.filter((r: any) => r.role === "admin").length || 0,
        totalInternships: interns?.length || 0,
        totalApplications: appCount || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const barData = [
    { name: "Students", count: stats.students },
    { name: "Employers", count: stats.employers },
    { name: "Internships", count: stats.totalInternships },
    { name: "Applications", count: stats.totalApplications },
  ];

  const pieData = [
    { name: "Students", value: stats.students },
    { name: "Employers", value: stats.employers },
    { name: "Admins", value: stats.admins },
  ].filter((d) => d.value > 0);

  if (loading) return <AdminLayout title="Dashboard"><Skeleton className="h-96" /></AdminLayout>;

  const statCards = [
    { label: "Students", value: stats.students, icon: Users, color: "text-blue-500" },
    { label: "Employers", value: stats.employers, icon: Briefcase, color: "text-emerald-500" },
    { label: "Internships", value: stats.totalInternships, icon: TrendingUp, color: "text-orange-500" },
    { label: "Applications", value: stats.totalApplications, icon: FileText, color: "text-rose-500" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ${s.color}`}>
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Platform Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
