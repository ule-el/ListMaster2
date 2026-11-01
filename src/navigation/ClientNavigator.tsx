import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ClientTaskListScreen } from "../screens/client/ClientTaskListScreen";
import type { ClientStackParamList } from "./types";

const Stack = createNativeStackNavigator<ClientStackParamList>();

export function ClientNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyTasks" component={ClientTaskListScreen} />
    </Stack.Navigator>
  );
}
