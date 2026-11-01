import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/Card";
import { Avatar } from "../../components/Avatar";
import { ProgressBar } from "../../components/ProgressBar";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { colors, radius, spacing, typography } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { subscribeTeamAssignments, subscribeTeamMembers } from "../../firebase/firestore";
import { signOut } from "../../firebase/auth";
import type { Assignment, TeamMember } from "../../types";
import type { MasterScreenProps } from "../../navigation/types";

export function MasterDashboardScreen({ navigation }: MasterScreenProps<"Dashboard">) {
  const { profile, team } = useAuth();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);

  useEffect(() => {
    if (!profile?.teamId) return;
    const unsubscribeMembers = subscribeTeamMembers(profile.teamId, setMembers);
    const unsubscribeAssignments = subscribeTeamAssignments(profile.teamId, setAssignments);
    return () => {
      unsubscribeMembers();
      unsubscribeAssignments();
    };
  }, [profile?.teamId]);

  const memberStats = useMemo(() => {
    if (!members || !assignments) return [];
    return members
      .map((member) => {
        const mine = assignments.filter((a) => a.assigneeUid === member.uid);
        const completed = mine.filter((a) => a.completed).length;
        return { member, total: mine.length, completed, open: mine.length - completed };
      })
      .sort((a, b) => b.open - a.open || a.member.name.localeCompare(b.member.name));
  }, [members, assignments]);

  const openCount = assignments?.filter((a) => !a.completed).length ?? 0;
  const completedCount = assignments?.filter((a) => a.completed).length ?? 0;

  async function handleShareCode() {
    if (!team) return;
    try {
      await Share.share({
        message: `Join my ListMaster team "${team.name}" with invite code: ${team.joinCode}`,
      });
    } catch {
      // user dismissed the share sheet; nothing to do
    }
  }

  if (!team || members === null || assignments === null) {
    return <LoadingScreen label="Loading your team..." />;
  }

  return (
    <ScreenContainer style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>{team.name}</Text>
          <Text style={styles.name}>Hi, {profile?.name}</Text>
        </View>
        <Pressable
          onPress={() =>
            Alert.alert("Sign out?", "", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => signOut() },
            ])
          }
          style={styles.signOutButton}
          accessibilityLabel="Sign out"
        >
          <Ionicons name="log-out-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Pressable onPress={handleShareCode} style={{ marginBottom: spacing.lg }}>
        <Card style={styles.codeCard}>
          <View>
            <Text style={styles.codeLabel}>Invite code</Text>
            <Text style={styles.codeValue}>{team.joinCode}</Text>
          </View>
          <View style={styles.shareButton}>
            <Ionicons name="share-outline" size={18} color={colors.primary} />
            <Text style={styles.shareLabel}>Share</Text>
          </View>
        </Card>
      </Pressable>

      <View style={styles.statsRow}>
        <StatPill label="Open" value={openCount} color={colors.warning} background={colors.warningLight} />
        <StatPill label="Completed" value={completedCount} color={colors.success} background={colors.successLight} />
        <StatPill label="Clients" value={members.length} color={colors.primary} background={colors.primaryLight} />
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Team</Text>
      </View>

      {memberStats.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No clients yet"
          subtitle="Share your invite code so clients can join your team."
        />
      ) : (
        <FlatList
          data={memberStats}
          keyExtractor={(item) => item.member.uid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("ClientDetail", {
                  clientUid: item.member.uid,
                  clientName: item.member.name,
                })
              }
            >
              <Card style={styles.memberCard}>
                <Avatar name={item.member.name} />
                <View style={styles.memberBody}>
                  <Text style={styles.memberName}>{item.member.name}</Text>
                  <Text style={styles.memberMeta}>
                    {item.open > 0 ? `${item.open} open` : "All caught up"} · {item.completed} done
                  </Text>
                  {item.total > 0 && (
                    <View style={styles.memberProgress}>
                      <ProgressBar progress={item.completed / item.total} height={6} />
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("CreateTask")}
        accessibilityLabel="Create task"
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>
    </ScreenContainer>
  );
}

function StatPill({
  label,
  value,
  color,
  background,
}: {
  label: string;
  value: number;
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.statPill, { backgroundColor: background }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.lg },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.caption, color: colors.textSecondary },
  name: { ...typography.title, color: colors.text },
  signOutButton: { padding: spacing.sm },
  codeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  codeLabel: { ...typography.label, color: colors.primaryDark, textTransform: "uppercase" },
  codeValue: { ...typography.title, color: colors.primaryDark, letterSpacing: 2, marginTop: 2 },
  shareButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  shareLabel: { ...typography.bodyBold, color: colors.primary },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  statPill: { flex: 1, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  statValue: { ...typography.title },
  statLabel: { ...typography.caption, fontWeight: "700", marginTop: 2 },
  listHeaderRow: { marginBottom: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: "uppercase" },
  listContent: { paddingBottom: spacing.xxl * 2 },
  memberCard: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  memberBody: { flex: 1, marginLeft: spacing.md },
  memberName: { ...typography.bodyBold, color: colors.text },
  memberMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  memberProgress: { marginTop: spacing.sm },
  fab: {
    position: "absolute",
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
