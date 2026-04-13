import { Conversation } from "@/hooks/useDirectMessages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNowStrict } from "date-fns";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  // FIX (HIGH-chat-route): Thread partnerRole through so ChatPopup can pass it to ActiveChat.
  onSelect: (partnerId: string, name: string, avatar: string | null, role: "student" | "employer") => void;
}

const ConversationList = ({ conversations, loading, onSelect }: ConversationListProps) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-2.5 w-40 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6 text-center">
        <p className="text-sm">No messages yet</p>
        <p className="text-xs mt-1">Start a conversation from a student's profile</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {conversations.map((conv) => (
          <button
            key={conv.partnerId}
            onClick={() => onSelect(conv.partnerId, conv.partnerName, conv.partnerAvatar, conv.partnerRole)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conv.partnerAvatar || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {conv.partnerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {conv.unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary border-2 border-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                  {conv.partnerName}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {conv.lastMessageAt
                    ? formatDistanceToNowStrict(new Date(conv.lastMessageAt), { addSuffix: false })
                    : ""}
                </span>
              </div>
              <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {conv.lastMessage}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
