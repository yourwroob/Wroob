import { Link, useNavigate, useLocation } from "react-router-dom";
import wroobeLogo from "@/assets/wroob-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Briefcase, LogOut, Menu, MessageCircle, Share2, User, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUnreadGroupMessages } from "@/hooks/useUnreadGroupMessages";

const Navbar = () => {
  const { user, role, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { toast } = useToast();
  const { count: unreadGroupCount, markRead: markGroupsRead } = useUnreadGroupMessages();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => {
    const name = profile?.full_name || user?.email || "";
    return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    cn(
      "transition-colors duration-200 hover:text-[hsl(var(--nav-hover))] focus-visible:text-[hsl(var(--nav-hover))] focus-visible:outline-none",
      isActive(path) ? "text-foreground" : "text-muted-foreground"
    );

  const centerLinks = () => {
    if (!user || !role) {
      return (
        <>
          <Link to="/internships" className={navLinkClass("/internships")} style={{ font: "var(--text-nav)" }}>
            Discover
          </Link>
          <Link to="/signup?role=student" className={navLinkClass("/signup?role=student")} style={{ font: "var(--text-nav)" }}>
            For Students
          </Link>
          <Link to="/signup?role=employer" className={navLinkClass("/signup?role=employer")} style={{ font: "var(--text-nav)" }}>
            For Companies
          </Link>
        </>
      );
    }
    if (role === "student") {
      return (
        <>
          <Link to="/internships" className={navLinkClass("/internships")} style={{ font: "var(--text-nav)" }}>Discover</Link>
          <Link to="/feed" className={navLinkClass("/feed")} style={{ font: "var(--text-nav)" }}>Feed</Link>
          <Link to="/my-applications" className={navLinkClass("/my-applications")} style={{ font: "var(--text-nav)" }}>My Applications</Link>
          <Link to="/students" className={navLinkClass("/students")} style={{ font: "var(--text-nav)" }}>LinkUp</Link>
          <Link to="/skill-tests" className={navLinkClass("/skill-tests")} style={{ font: "var(--text-nav)" }}>Skill Tests</Link>
          <Link to="/campus" className={navLinkClass("/campus")} style={{ font: "var(--text-nav)" }}>PeerUp</Link>
          <Link to="/groups" onClick={markGroupsRead} className={cn("relative", navLinkClass("/groups"))} style={{ font: "var(--text-nav)" }}>
            Groups
            {unreadGroupCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full brand-gradient text-white text-[9px] font-bold px-1">
                {unreadGroupCount > 9 ? "9+" : unreadGroupCount}
              </span>
            )}
          </Link>
        </>
      );
    }
    if (role === "employer") {
      return (
        <>
          <Link to="/my-internships" className={navLinkClass("/my-internships")} style={{ font: "var(--text-nav)" }}>My Internships</Link>
          <Link to="/feed" className={navLinkClass("/feed")} style={{ font: "var(--text-nav)" }}>Feed</Link>
          <Link to="/post-internship" className={navLinkClass("/post-internship")} style={{ font: "var(--text-nav)" }}>Post Internship</Link>
          <Link to="/groups" onClick={markGroupsRead} className={cn("relative", navLinkClass("/groups"))} style={{ font: "var(--text-nav)" }}>
            Groups
            {unreadGroupCount > 0 && (
              <span className="absolute -right-4 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full brand-gradient text-white text-[9px] font-bold px-1">
                {unreadGroupCount > 9 ? "9+" : unreadGroupCount}
              </span>
            )}
          </Link>
        </>
      );
    }
    if (role === "admin") {
      return (
        <Link to="/admin" className={navLinkClass("/admin")} style={{ font: "var(--text-nav)" }}>Admin Panel</Link>
      );
    }
    return null;
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-200",
      scrolled ? "border-b bg-background/80 backdrop-blur-xl shadow-sm" : "bg-background/95 backdrop-blur-sm"
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="shrink-0">
          <img src={wroobeLogo} alt="Wroob" className="h-14" />
        </Link>

        {/* Center: Nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {centerLinks()}
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/notifications")}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[9px] brand-gradient border-0 text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex gap-1.5 text-xs"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="brand-gradient text-white text-xs">{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {role === "student" && (
                    <DropdownMenuItem onClick={async () => {
                      const url = `${window.location.origin}/student/${user.id}`;
                      await navigator.clipboard.writeText(url);
                      toast({ title: "Link copied!", description: "Your profile link has been copied to clipboard." });
                    }}>
                      <Share2 className="mr-2 h-4 w-4" /> Share your profile
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log In</Button>
              <Button size="sm" className="brand-gradient border-0 text-white shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200" onClick={() => navigate("/signup")}>Sign Up</Button>
            </div>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t bg-background p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-3">
            {centerLinks()}
            {user ? (
              <div className="pt-3 border-t">
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Log In</Button>
                <Button size="sm" className="brand-gradient border-0 text-white" onClick={() => { navigate("/signup"); setMobileOpen(false); }}>Sign Up</Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
