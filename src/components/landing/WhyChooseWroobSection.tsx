import { useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Factory, Cpu, ShieldCheck, Users, LayoutDashboard,
  FileText, Trophy, GraduationCap, Map, HardHat,
  Wallet, Network
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WhyCard {
  title: string;
  tag: string;
  description: string;
  icon: LucideIcon;
}

const WHY_CARDS: WhyCard[] = [
  { title: "Factory Floor Internships Only", tag: "Wroob's #1 USP", description: "Hands-on factory internships, not office roles", icon: Factory },
  { title: "Real-Time Machine & Equipment Tracker", tag: "Never done before", description: 'Logs machines/tools worked on → verified "Machine Resume"', icon: Cpu },
  { title: "Industry-Verified Skill Badges", tag: "Trust & credibility", description: "Supervisor-verified skills (CNC, Welding, QA)", icon: ShieldCheck },
  { title: "Mentor from the Shop Floor", tag: "Guidance built-in", description: "Assigned mentor + weekly check-ins", icon: Users },
  { title: "Live Industry Project Dashboard", tag: "Transparency first", description: "Track tasks, attendance, milestones, feedback", icon: LayoutDashboard },
  { title: "Smart Internship Report Generator", tag: "Student time-saver", description: "Auto-generate reports from logs", icon: FileText },
  { title: "Wroob Score (Industrial Rating)", tag: "Gamified growth", description: "Score based on machines, internships, ratings", icon: Trophy },
  { title: "College Partnership Portal", tag: "B2B growth engine", description: "College dashboard for tracking & compliance", icon: GraduationCap },
  { title: "Pan-India Manufacturing Map", tag: "Discovery feature", description: "Visual map of internships by location/sector", icon: Map },
  { title: "Safety Induction & Compliance", tag: "Industry-grade trust", description: "Mandatory safety training before internship", icon: HardHat },
  { title: "Stipend Guarantee & Escrow", tag: "Student protection", description: "Guaranteed stipend via escrow", icon: Wallet },
  { title: "Alumni & Senior Network", tag: "Community moat", description: "Alumni help, referrals, job sharing", icon: Network },
];

const TAG_COLORS = [
  "bg-amber-500/15 text-amber-400",
  "bg-violet-500/15 text-violet-400",
  "bg-sky-500/15 text-sky-400",
  "bg-emerald-500/15 text-emerald-400",
  "bg-rose-500/15 text-rose-400",
  "bg-indigo-500/15 text-indigo-400",
];

const CARDS_PER_VIEW_DESKTOP = 4;
const CARDS_PER_VIEW_TABLET = 2;
const CARDS_PER_VIEW_MOBILE = 1;
const AUTO_SLIDE_INTERVAL = 1500;

function useCardsPerView() {
  const [count, setCount] = useState(CARDS_PER_VIEW_DESKTOP);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCount(w < 640 ? CARDS_PER_VIEW_MOBILE : w < 1024 ? CARDS_PER_VIEW_TABLET : CARDS_PER_VIEW_DESKTOP);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

const CardItem = memo(({ card, index }: { card: WhyCard; index: number }) => {
  const Icon = card.icon;
  const tagColor = TAG_COLORS[index % TAG_COLORS.length];

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 sm:p-6 flex flex-col gap-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl brand-gradient text-white shadow-md shadow-primary/15">
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${tagColor}`}>
          {card.tag}
        </span>
      </div>
      <h3 className="font-medium text-foreground leading-snug text-sm sm:text-base">
        {card.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {card.description}
      </p>
    </div>
  );
});
CardItem.displayName = "CardItem";

const WhyChooseWroobSection = () => {
  const cardsPerView = useCardsPerView();
  const [index, setIndex] = useState(0);
  const total = WHY_CARDS.length;

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + cardsPerView) % total);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(interval);
  }, [total, cardsPerView]);

  const visibleCards: { card: WhyCard; originalIndex: number }[] = [];
  for (let i = 0; i < cardsPerView; i++) {
    const idx = (index + i) % total;
    visibleCards.push({ card: WHY_CARDS[idx], originalIndex: idx });
  }

  return (
    <motion.section
      id="why-wroob"
      className="border-t py-16 sm:py-24 overflow-hidden"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mb-10 sm:mb-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 style={{ font: "var(--text-section)", letterSpacing: "var(--letter-spacing-heading)" }}>
            Why Choose Wroob?
          </h2>
          <p className="mt-4 text-muted-foreground" style={{ font: "var(--text-body)" }}>
            Built for real industry experience
          </p>
        </div>
      </div>

      <div className="container">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className={`grid gap-4 sm:gap-6 ${
              cardsPerView === 1 ? "grid-cols-1" : cardsPerView === 2 ? "grid-cols-2" : "grid-cols-4"
            }`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            {visibleCards.map(({ card, originalIndex }) => (
              <CardItem key={originalIndex} card={card} index={originalIndex} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default WhyChooseWroobSection;
