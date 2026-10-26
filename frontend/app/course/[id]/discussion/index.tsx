import { useCallback, useState } from "react";
import { Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  LoadingSpinner,
  ScreenContainer,
} from "@/src/components/ui";
import { ApiError } from "@/src/services/api";
import { discussionService } from "@/src/services/discussion.service";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { Discussion } from "@/src/types/discussion";
import { formatRelative } from "@/src/utils/datetime";

const useStyles = makeStyles((colors) => ({
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  headerText: { flex: 1 },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },
  subtitle: { color: colors.muted, fontSize: typography.size.base },

  composer: { marginBottom: spacing.lg, gap: spacing.sm },
  composerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  bodyInput: {
    minHeight: 92,
    borderRadius: radius.lg,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },

  item: {
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  itemHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  authorBlock: { flex: 1 },
  authorName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  time: { color: colors.muted, fontSize: typography.size.sm },
  itemTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  itemBody: { color: colors.onSurfaceTertiary, fontSize: typography.size.base },
  itemFoot: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  footText: { color: colors.muted, fontSize: typography.size.sm },
}));

function roleBadge(role: "STUDENT" | "ADMIN") {
  return role === "ADMIN"
    ? { label: "Guru", tone: "brand" as const }
    : { label: "Siswa", tone: "neutral" as const };
}

export default function DiscussionList() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const courseId = id ?? "";

  const [items, setItems] = useState<Discussion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    discussionService
      .list(courseId)
      .then((r) => setItems(r.discussions))
      .catch(() => setError("Gagal memuat diskusi."));
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      if (courseId) load();
    }, [courseId, load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    discussionService
      .list(courseId)
      .then((r) => setItems(r.discussions))
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [courseId]);

  const canSubmit = title.trim().length >= 3 && body.trim().length >= 1;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await discussionService.create(courseId, {
        title: title.trim(),
        body: body.trim(),
      });
      setItems((prev) => [created, ...(prev ?? [])]);
      setTitle("");
      setBody("");
    } catch (e) {
      setFormError(
        e instanceof ApiError
          ? "Gagal mengirim diskusi. Coba lagi."
          : "Terjadi kesalahan jaringan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <ScreenContainer testID="discussion-list">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="discussion-back">
            <Icon name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <EmptyState icon="alert-circle" title="Ups" description={error} actionLabel="Coba lagi" onAction={load} />
      </ScreenContainer>
    );
  }

  if (!items) return <LoadingSpinner fullScreen label="Memuat diskusi..." />;

  return (
    <ScreenContainer
      scroll
      keyboardAvoiding
      testID="discussion-list"
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />
      }
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="discussion-back">
          <Icon name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Diskusi</Text>
          <Text style={styles.subtitle}>Tanya & berbagi dengan guru dan teman</Text>
        </View>
      </View>

      <Card elevated style={styles.composer} testID="discussion-composer">
        <Text style={styles.composerTitle}>Mulai diskusi baru</Text>
        <Input
          placeholder="Judul diskusi"
          value={title}
          onChangeText={setTitle}
          maxLength={140}
          testID="discussion-title-input"
        />
        <Input
          placeholder="Tulis pertanyaan atau topikmu..."
          value={body}
          onChangeText={setBody}
          multiline
          style={styles.bodyInput}
          testID="discussion-body-input"
          error={formError}
        />
        <Button
          label="Kirim Diskusi"
          onPress={submit}
          loading={submitting}
          disabled={!canSubmit}
          testID="discussion-submit"
        />
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon="chatbubbles"
          title="Belum ada diskusi"
          description="Jadilah yang pertama memulai diskusi di kelas ini."
        />
      ) : (
        items.map((d) => {
          const rb = roleBadge(d.author.role);
          return (
            <Pressable
              key={d.discussion_id}
              onPress={() => router.push(`/course/${courseId}/discussion/${d.discussion_id}`)}
              testID={`discussion-item-${d.discussion_id}`}
            >
              <Card elevated style={styles.item}>
                <View style={styles.itemHead}>
                  <Avatar name={d.author.name} uri={d.author.picture} size={40} />
                  <View style={styles.authorBlock}>
                    <Text style={styles.authorName}>{d.author.name}</Text>
                    <Text style={styles.time}>{formatRelative(d.created_at)}</Text>
                  </View>
                  <Badge label={rb.label} tone={rb.tone} />
                </View>
                <Text style={styles.itemTitle}>{d.title}</Text>
                <Text style={styles.itemBody} numberOfLines={2}>
                  {d.body}
                </Text>
                <View style={styles.itemFoot}>
                  <Icon name="chatbubble-outline" size={16} color={colors.muted} />
                  <Text style={styles.footText}>{d.comment_count} balasan</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </ScreenContainer>
  );
}
