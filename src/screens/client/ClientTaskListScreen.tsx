import React, { useMemo, useState } from "react";
import { Alert, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TaskItem } from "../../components/TaskItem";
import { EmptyState } from "../../components/EmptyState";
import { ProgressBar } from "../../components/ProgressBar";
import { LoadingScreen } from "../../components/LoadingScreen";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { completeAssignment, subscribeMyAssignments } from "../../firebase/firestore";
import { signOut } from "../../firebase/auth";
import type { Assignment } from "../../types";

type Section = { key: "open" | "completed"; title: string; data: Assignment[] };

export function ClientTaskListScreen() {
  const { profile, team } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (!profile?.teamId) return;
    const unsubscribe = subscribeMyAssignments(profile.teamId, profile.uid, setAssignments);
    return unsubscribe;
  }, [profile?.teamId, profile?.uid]);

  const sections = useMemo<Section[]>(() => {
    if (!assignments) return [];
    const open = assignments
      .filter((a) => !a.completed)
      .sort((a, b) => a.assignedAt.toMillis() - b.assignedAt.toMillis());
    const completed = assignments
      .filter((a) => a.completed)
      .sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0));

    const result: Section[] = [];
    if (open.length) result.push({ key: "open", title: `To do (${open.length})`, data: open });
    if (completed.length) {
      result.push({ key: "completed", title: `Completed (${completed.length})`, data: completed });
    }
    return result;
  }, [assignments]);

  const totalCount = assignments?.length ?? 0;
  const completedCount = assignments?.filter((a) => a.completed).length ?? 0;

  function handlePressTask(assignment: Assignment) {
    Alert.alert(
      "Mark as done?",
      `"${assignment.title}" will move to your completed list. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark done",
          onPress: async () => {
            setCompletingId(assignment.id);
            try {
              await completeAssignment(assignment.id);
            } catch {
              Alert.alert("Couldn't complete task", "Please check your connection and try again.");
            } finally {
              setCompletingId(null);
            }
          },
        },
      ]
    );
  }

  if (!profile || assignments === null) {
    return <LoadingScreen label="Loading your tasks..." />;
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>{team?.name ?? "Your team"}</Text>
            <Text style={styles.name}>{profile.name}</Text>
          </View>
          <Pressable
            onPress={() => Alert.alert("Sign out?", "", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => signOut() },
            ])}
            style={styles.signOutButton}
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {totalCount > 0 && (
          <View style={styles.progressRow}>
            <ProgressBar progress={totalCount ? completedCount / totalCount : 0} />
            <Text style={styles.progressLabel}>
              {completedCount} of {totalCount} done
            </Text>
          </View>
        )}
      </View>

      {sections.length === 0 ? (
        <EmptyState
          icon="sparkles-outline"
          title="Nothing assigned yet"
          subtitle="When your master assigns you a task, it'll show up here."
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              assignment={item}
              disabled={item.completed || completingId === item.id}
              onPress={item.completed ? undefined : () => handlePressTask(item)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  header: { marginBottom: spacing.lg },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { ...typography.caption, color: colors.textSecondary },
  name: { ...typography.title, color: colors.text },
  signOutButton: { padding: spacing.sm },
  progressRow: { marginTop: spacing.lg },
  progressLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  listContent: { paddingBottom: spacing.xxl },
});
