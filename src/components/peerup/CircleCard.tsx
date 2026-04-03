import { PeerUpCircle } from "@/hooks/usePeerUpCircles";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Coffee } from "lucide-react";

interface CircleCardProps {
  circle: PeerUpCircle;
  onClick: () => void;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "W";

const getTimeLeft = (expiresAt: string) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h left`;
  return `${mins}m left`;
};

const formatDropInTime = (dt: string) => {
  const d = new Date(dt);
  const day = d.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  return `${day} ${month} · ${h}:${mins} ${ampm}`;
};

const CircleCard = ({ circle, onClick }: CircleCardProps) => {
  const timeLeft = getTimeLeft(circle.expires_at);
  const isExpiringSoon = new Date(circle.expires_at).getTime() - Date.now() < 3600000;

  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0 border-2 border-emerald-500/50">
            <AvatarImage src={circle.creator_avatar || undefined} />
            <AvatarFallback className="brand-gradient text-white text-xs font-semibold">
              {getInitials(circle.spot_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{circle.spot_name}</h3>
            {circle.creator_university && (
              <p className="text-xs text-muted-foreground">{circle.creator_university}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              isExpiringSoon
                ? "border-destructive/50 text-destructive"
                : "border-emerald-500/50 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {timeLeft}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Clock className="h-3 w-3" /> {formatDropInTime(circle.drop_in_time)}
          </Badge>
          {circle.spot_location && (
            <Badge variant="secondary" className="text-[11px] gap-1">
              <MapPin className="h-3 w-3" /> {circle.spot_location}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[11px] gap-1">
            <Coffee className="h-3 w-3" /> {circle.fuel_type}
          </Badge>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
            Topic on the table
          </p>
          <p className="text-sm">{circle.topic}</p>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{circle.participant_count || 1} joined</span>
          {circle.my_request_status === "pending" && (
            <Badge variant="outline" className="text-[10px] border-warning/50 text-warning">
              Request pending
            </Badge>
          )}
          {circle.is_participant && (
            <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
              You're in
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CircleCard;
