import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { TextField } from "../../components/TextField";
import { Button } from "../../components/Button";
import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { createTask, subscribeTeamMembers } from "../../firebase/firestore";
import type { TeamMember } from "../../types";
import type { MasterScreenProps } from "../../navigation/types";

export function CreateTaskScreen({ navigation }: MasterScreenProps<"CreateTask">) {
  const { profile } = useAuth();
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignToAll, setAssignToAll] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile?.teamId) return;
    return subscribeTeamMembers(profile.teamId, setMembers);
  }, [profile?.teamId]);

  function toggleMember(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleCreate() {
    if (!profile) return;
    if (!title.trim()) {
      setError("Give the task a title.");
      return;
    }
    const assigneeUids = assignToAll ? (members ?? []).map((m) => m.uid) : Array.from(selected);
    if (assigneeUids.length === 0) {
      setError(assignToAll ? "No clients to assign yet." : "Select at least one client.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await createTask({
        teamId: profile.teamId,
        createdBy: profile.uid,
        title,
        description,
        assigneeUids,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Couldn't create task", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>New task</Text>

          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Paint the fence" />
          <TextField
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Any details the client needs"
            multiline
            numberOfLines={3}
            style={styles.multiline}
          />

          <Text style={styles.sectionLabel}>Assign to</Text>
          <View style={styles.assignToggleRow}>
            <ToggleChip label="Everyone" active={assignToAll} onPress={() => setAssignToAll(true)} />
            <ToggleChip label="Specific clients" active={!assignToAll} onPress={() => setAssignToAll(false)} />
          </View>

          {!assignToAll && (
            <View style={styles.memberList}>
              {members === null ? null : members.length === 0 ? (
                <EmptyState icon="people-outline" title="No clients yet" />
              ) : (
                members.map((member) => {
                  const isSelected = selected.has(member.uid);
                  return (
                    <Pressable
                      key={member.uid}
                      onPress={() => toggleMember(member.uid)}
                      style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                    >
                      <Avatar name={member.name} size={36} />
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Button label="Create task" onPress={handleCreate} loading={loading} />
            <Button label="Cancel" variant="ghost" onPress={() => navigation.goBack()} disabled={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ToggleChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingVertical: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xl },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  assignToggleRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  chipActive: { backgroundColor: colors.primary },
  chipLabel: { ...typography.caption, fontWeight: "700", color: colors.textSecondary },
  chipLabelActive: { color: colors.textInverse },
  memberList: { marginBottom: spacing.lg, gap: spacing.sm },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  memberRowSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  memberName: { ...typography.bodyBold, color: colors.text, marginLeft: spacing.md, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  error: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
