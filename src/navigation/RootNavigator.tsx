import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { ClientNavigator } from "./ClientNavigator";
import { MasterNavigator } from "./MasterNavigator";

export function RootNavigator() {
  const { firebaseUser, profile, initializing } = useAuth();

  return (
    <NavigationContainer>
      {initializing ? (
        <LoadingScreen />
      ) : !firebaseUser ? (
        <AuthNavigator />
      ) : !profile ? (
        <OnboardingNavigator />
      ) : profile.role === "master" ? (
        <MasterNavigator />
      ) : (
        <ClientNavigator />
      )}
    </NavigationContainer>
  );
}
