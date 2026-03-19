import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEmployerOnboardingStatus } from "@/hooks/useEmployerOnboardingStatus";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Building2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const EmployerOnboardingCompany = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateStep } = useEmployerOnboardingStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<{
    name: string;
    domain: string;
    logo_url: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Load existing data
  useEffect(() => {
    if (!user) return;
    supabase
      .from("employer_profiles")
      .select("company_name, company_domain, logo_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.company_name) {
          setSelectedCompany({
            name: data.company_name,
            domain: data.company_domain || "",
            logo_url: data.logo_url || "",
          });
        }
      });
  }, [user]);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    // For now, create company from input (in production, this would search an API)
    const domain = searchQuery.toLowerCase().replace(/\s+/g, "") + ".com";
    setSelectedCompany({
      name: searchQuery.trim(),
      domain: `http://www.${domain}/careers`,
      logo_url: "",
    });
  };

  const handleContinue = async () => {
    if (!user || !selectedCompany) return;

    setLoading(true);
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        company_name: selectedCompany.name,
        company_domain: selectedCompany.domain,
        logo_url: selectedCompany.logo_url,
        onboarding_step: 2,
      } as any)
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await updateStep(2);
      navigate("/employer/onboarding/details");
    }
  };

  return (
    <EmployerOnboardingLayout currentStep={1}>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Let's find your Company
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-xl">
        Many companies already have a Wroob profile. We'll look for yours, and if you use an applicant tracking system, we'll help find the jobs you've already posted.
      </p>

      <div className="mt-8">
        {!selectedCompany ? (
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="h-16 pl-14 pr-4 text-lg rounded-xl border-2 border-primary/20 focus:border-primary shadow-lg shadow-primary/5"
              placeholder="Enter company name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        ) : (
          <>
            {/* Selected company card */}
            <div className="rounded-xl border-2 border-primary/20 p-5 flex items-center gap-4 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-lg">{selectedCompany.name}</p>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  {selectedCompany.domain}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-primary font-medium"
                onClick={() => {
                  setSelectedCompany(null);
                  setSearchQuery("");
                }}
              >
                Change
              </Button>
            </div>

            {/* Continue button */}
            <div className="mt-10">
              <Button
                onClick={handleContinue}
                disabled={loading}
                size="lg"
                className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg"
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </>
        )}
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingCompany;
