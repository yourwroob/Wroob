import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployerOnboardingLayout from "@/components/onboarding/EmployerOnboardingLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const EmployerOnboardingDone = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/dashboard"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <EmployerOnboardingLayout currentStep={3}>
      <div className="flex flex-col items-start">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircle className="h-20 w-20 text-success mb-6" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          You're ready to start recruiting!
        </h1>
        <motion.p
          className="mt-4 text-muted-foreground leading-relaxed max-w-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Your company profile is set up and verified. You can now post internships, review candidates, and manage your hiring pipeline.
        </motion.p>

        <div className="mt-10">
          <Button
            onClick={() => navigate("/dashboard")}
            size="lg"
            className="h-14 px-10 text-base bg-foreground text-background hover:bg-foreground/90 rounded-lg gap-2"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Redirecting to your dashboard in a few seconds...
        </p>
      </div>
    </EmployerOnboardingLayout>
  );
};

export default EmployerOnboardingDone;
