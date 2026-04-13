import { useState, useRef, useEffect } from "react";
import { useChatMessages } from "@/hooks/useDirectMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ActiveChatProps {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  // FIX (HIGH-chat-route): Role determines which profile route to navigate to.
  partnerRole: "student" | "employer";
  onBack: () => void;
}

const ActiveChat = ({ partnerId, partnerName, partnerAvatar, partnerRole, onBack }: ActiveChatProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, loading } = useChatMessages(partnerId);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await sendMessage(text.trim());
    setText("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button
          // FIX (HIGH-chat-route): Use partnerRole to navigate to the correct
          // profile route. Previously hardcoded /student/:id for all partners,
          // routing employer partners to a non-existent student profile.
          onClick={() => navigate(partnerRole === "employer" ? `/employers/${partnerId}` : `/student/${partnerId}`)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={partnerAvatar || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {partnerName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{partnerName}</span>
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-xs">
            Say hello! 👋
          </div>
        ) : (
          <div className="space-y-2 py-3">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p className={`text-[9px] mt-0.5 ${isMe ? "text-primary-foreground/50" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex gap-2">
          <Input
            placeholder="Message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 h-9 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActiveChat;
