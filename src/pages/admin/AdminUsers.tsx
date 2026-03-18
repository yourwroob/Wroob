import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      const mapped = (profiles || []).map((p: any) => {
        const role = roles?.find((r: any) => r.user_id === p.user_id);
        return { ...p, role: role?.role || "unknown" };
      });
      setUsers(mapped);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive" as const;
      case "employer": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  if (loading) return <AdminLayout title="Users"><Skeleton className="h-96" /></AdminLayout>;

  return (
    <AdminLayout title="Users">
      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-medium">Name</th>
                  <th className="p-4 text-left font-medium">Role</th>
                  <th className="p-4 text-left font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{u.full_name || "—"}</td>
                      <td className="p-4"><Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge></td>
                      <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</p>
    </AdminLayout>
  );
};

export default AdminUsers;
