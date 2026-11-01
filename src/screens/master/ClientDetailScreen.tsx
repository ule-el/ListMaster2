import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TaskItem } from "../../components/TaskItem";
import { EmptyState } from "../../components/EmptyState";
import { ProgressBar } from "../../components/ProgressBar";
import { LoadingScreen } from "../../components/LoadingScreen";
import { colors, spacing, typography } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { subscribeTeamAssignments } from "../../firebase/firestore";
import type { Assignment } from "../../types";
import type { MasterScreenProps } from "../../navigation/types";

export function ClientDetailScreen({ route, navigation }: MasterScreenProps<"ClientDetail">) {
  const { clientUid, clientName } = route.params;
  const { profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: clientName });
  }, [navigation, clientName]);

  useEffect(() => {
    if (!profile?.teamId) return;
    return subscribeTeamAssignments(profile.teamId, setAssignments);
  }, [profile?.teamId]);

  const mine = useMemo(
    () => (assignments ?? []).filter((a) => a.assigneeUid === clientUid),
    [assignments, clientUid]
  );

  const sorted = useMemo(() => {
    const open = mine.filter((a) => !a.completed).sort((a, b) => a.assignedAt.toMillis() - b.assignedAt.toMillis());
    const completed = mine
      .filter((a) => a.completed)
      .sort((a, b) => (b.completedAt?.toMillis() ?? 0) - (a.completedAt?.toMillis() ?? 0));
    return [...open, ...completed];
  }, [mine]);

  const completedCount = mine.filter((a) => a.completed).length;

  if (assignments === null) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer style={styles.container}>
      {mine.length > 0 && (
        <View style={styles.summary}>
          <ProgressBar progress={mine.length ? completedCount / mine.length : 0} />
          <Text style={styles.summaryLabel}>
            {completedCount} of {mine.length} tasks completed
          </Text>
        </View>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon="clipboard-outline" title="No tasks assigned" subtitle={`${clientName} has nothing on their list yet.`} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TaskItem assignment={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  summary: { marginBottom: spacing.xl },
  summaryLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  listContent: { paddingBottom: spacing.xxl },
});
