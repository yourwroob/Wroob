import { PeerUpCircle } from "@/hooks/usePeerUpCircles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

interface CircleBubblesProps {
  circles: PeerUpCircle[];
  onSelect: (circle: PeerUpCircle) => void;
  onCreateNew: () => void;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "W";

const getColor = (index: number) => {
  const colors = [
    "border-orange-500 text-orange-500",
    "border-emerald-500 text-emerald-500",
    "border-indigo-400 text-indigo-400",
    "border-amber-500 text-amber-500",
    "border-pink-500 text-pink-500",
    "border-cyan-500 text-cyan-500",
  ];
  return colors[index % colors.length];
};

const CircleBubbles = ({ circles, onSelect, onCreateNew }: CircleBubblesProps) => {
  return (
    <div className="flex items-center gap-5 overflow-x-auto pb-3 scrollbar-hide px-1">
      {/* Create new button */}
      <button
        onClick={onCreateNew}
        className="flex flex-col items-center gap-1.5 min-w-[72px] group"
      >
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors group-hover:border-primary/50">
          <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70" />
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">New</span>
      </button>

      {circles.map((circle, i) => (
        <button
          key={circle.id}
          onClick={() => onSelect(circle)}
          className="flex flex-col items-center gap-1.5 min-w-[72px] group"
        >
          <div className={`relative rounded-full p-[2px] bg-gradient-to-br ${
            circle.is_participant
              ? "from-emerald-400 to-emerald-600"
              : circle.my_request_status === "pending"
              ? "from-amber-400 to-amber-600"
              : "from-primary/60 to-primary"
          }`}>
            <Avatar className="h-16 w-16 border-2 border-background transition-transform group-hover:scale-105">
              <AvatarImage src={circle.creator_avatar || undefined} />
              <AvatarFallback className={`bg-transparent font-semibold text-sm ${getColor(i)}`}>
                {getInitials(circle.creator_name || circle.spot_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[72px] font-medium">
            {circle.creator_name?.split(" ")[0] || circle.spot_name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CircleBubbles;
