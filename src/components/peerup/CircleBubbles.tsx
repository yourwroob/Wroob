import { PeerUpCircle } from "@/hooks/usePeerUpCircles";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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

const CircleBubble = ({ circle, index, onSelect }: { circle: PeerUpCircle; index: number; onSelect: (c: PeerUpCircle) => void }) => (
  <button
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
        <AvatarFallback className={`bg-transparent font-semibold text-sm ${getColor(index)}`}>
          {getInitials(circle.creator_name || circle.spot_name)}
        </AvatarFallback>
      </Avatar>
    </div>
    <span className="text-[11px] text-muted-foreground truncate max-w-[72px] font-medium">
      {circle.creator_name?.split(" ")[0] || circle.spot_name}
    </span>
    <span className="text-[9px] text-muted-foreground/60">
      {formatDistanceToNow(new Date(circle.created_at), { addSuffix: true })}
    </span>
  </button>
);

const CircleBubbles = ({ circles, onSelect, onCreateNew }: CircleBubblesProps) => {
  const { user } = useAuth();

  const myCircles = circles.filter((c) => c.creator_id === user?.id);
  const otherCircles = circles.filter((c) => c.creator_id !== user?.id);

  return (
    <div className="space-y-4">
      {/* My Circles row */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Circles</p>
        <div className="flex items-center gap-5 overflow-x-auto pb-3 scrollbar-hide px-1">
          <button
            onClick={onCreateNew}
            className="flex flex-col items-center gap-1.5 min-w-[72px] group"
          >
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center transition-colors group-hover:border-primary/50">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/70" />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">New</span>
          </button>
          {myCircles.map((circle, i) => (
            <CircleBubble key={circle.id} circle={circle} index={i} onSelect={onSelect} />
          ))}
          {myCircles.length === 0 && (
            <span className="text-xs text-muted-foreground/60 self-center">No circles yet</span>
          )}
        </div>
      </div>

      {/* Other Circles row */}
      {otherCircles.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Explore</p>
          <div className="flex items-center gap-5 overflow-x-auto pb-3 scrollbar-hide px-1">
            {otherCircles.map((circle, i) => (
              <CircleBubble key={circle.id} circle={circle} index={i + myCircles.length} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CircleBubbles;
