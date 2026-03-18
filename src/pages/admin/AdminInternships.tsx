import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

const AdminInternships = () => {
  const { toast } = useToast();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("internships")
        .select("*, employer_profiles!internships_employer_id_fkey(company_name)")
        .order("created_at", { ascending: false });
      setInternships(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateStatus = async (id: string, status: "draft" | "published" | "closed") => {
    const { error } = await supabase.from("internships").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setInternships((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      toast({ title: `Status updated to ${status}` });
    }
  };

  const filtered = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      (i.employer_profiles?.company_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => {
    switch (s) {
      case "published": return "default" as const;
      case "closed": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  if (loading) return <AdminLayout title="Internships"><Skeleton className="h-96" /></AdminLayout>;

  return (
    <AdminLayout title="Internships">
      <div className="mb-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search internships..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No internships found</CardContent></Card>
        ) : (
          filtered.map((i) => (
            <Card key={i.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{i.title}</h4>
                    <Badge variant={statusColor(i.status)}>{i.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{i.employer_profiles?.company_name || "Unknown"} • {i.application_count} applications</p>
                </div>
                <Select value={i.status} onValueChange={(v: "draft" | "published" | "closed") => updateStatus(i.id, v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{filtered.length} internship{filtered.length !== 1 ? "s" : ""}</p>
    </AdminLayout>
  );
};

export default AdminInternships;
