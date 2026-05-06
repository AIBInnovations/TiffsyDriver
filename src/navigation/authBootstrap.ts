import type { AuthStackParamList } from "./types";

export type AuthBootstrap =
  | { initialRoute: "Login" }
  | { initialRoute: "ApprovalWaiting"; params: AuthStackParamList["ApprovalWaiting"] }
  | { initialRoute: "Rejection"; params: AuthStackParamList["Rejection"] }
  | { initialRoute: "ProfileOnboarding"; params: AuthStackParamList["ProfileOnboarding"] };

let current: AuthBootstrap = { initialRoute: "Login" };

export const setAuthBootstrap = (next: AuthBootstrap) => {
  current = next;
};

export const getAuthBootstrap = (): AuthBootstrap => current;
