import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import wroobeLogo from "@/assets/wroob-logo-clean.png";

const STEPS = [
  { key: "account", label: "Set up your account" },
  { key: "team", label: "Invite your team" },
  { key: "recruit", label: "Start recruiting" },
];

interface EmployerOnboardingLayoutProps {
  currentStep: number; // 1 = account (company+details+verify), 2 = team, 3 = recruit/done
  children: React.ReactNode;
}

const EmployerOnboardingLayout = ({ currentStep, children }: EmployerOnboardingLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      {/* Dark sidebar */}
      <aside className="hidden md:flex w-72 flex-col bg-foreground text-background p-8">
        <Link to="/" className="mb-12">
          <img src={wroobeLogo} alt="Wroob" className="h-14 brightness-0 invert" />
        </Link>

        <nav className="space-y-6">
          {STEPS.map((step, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isActive && "border-primary bg-primary",
                    isCompleted && "border-primary bg-primary",
                    !isActive && !isCompleted && "border-muted-foreground/50"
                  )}
                >
                  {isCompleted && (
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors",
                    isActive && "font-semibold text-background",
                    isCompleted && "text-background/80",
                    !isActive && !isCompleted && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-foreground text-background px-4 py-3 flex items-center gap-3">
        <Link to="/">
          <img src={wroobeLogo} alt="Wroob" className="h-11 brightness-0 invert" />
        </Link>
        <div className="ml-auto flex gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className={cn(
                "h-2 w-8 rounded-full",
                i + 1 <= currentStep ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:px-16 md:py-16 px-6 py-20 max-w-3xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default EmployerOnboardingLayout;
