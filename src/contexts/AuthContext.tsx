import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "student" | "employer" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AUTH_CACHE_KEY = "wroob_auth_cache";

function getCachedAuth(): { role: AppRole | null; profile: any | null; userId: string | null } {
  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { role: null, profile: null, userId: null };
}

function setCachedAuth(userId: string | null, role: AppRole | null, profile: any | null) {
  try {
    if (userId) {
      sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ role, profile, userId }));
    } else {
      sessionStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch {}
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = getCachedAuth();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(cached.role);
  const [profile, setProfile] = useState<any | null>(cached.profile);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const initializedRef = useRef(false);

  const syncAuthState = useCallback(async (nextSession: Session | null, isInitial = false) => {
    const requestId = ++requestIdRef.current;

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setRole(null);
      setProfile(null);
      setCachedAuth(null, null, null);
      setLoading(false);
      return;
    }

    // If we have cached data for this user and it's the initial load, use cache instantly
    const cache = getCachedAuth();
    if (isInitial && cache.userId === nextSession.user.id && cache.role) {
      setRole(cache.role);
      setProfile(cache.profile);
      setLoading(false);
      // Still refresh in background
    } else if (!isInitial) {
      // Don't set loading=true on subsequent auth changes to avoid flicker
    }

    try {
      const [{ data: roleData }, { data: profileData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", nextSession.user.id).maybeSingle(),
        supabase.from("profiles").select("*").eq("user_id", nextSession.user.id).maybeSingle(),
      ]);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const newRole = (roleData?.role as AppRole | null) ?? null;
      const newProfile = profileData ?? null;

      setRole(newRole);
      setProfile(newProfile);
      setCachedAuth(nextSession.user.id, newRole, newProfile);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      console.error("Error fetching user data:", error);
      setRole(null);
      setProfile(null);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current || event === "INITIAL_SESSION") return;
      void syncAuthState(nextSession, false);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      initializedRef.current = true;
      void syncAuthState(session, true);
    });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    requestIdRef.current += 1;
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setLoading(false);
    setCachedAuth(null, null, null);

    supabase.auth.signOut().catch((error) => {
      console.error("Sign out error:", error);
    });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (mountedRef.current) {
      setProfile(profileData ?? null);
      setCachedAuth(user.id, role, profileData ?? null);
    }
  }, [user, role]);

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profile, loading, refreshProfile, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
