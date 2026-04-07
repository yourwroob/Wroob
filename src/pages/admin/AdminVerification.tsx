import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, ExternalLink, Search, Building2, Shield } from "lucide-react";
import { AdminVerificationSkeleton } from "@/components/skeletons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface EmployerRow {
  id: string;
  user_id: string;
  company_name: string | null;
  gstin: string | null;
  pan_number: string | null;
  linkedin_profile: string | null;
  cin: string | null;
  is_verified: boolean | null;
  industry: string | null;
  city: string | null;
  onboarding_status: string;
}

const AdminVerification = () => {
  const { toast } = useToast();
  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ employer: EmployerRow; action: "verify" | "revoke" } | null>(null);

  const fetchEmployers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employer_profiles")
      .select("id, user_id, company_name, gstin, pan_number, linkedin_profile, cin, is_verified, industry, city, onboarding_status")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading employers", description: error.message, variant: "destructive" });
    } else {
      setEmployers((data as EmployerRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const handleToggleVerified = async () => {
    if (!confirmDialog) return;
    const { employer, action } = confirmDialog;
    setToggling(employer.id);
    setConfirmDialog(null);

    const newStatus = action === "verify";
    const { error } = await supabase
      .from("employer_profiles")
      .update({ is_verified: newStatus } as any)
      .eq("id", employer.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setEmployers((prev) =>
        prev.map((e) => (e.id === employer.id ? { ...e, is_verified: newStatus } : e))
      );
      toast({ title: newStatus ? "Company verified ✅" : "Verification revoked" });
    }
    setToggling(null);
  };

  const filtered = employers.filter((e) => {
    const matchesSearch =
      !search ||
      e.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.gstin?.toLowerCase().includes(search.toLowerCase()) ||
      e.pan_number?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "verified" && e.is_verified) ||
      (filter === "pending" && !e.is_verified);
    return matchesSearch && matchesFilter;
  });

  const verifiedCount = employers.filter((e) => e.is_verified).length;
  const pendingCount = employers.filter((e) => !e.is_verified && e.onboarding_status === "completed").length;

  return (
    <AdminLayout title="Company Verification">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Company Verification</h1>
          <p className="text-muted-foreground">Review company documents and toggle the Verified badge.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{employers.length}</p>
              <p className="text-sm text-muted-foreground">Total Companies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">{verifiedCount}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search by company, GSTIN, PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {(["all", "pending", "verified"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Company list */}
        {loading ? (
          <AdminVerificationSkeleton />
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No companies match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((employer) => (
              <Card key={employer.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {employer.company_name || "Unnamed Company"}
                          {employer.is_verified && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {[employer.industry, employer.city].filter(Boolean).join(" · ") || "No details"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={employer.onboarding_status === "completed" ? "default" : "secondary"}>
                      {employer.onboarding_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">GSTIN</p>
                      <p className={employer.gstin ? "font-mono" : "text-muted-foreground italic"}>
                        {employer.gstin || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">PAN</p>
                      <p className={employer.pan_number ? "font-mono" : "text-muted-foreground italic"}>
                        {employer.pan_number || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">CIN</p>
                      <p className={employer.cin ? "font-mono" : "text-muted-foreground italic"}>
                        {employer.cin || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">LinkedIn</p>
                      {employer.linkedin_profile ? (
                        <a
                          href={employer.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-muted-foreground italic">Not provided</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    {employer.is_verified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        disabled={toggling === employer.id}
                        onClick={() => setConfirmDialog({ employer, action: "revoke" })}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Revoke Verification
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={toggling === employer.id}
                        onClick={() => setConfirmDialog({ employer, action: "verify" })}
                      >
                        <Shield className="h-4 w-4 mr-1" /> Grant Verified Badge
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.action === "verify" ? "Verify Company" : "Revoke Verification"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog?.action === "verify"
                ? `Are you sure you want to grant the "Verified Company ✅" badge to ${confirmDialog?.employer.company_name || "this company"}? This signals trust to students.`
                : `Are you sure you want to revoke the verified badge from ${confirmDialog?.employer.company_name || "this company"}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              onClick={handleToggleVerified}
              className={confirmDialog?.action === "verify" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={confirmDialog?.action === "revoke" ? "destructive" : "default"}
            >
              {confirmDialog?.action === "verify" ? "Confirm Verification" : "Revoke Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminVerification;
