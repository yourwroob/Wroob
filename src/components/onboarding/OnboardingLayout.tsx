import { Link } from "react-router-dom";
import OnboardingStepIndicator from "./OnboardingStepIndicator";
import wroobeLogo from "@/assets/wroob-logo.png";

interface OnboardingLayoutProps {
  currentStep: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const OnboardingLayout = ({ currentStep, title, subtitle, children }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal navbar */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={wroobeLogo} alt="Wroob" className="h-11 w-11 rounded-lg" />
            <span className="font-display text-xl font-bold" style={{ letterSpacing: "-0.02em", fontSize: "21px" }}>Wroob</span>
          </Link>
        </div>
      </header>

      <div className="container py-8 sm:py-12">
        {/* Step indicator */}
        <OnboardingStepIndicator currentStep={currentStep} />

        {/* Title */}
        <div className="mx-auto mt-8 max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-3 text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Content */}
        <div className="mx-auto mt-8 max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
