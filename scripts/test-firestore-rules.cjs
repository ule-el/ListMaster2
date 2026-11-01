/**
 * Scripted check of firestore.rules against a local Firestore emulator.
 * Run with `npm run test:rules` (spins the emulator up and down for you).
 *
 * Covers both the allowed paths (team/task creation, joining, completing
 * your own task) and every cheat/attack attempt the rules are meant to
 * block (self-promoting role, completing someone else's task, backdating
 * or reversing a completion, editing a task while "completing" it, reading
 * another client's tasks, impersonating another team's master, ...).
 */
const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");
const { doc, setDoc, getDoc, updateDoc, serverTimestamp, writeBatch, collection } = require("firebase/firestore");

const PROJECT_ROOT = path.join(__dirname, "..");
const EMULATOR_HOST = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: "demo-listmaster2",
    firestore: {
      rules: fs.readFileSync(path.join(PROJECT_ROOT, "firestore.rules"), "utf8"),
      host: EMULATOR_HOST[0],
      port: Number(EMULATOR_HOST[1]),
    },
  });

  let passed = 0;
  let failed = 0;
  async function check(name, fn) {
    try {
      await fn();
      console.log(`PASS: ${name}`);
      passed++;
    } catch (e) {
      console.log(`FAIL: ${name} -> ${e.message}`);
      failed++;
    }
  }

  await testEnv.clearFirestore();

  const masterUid = "master1";
  const clientUid = "client1";
  const otherClientUid = "client2";
  const outsiderUid = "outsider1";
  const teamId = "ABC123";

  const masterCtx = testEnv.authenticatedContext(masterUid);
  const clientCtx = testEnv.authenticatedContext(clientUid);
  const otherClientCtx = testEnv.authenticatedContext(otherClientUid);
  const outsiderCtx = testEnv.authenticatedContext(outsiderUid);

  // --- Master creates a team, then their own profile (two sequential writes) ---
  await check("master can create a team", async () => {
    const db = masterCtx.firestore();
    await assertSucceeds(
      setDoc(doc(db, "teams", teamId), {
        name: "Test Team",
        masterUid,
        joinCode: teamId,
        createdAt: serverTimestamp(),
      })
    );
  });

  await check("master can then create their own profile pointing at that team", async () => {
    const db = masterCtx.firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", masterUid), {
        name: "Master Mike",
        role: "master",
        teamId,
        createdAt: serverTimestamp(),
      })
    );
  });

  await check("a user cannot create a team claiming someone else as its master", async () => {
    const db = outsiderCtx.firestore();
    await assertFails(
      setDoc(doc(db, "teams", "HACK01"), {
        name: "Fake Team",
        masterUid, // impersonating an existing master
        joinCode: "HACK01",
        createdAt: serverTimestamp(),
      })
    );
  });

  // --- Clients join using the team doc (join code == doc id) ---
  await check("client can join an existing team", async () => {
    const db = clientCtx.firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", clientUid), {
        name: "Client Carl",
        role: "client",
        teamId,
        createdAt: serverTimestamp(),
      })
    );
  });

  await check("second client can join the same team", async () => {
    const db = otherClientCtx.firestore();
    await assertSucceeds(
      setDoc(doc(db, "users", otherClientUid), {
        name: "Client Cara",
        role: "client",
        teamId,
        createdAt: serverTimestamp(),
      })
    );
  });

  await check("client cannot self-register as master", async () => {
    const db = outsiderCtx.firestore();
    await assertFails(
      setDoc(doc(db, "users", outsiderUid), {
        name: "Sneaky",
        role: "master",
        teamId,
        createdAt: serverTimestamp(),
      })
    );
  });

  await check("a signed-up user cannot change their own role afterwards", async () => {
    const db = clientCtx.firestore();
    await assertFails(updateDoc(doc(db, "users", clientUid), { role: "master" }));
  });

  // --- Master assigns a task to client1 ---
  let assignmentId;
  await check("master can create a task + assignment for a real client in their team", async () => {
    const db = masterCtx.firestore();
    const taskRef = doc(collection(db, "tasks"));
    const assignmentRef = doc(collection(db, "assignments"));
    assignmentId = assignmentRef.id;
    const batch = writeBatch(db);
    batch.set(taskRef, {
      teamId,
      title: "Paint the fence",
      description: "",
      createdBy: masterUid,
      assignedTo: [clientUid],
      createdAt: serverTimestamp(),
    });
    batch.set(assignmentRef, {
      taskId: taskRef.id,
      teamId,
      assigneeUid: clientUid,
      title: "Paint the fence",
      description: "",
      assignedAt: serverTimestamp(),
      completed: false,
      completedAt: null,
    });
    await assertSucceeds(batch.commit());
  });

  await check("master cannot assign a task to someone outside the team", async () => {
    const db = masterCtx.firestore();
    const assignmentRef = doc(collection(db, "assignments"));
    await assertFails(
      setDoc(assignmentRef, {
        taskId: "fake-task",
        teamId,
        assigneeUid: outsiderUid,
        title: "Should fail",
        description: "",
        assignedAt: serverTimestamp(),
        completed: false,
        completedAt: null,
      })
    );
  });

  await check("a client cannot create their own assignment (only the master can)", async () => {
    const db = clientCtx.firestore();
    const assignmentRef = doc(collection(db, "assignments"));
    await assertFails(
      setDoc(assignmentRef, {
        taskId: "fake-task",
        teamId,
        assigneeUid: clientUid,
        title: "Self-assigned",
        description: "",
        assignedAt: serverTimestamp(),
        completed: false,
        completedAt: null,
      })
    );
  });

  await check("the other client cannot complete client1's assignment", async () => {
    const db = otherClientCtx.firestore();
    await assertFails(
      updateDoc(doc(db, "assignments", assignmentId), { completed: true, completedAt: serverTimestamp() })
    );
  });

  await check("a client cannot backdate completedAt to a client-chosen value", async () => {
    const db = clientCtx.firestore();
    await assertFails(
      updateDoc(doc(db, "assignments", assignmentId), { completed: true, completedAt: new Date("2020-01-01") })
    );
  });

  await check("a client cannot rewrite the task title while completing it", async () => {
    const db = clientCtx.firestore();
    await assertFails(
      updateDoc(doc(db, "assignments", assignmentId), {
        completed: true,
        completedAt: serverTimestamp(),
        title: "Something else entirely",
      })
    );
  });

  await check("the assignee can mark their own assignment complete with a server timestamp", async () => {
    const db = clientCtx.firestore();
    await assertSucceeds(
      updateDoc(doc(db, "assignments", assignmentId), { completed: true, completedAt: serverTimestamp() })
    );
  });

  await check("completion cannot be reversed afterwards", async () => {
    const db = clientCtx.firestore();
    await assertFails(updateDoc(doc(db, "assignments", assignmentId), { completed: false, completedAt: null }));
  });

  await check("completion cannot be re-stamped to a new time after the fact", async () => {
    const db = clientCtx.firestore();
    await assertFails(
      updateDoc(doc(db, "assignments", assignmentId), { completed: true, completedAt: serverTimestamp() })
    );
  });

  await check("an outsider (no profile at all) cannot read the team's assignments", async () => {
    const db = outsiderCtx.firestore();
    await assertFails(getDoc(doc(db, "assignments", assignmentId)));
  });

  await check("the other client cannot read client1's assignment", async () => {
    const db = otherClientCtx.firestore();
    await assertFails(getDoc(doc(db, "assignments", assignmentId)));
  });

  await check("the master can read any assignment in their team", async () => {
    const db = masterCtx.firestore();
    await assertSucceeds(getDoc(doc(db, "assignments", assignmentId)));
  });

  await testEnv.cleanup();

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
