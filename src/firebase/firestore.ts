import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type { Assignment, Team, TeamMember, UserProfile } from "../types";

const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid ambiguity

function randomJoinCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)];
  }
  return out;
}

// The join code doubles as the team's document ID. That turns "look up a team
// by its code" into a direct, narrowly-scoped get() instead of an open query
// over the whole teams collection — which matters for security: a query would
// need "list" access on the collection, letting any signed-in user enumerate
// every team's invite code. A get() only reveals the one team whose exact code
// the caller already has.
async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = randomJoinCode();
    const snap = await getDoc(doc(db, "teams", code));
    if (!snap.exists()) return code;
  }
  throw new Error("Couldn't generate a join code right now. Please try again.");
}

function toUserProfile(snap: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = snap.data();
  return {
    uid: snap.id,
    name: data.name,
    role: data.role,
    teamId: data.teamId,
    createdAt: data.createdAt,
  };
}

function toTeam(snap: QueryDocumentSnapshot<DocumentData>): Team {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    masterUid: data.masterUid,
    joinCode: data.joinCode,
    createdAt: data.createdAt,
  };
}

function toAssignment(snap: QueryDocumentSnapshot<DocumentData>): Assignment {
  const data = snap.data();
  return {
    id: snap.id,
    taskId: data.taskId,
    teamId: data.teamId,
    assigneeUid: data.assigneeUid,
    title: data.title,
    description: data.description,
    assignedAt: data.assignedAt,
    completed: data.completed,
    completedAt: data.completedAt,
  };
}

/** Creates a new team and registers the current user as its master. */
export async function createTeamAndMaster(uid: string, name: string, teamName: string) {
  const joinCode = await generateUniqueJoinCode();

  // Two sequential writes rather than one batch: security rules evaluate a
  // batch's writes independently, so the user-doc write below needs the team
  // to already be committed in order to verify masterUid against it.
  await setDoc(doc(db, "teams", joinCode), {
    name: teamName.trim(),
    masterUid: uid,
    joinCode,
    createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "users", uid), {
    name: name.trim(),
    role: "master",
    teamId: joinCode,
    createdAt: serverTimestamp(),
  });

  return { teamId: joinCode, joinCode };
}

/** Joins an existing team as a client using its join code. */
export async function joinTeamAsClient(uid: string, name: string, joinCode: string) {
  const normalized = joinCode.trim().toUpperCase();
  const teamSnap = await getDoc(doc(db, "teams", normalized));
  if (!teamSnap.exists()) {
    throw new Error("No team found with that code. Double-check and try again.");
  }
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    name: name.trim(),
    role: "client",
    teamId: normalized,
    createdAt: serverTimestamp(),
  });

  return { teamId: normalized };
}

export function subscribeUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    callback(snap.exists() ? toUserProfile(snap as QueryDocumentSnapshot<DocumentData>) : null);
  });
}

export function subscribeTeam(teamId: string, callback: (team: Team | null) => void): Unsubscribe {
  return onSnapshot(doc(db, "teams", teamId), (snap) => {
    callback(snap.exists() ? toTeam(snap as QueryDocumentSnapshot<DocumentData>) : null);
  });
}

export function subscribeTeamMembers(
  teamId: string,
  callback: (members: TeamMember[]) => void
): Unsubscribe {
  const q = query(collection(db, "users"), where("teamId", "==", teamId), where("role", "==", "client"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, name: d.data().name as string })));
  });
}

interface CreateTaskInput {
  teamId: string;
  createdBy: string;
  title: string;
  description: string;
  assigneeUids: string[];
}

/** Creates a task and one assignment per assignee, all server-timestamped together. */
export async function createTask({ teamId, createdBy, title, description, assigneeUids }: CreateTaskInput) {
  if (assigneeUids.length === 0) {
    throw new Error("Select at least one client to assign this task to.");
  }

  const taskRef = doc(collection(db, "tasks"));
  const batch = writeBatch(db);

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  batch.set(taskRef, {
    teamId,
    title: trimmedTitle,
    description: trimmedDescription,
    createdBy,
    assignedTo: assigneeUids,
    createdAt: serverTimestamp(),
  });

  for (const assigneeUid of assigneeUids) {
    const assignmentRef = doc(collection(db, "assignments"));
    batch.set(assignmentRef, {
      taskId: taskRef.id,
      teamId,
      assigneeUid,
      title: trimmedTitle,
      description: trimmedDescription,
      assignedAt: serverTimestamp(),
      completed: false,
      completedAt: null,
    });
  }

  await batch.commit();
}

export function subscribeMyAssignments(
  teamId: string,
  uid: string,
  callback: (assignments: Assignment[]) => void
): Unsubscribe {
  const q = query(collection(db, "assignments"), where("teamId", "==", teamId), where("assigneeUid", "==", uid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(toAssignment));
  });
}

export function subscribeTeamAssignments(
  teamId: string,
  callback: (assignments: Assignment[]) => void
): Unsubscribe {
  const q = query(collection(db, "assignments"), where("teamId", "==", teamId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(toAssignment));
  });
}

/** Marks an assignment complete. Only the assignee may call this; rules enforce a one-way,
 * server-timestamped transition so completion time can't be faked or reset by the client. */
export async function completeAssignment(assignmentId: string) {
  await updateDoc(doc(db, "assignments", assignmentId), {
    completed: true,
    completedAt: serverTimestamp(),
  });
}
