import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { subscribeToAuthState } from "../firebase/auth";
import { subscribeTeam, subscribeUserProfile } from "../firebase/firestore";
import type { Team, UserProfile } from "../types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  team: Team | null;
  initializing: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  team: null,
  initializing: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [profileResolved, setProfileResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setTeam(null);
        setProfileResolved(true);
      } else {
        setProfileResolved(false);
      }
      setAuthResolved(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeUserProfile(firebaseUser.uid, (p) => {
      setProfile(p);
      setProfileResolved(true);
    });
    return unsubscribe;
  }, [firebaseUser]);

  useEffect(() => {
    if (!profile?.teamId) {
      setTeam(null);
      return;
    }
    const unsubscribe = subscribeTeam(profile.teamId, setTeam);
    return unsubscribe;
  }, [profile?.teamId]);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      team,
      initializing: !authResolved || !profileResolved,
    }),
    [firebaseUser, profile, team, authResolved, profileResolved]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
