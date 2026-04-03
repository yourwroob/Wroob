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
    <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {circles.slice(0, 8).map((circle, i) => (
        <button
          key={circle.id}
          onClick={() => onSelect(circle)}
          className="flex flex-col items-center gap-1.5 min-w-[64px] group"
        >
          <Avatar className={`h-14 w-14 border-2 ${getColor(i)} transition-transform group-hover:scale-105`}>
            <AvatarImage src={circle.creator_avatar || undefined} />
            <AvatarFallback className={`bg-transparent font-semibold text-sm ${getColor(i)}`}>
              {getInitials(circle.spot_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate max-w-[64px]">
            {circle.spot_name}
          </span>
        </button>
      ))}
      <button
        onClick={onCreateNew}
        className="flex flex-col items-center gap-1.5 min-w-[64px] group"
      >
        <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors group-hover:border-primary/50">
          <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70" />
        </div>
        <span className="text-[11px] text-muted-foreground">New</span>
      </button>
    </div>
  );
};

export default CircleBubbles;
