import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

export type OnboardingStackParamList = {
  RoleSelect: undefined;
  CreateTeam: undefined;
  JoinTeam: undefined;
};

export type ClientStackParamList = {
  MyTasks: undefined;
};

export type MasterStackParamList = {
  Dashboard: undefined;
  CreateTask: undefined;
  ClientDetail: { clientUid: string; clientName: string };
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> = NativeStackScreenProps<
  OnboardingStackParamList,
  T
>;
export type MasterScreenProps<T extends keyof MasterStackParamList> = NativeStackScreenProps<
  MasterStackParamList,
  T
>;
