import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useCampusStatus } from "@/hooks/useCampusStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Send, MessageCircle, Trash2, Loader2, Navigation, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Footer from "@/components/Footer";

const CampusCommunity = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    statuses, loading, location, locationError,
    requestLocation, postStatus, deleteStatus,
    fetchReplies, postReply, refresh,
  } = useCampusStatus();

  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setPosting(true);
    try {
      await postStatus(newContent.trim());
      setNewContent("");
      toast({ title: "Posted!", description: "Your campus status is now live." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleOpenReplies = async (statusId: string) => {
    if (replyingTo === statusId) {
      setReplyingTo(null);
      return;
    }
    setReplyingTo(statusId);
    setLoadingReplies(true);
    const data = await fetchReplies(statusId);
    setReplies(data);
    setLoadingReplies(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !replyingTo) return;
    setSendingReply(true);
    try {
      await postReply(replyingTo, replyText.trim());
      setReplyText("");
      const data = await fetchReplies(replyingTo);
      setReplies(data);
    } catch {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "S";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Campus Community</h1>
          <p className="text-muted-foreground mt-1">
            Discover students nearby and share what's happening around campus.
          </p>
        </div>

        {/* Location gate */}
        {!location ? (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <Navigation className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <h3 className="text-lg font-medium">Enable Location</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Campus Community shows statuses from students within 5 km. Enable location to get started.
              </p>
              {locationError && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
              <Button onClick={requestLocation} className="brand-gradient border-0 text-white gap-2">
                <MapPin className="h-4 w-4" /> Allow Location Access
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Create status */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Textarea
                  placeholder="What's happening around campus?"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value.slice(0, 200))}
                  className="resize-none min-h-[80px]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {newContent.length}/200 characters
                  </span>
                  <Button
                    onClick={handlePost}
                    disabled={!newContent.trim() || posting}
                    size="sm"
                    className="brand-gradient border-0 text-white gap-1"
                  >
                    {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feed header */}
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Nearby Updates</h2>
              <Button variant="ghost" size="sm" onClick={refresh} className="gap-1 text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>

            {/* Feed */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : statuses.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-medium mb-1">No updates nearby</h3>
                  <p className="text-sm text-muted-foreground">
                    Be the first to post something for students in your area!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {statuses.map((status) => (
                  <Card key={status.id} className="overflow-hidden">
                    <CardContent className="pt-5 pb-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={status.student_avatar || undefined} />
                          <AvatarFallback className="brand-gradient text-white text-xs">
                            {getInitials(status.student_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{status.student_name}</span>
                            <Badge variant="outline" className="text-[10px] gap-0.5 px-1.5 py-0">
                              <MapPin className="h-2.5 w-2.5" />
                              {status.distance_km < 1
                                ? `${Math.round(status.distance_km * 1000)}m`
                                : `${status.distance_km.toFixed(1)}km`}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" /> {timeAgo(status.created_at)}
                          </div>
                        </div>
                        {status.student_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteStatus(status.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Content */}
                      <p className="text-sm leading-relaxed pl-12">{status.content}</p>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pl-12">
                        <Button
                          variant={replyingTo === status.id ? "secondary" : "ghost"}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleOpenReplies(status.id)}
                        >
                          <MessageCircle className="h-3 w-3" />
                          {status.reply_count > 0 ? `${status.reply_count} Replies` : "Reply"}
                        </Button>
                      </div>

                      {/* Reply panel */}
                      {replyingTo === status.id && (
                        <div className="pl-12 pt-2 border-t space-y-3">
                          {loadingReplies ? (
                            <div className="flex justify-center py-3">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          ) : replies.length > 0 ? (
                            <ScrollArea className="max-h-48">
                              <div className="space-y-2.5">
                                {replies.map((r) => (
                                  <div key={r.id} className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6 shrink-0">
                                      <AvatarImage src={r.sender_avatar || undefined} />
                                      <AvatarFallback className="text-[9px] bg-muted">
                                        {getInitials(r.sender_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-xs font-medium">{r.sender_name}</span>
                                      <span className="text-xs text-muted-foreground ml-1.5">{timeAgo(r.created_at)}</span>
                                      <p className="text-sm">{r.message}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-1">No replies yet</p>
                          )}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value.slice(0, 500))}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              className="h-8 px-3 brand-gradient border-0 text-white"
                              disabled={!replyText.trim() || sendingReply}
                              onClick={handleSendReply}
                            >
                              {sendingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default CampusCommunity;
