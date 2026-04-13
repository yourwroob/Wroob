import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConversationList from "./ConversationList";
import ActiveChat from "./ActiveChat";
import { motion, AnimatePresence } from "framer-motion";

const ChatPopup = () => {
  const { role } = useAuth();
  const { conversations, totalUnread, loading } = useDirectMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [activePartnerName, setActivePartnerName] = useState("");
  const [activePartnerAvatar, setActivePartnerAvatar] = useState<string | null>(null);
  // FIX (HIGH-chat-route): Track partner role so ActiveChat links to the right profile page.
  const [activePartnerRole, setActivePartnerRole] = useState<"student" | "employer">("student");

  // Listen for open-dm events from profile pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setActivePartnerId(detail.partnerId);
      setActivePartnerName(detail.partnerName);
      setActivePartnerAvatar(detail.partnerAvatar);
      // FIX (HIGH-chat-route): Read role from event — dispatch sites set this to
      // "student" (StudentProfile) so the chat header links to the right page.
      setActivePartnerRole(detail.partnerRole ?? "student");
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("open-dm", handler);
    return () => window.removeEventListener("open-dm", handler);
  }, []);

  // FIX (HIGH-7): Show chat for both students and employers.
  // The DB RLS policy was fixed (migration 20260413100017) to allow employers to
  // read/write their own DMs. This guard was the only remaining blocker.
  if (role !== "student" && role !== "employer") return null;

  const openConversation = (partnerId: string, name: string, avatar: string | null, role: "student" | "employer" = "student") => {
    setActivePartnerId(partnerId);
    setActivePartnerName(name);
    setActivePartnerAvatar(avatar);
    setActivePartnerRole(role);
  };

  const backToList = () => {
    setActivePartnerId(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[360px] h-[480px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm">Messages</h3>
                {totalUnread > 0 && (
                  <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground">
                    {totalUnread}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => { setIsOpen(false); setActivePartnerId(null); setActivePartnerRole("student"); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {activePartnerId ? (
                <ActiveChat
                  partnerId={activePartnerId}
                  partnerName={activePartnerName}
                  partnerAvatar={activePartnerAvatar}
                  partnerRole={activePartnerRole}
                  onBack={backToList}
                />
              ) : (
                <ConversationList
                  conversations={conversations}
                  loading={loading}
                  onSelect={openConversation}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button / minimized bar */}
      {isOpen && isMinimized ? (
        <motion.button
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Messages</span>
          {totalUnread > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-card text-foreground">
              {totalUnread}
            </Badge>
          )}
          <Maximize2 className="h-3.5 w-3.5 ml-1" />
        </motion.button>
      ) : !isOpen ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {totalUnread}
            </span>
          )}
        </motion.button>
      ) : null}
    </div>
  );
};

export default ChatPopup;
