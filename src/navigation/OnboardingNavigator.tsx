import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";
import { RoleSelectScreen } from "../screens/auth/RoleSelectScreen";
import { CreateTeamScreen } from "../screens/auth/CreateTeamScreen";
import { JoinTeamScreen } from "../screens/auth/JoinTeamScreen";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: "",
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "" }} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: "" }} />
      <Stack.Screen name="JoinTeam" component={JoinTeamScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
