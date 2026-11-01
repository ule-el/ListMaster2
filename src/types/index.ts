import { Timestamp } from "firebase/firestore";

export type Role = "master" | "client";

export interface UserProfile {
  uid: string;
  name: string;
  role: Role;
  teamId: string;
  createdAt: Timestamp;
}

export interface Team {
  id: string;
  name: string;
  masterUid: string;
  joinCode: string;
  createdAt: Timestamp;
}

export interface TaskDoc {
  id: string;
  teamId: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Timestamp;
  assignedTo: string[]; // uids of clients this task was assigned to
}

export interface Assignment {
  id: string;
  taskId: string;
  teamId: string;
  assigneeUid: string;
  title: string;
  description: string;
  assignedAt: Timestamp;
  completed: boolean;
  completedAt: Timestamp | null;
}

export interface TeamMember {
  uid: string;
  name: string;
}
