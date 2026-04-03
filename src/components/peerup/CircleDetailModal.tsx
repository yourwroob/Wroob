import { useState, useEffect } from "react";
import { PeerUpCircle, CircleRequest, CircleParticipant } from "@/hooks/usePeerUpCircles";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MapPin, Coffee, Users, ArrowRight, Loader2, Trash2, Check, X, Navigation, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CircleDetailModalProps {
  circle: PeerUpCircle | null;
  open: boolean;
  onClose: () => void;
  onRequestJoin: (circleId: string) => Promise<void>;
  onFetchRequests: (circleId: string) => Promise<CircleRequest[]>;
  onHandleRequest: (requestId: string, action: "approved" | "declined", circleId: string, requesterId: string) => Promise<void>;
  onApproveAll: (circleId: string) => Promise<void>;
  onFetchParticipants: (circleId: string, creatorId: string) => Promise<CircleParticipant[]>;
  onDelete: (circleId: string) => Promise<void>;
}

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "S";

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

const CircleDetailModal = ({
  circle, open, onClose, onRequestJoin,
  onFetchRequests, onHandleRequest, onApproveAll,
  onFetchParticipants, onDelete,
}: CircleDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<"detail" | "requests" | "members">("detail");
  const [requests, setRequests] = useState<CircleRequest[]>([]);
  const [participants, setParticipants] = useState<CircleParticipant[]>([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const isCreator = circle?.creator_id === user?.id;
  const isParticipant = circle?.is_participant;

  useEffect(() => {
    if (!circle || !open) { setView("detail"); return; }
    if (isCreator) {
      setView(circle.request_count && circle.request_count > 0 ? "requests" : "detail");
    } else if (isParticipant) {
      setView("members");
    } else {
      setView("detail");
    }
  }, [circle, open, isCreator, isParticipant]);

  useEffect(() => {
    if (!circle || !open) return;
    const loadData = async () => {
      setLoadingData(true);
      if (view === "requests" && isCreator) {
        const r = await onFetchRequests(circle.id);
        setRequests(r);
      } else if (view === "members" && (isCreator || isParticipant)) {
        const p = await onFetchParticipants(circle.id, circle.creator_id);
        setParticipants(p);
      }
      setLoadingData(false);
    };
    loadData();
  }, [circle, open, view, isCreator, isParticipant]);

  if (!circle) return null;

  const handleJoinRequest = async () => {
    setLoadingAction(true);
    try {
      await onRequestJoin(circle.id);
      toast({ title: "Request sent!", description: "Waiting for the host to approve." });
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message?.includes("duplicate") ? "You already requested" : e.message, variant: "destructive" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAction = async (reqId: string, action: "approved" | "declined", requesterId: string) => {
    setLoadingAction(true);
    try {
      await onHandleRequest(reqId, action, circle.id, requesterId);
      const updated = await onFetchRequests(circle.id);
      setRequests(updated);
      toast({ title: action === "approved" ? "Approved!" : "Declined" });
    } catch {
      toast({ title: "Error", description: "Action failed", variant: "destructive" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApproveAll = async () => {
    setLoadingAction(true);
    try {
      await onApproveAll(circle.id);
      const updated = await onFetchRequests(circle.id);
      setRequests(updated);
      toast({ title: "All approved!" });
    } catch {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoadingAction(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");

  // Detail view (non-member, non-creator)
  const renderDetailView = () => (
    <div className="space-y-4">
      {isParticipant && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium">Request approved — welcome!</span>
          </div>
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400 text-[10px]">
            {getTimeLeft(circle.expires_at)}
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 border-2 border-emerald-500/50">
          <AvatarImage src={circle.creator_avatar || undefined} />
          <AvatarFallback className="brand-gradient text-white font-semibold">
            {getInitials(circle.spot_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{circle.spot_name}</h3>
          <p className="text-sm text-muted-foreground">{circle.creator_university || "Wroob Circle"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">When</p>
          <p className="text-sm font-medium">{formatDropInTime(circle.drop_in_time)}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">Where</p>
          <p className="text-sm font-medium">{circle.spot_location || circle.spot_name}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">Fuel</p>
          <p className="text-sm font-medium">{circle.fuel_type}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[11px] text-muted-foreground mb-0.5">Members</p>
          <p className="text-sm font-medium">{circle.participant_count || 1} joined</p>
        </div>
      </div>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">Topic on the table</p>
        <p className="text-sm">{circle.topic}</p>
      </div>

      {/* Actions */}
      {!isCreator && !isParticipant && !circle.my_request_status && (
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleJoinRequest}
            disabled={loadingAction}
            className="w-full brand-gradient border-0 text-white gap-2"
          >
            {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Request to spark this Wroob
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Maybe later
          </Button>
        </div>
      )}

      {circle.my_request_status === "pending" && (
        <div className="text-center py-2">
          <Badge variant="outline" className="border-warning/50 text-warning">Request pending</Badge>
        </div>
      )}

      {(isCreator || isParticipant) && (
        <div className="space-y-2 pt-2">
          {isParticipant && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setView("members")}
            >
              <Users className="h-4 w-4" /> View Circle Members
            </Button>
          )}
          {isCreator && (
            <>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setView("requests")}
              >
                <Users className="h-4 w-4" /> Manage Requests
                {(circle.request_count || 0) > 0 && (
                  <Badge className="ml-1 bg-primary text-primary-foreground text-[10px]">{circle.request_count}</Badge>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={async () => { await onDelete(circle.id); onClose(); }}
              >
                <Trash2 className="h-4 w-4" /> Delete Circle
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Request management view (creator only)
  const renderRequestsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setView("detail")} className="gap-1 text-xs">
          ← Back
        </Button>
        <Badge variant="secondary">Host view</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg border">
          <p className="text-lg font-bold text-emerald-600">{pendingRequests.length}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="text-center p-2 rounded-lg border">
          <p className="text-lg font-bold text-primary">{approvedRequests.length}</p>
          <p className="text-[10px] text-muted-foreground">Approved</p>
        </div>
        <div className="text-center p-2 rounded-lg border">
          <p className="text-lg font-bold">{requests.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <ScrollArea className="max-h-[300px]">
          {pendingRequests.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Waiting to join</p>
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={req.requester_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{getInitials(req.requester_name || "S")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.requester_name}</p>
                    <p className="text-[11px] text-muted-foreground">{req.requester_info}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-warning/50 text-warning shrink-0">New</Badge>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={loadingAction}
                      onClick={() => handleAction(req.id, "declined", req.requester_id)}
                    >
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-[11px] bg-foreground text-background hover:bg-foreground/90"
                      disabled={loadingAction}
                      onClick={() => handleAction(req.id, "approved", req.requester_id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approvedRequests.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Already in</p>
              {approvedRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={req.requester_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{getInitials(req.requester_name || "S")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.requester_name}</p>
                    <p className="text-[11px] text-muted-foreground">{req.requester_info}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-600 dark:text-emerald-400">In circle</Badge>
                </div>
              ))}
            </div>
          )}

          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No requests yet</p>
          )}
        </ScrollArea>
      )}

      {pendingRequests.length > 1 && (
        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={loadingAction}
          onClick={handleApproveAll}
        >
          <Check className="h-4 w-4" /> Let everyone in
        </Button>
      )}
    </div>
  );

  // Members view (participant/creator)
  const renderMembersView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setView("detail")} className="gap-1 text-xs">
          ← Back
        </Button>
        <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 dark:text-emerald-400">Active</Badge>
      </div>

      {loadingData ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Circle Members</p>
          <ScrollArea className="max-h-[250px]">
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.user_avatar || undefined} />
                    <AvatarFallback className="bg-muted text-xs">{getInitials(p.user_name || "S")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.user_name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.user_info}</p>
                  </div>
                  {p.is_creator && (
                    <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">Host</Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-2 pt-2">
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/groups")}>
              <MessageCircle className="h-4 w-4" /> Open group chat
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {view === "requests" ? "Circle Requests" : view === "members" ? "You're in" : "Wroob Circles"}
            <Badge variant="outline" className="text-[10px] ml-auto border-emerald-500/50 text-emerald-600 dark:text-emerald-400">
              Live now
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {view === "detail" && renderDetailView()}
        {view === "requests" && renderRequestsView()}
        {view === "members" && renderMembersView()}
      </DialogContent>
    </Dialog>
  );
};

export default CircleDetailModal;
