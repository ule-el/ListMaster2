import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";
import { MasterDashboardScreen } from "../screens/master/MasterDashboardScreen";
import { CreateTaskScreen } from "../screens/master/CreateTaskScreen";
import { ClientDetailScreen } from "../screens/master/ClientDetailScreen";
import type { MasterStackParamList } from "./types";

const Stack = createNativeStackNavigator<MasterStackParamList>();

export function MasterNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={MasterDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ title: "" }} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} options={{ title: "" }} />
    </Stack.Navigator>
  );
}
