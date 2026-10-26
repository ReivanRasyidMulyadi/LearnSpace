import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
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
import { useAuth } from "@/src/hooks/useAuth";
import { ApiError } from "@/src/services/api";
import { discussionService } from "@/src/services/discussion.service";
import { makeStyles, radius, spacing, typography, useTheme } from "@/src/theme";
import type { DiscussionComment, DiscussionThread } from "@/src/types/discussion";
import { confirmAction } from "@/src/utils/confirm";
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
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.display,
    color: colors.onSurface,
  },

  topic: { marginBottom: spacing.lg, gap: spacing.sm },
  head: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  authorBlock: { flex: 1 },
  authorName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  time: { color: colors.muted, fontSize: typography.size.sm },
  topicTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
  },
  topicBody: { color: colors.onSurface, fontSize: typography.size.base, lineHeight: 22 },

  sectionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  comment: { marginBottom: spacing.sm, gap: spacing.xs },
  reply: { marginLeft: spacing.xl },
  commentBody: { color: colors.onSurface, fontSize: typography.size.base },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  actionText: { fontSize: typography.size.sm, fontWeight: typography.weight.bold },

  editActions: { flexDirection: "row", gap: spacing.sm },
  bodyInput: {
    minHeight: 72,
    borderRadius: radius.lg,
    paddingTop: spacing.md,
    textAlignVertical: "top",
  },
  titleInput: { marginBottom: spacing.sm },

  composer: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  replyingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  replyingText: { color: colors.muted, fontSize: typography.size.sm, flex: 1 },
}));

function roleBadge(role: "STUDENT" | "ADMIN") {
  return role === "ADMIN"
    ? { label: "Guru", tone: "brand" as const }
    : { label: "Siswa", tone: "neutral" as const };
}

function CommentItem({
  comment,
  isReply,
  mine,
  onReply,
  onChanged,
}: {
  comment: DiscussionComment;
  isReply: boolean;
  mine: boolean;
  onReply: (id: string, name: string) => void;
  onChanged: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const rb = roleBadge(comment.author.role);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (draft.trim().length < 1 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await discussionService.updateComment(comment.comment_id, { body: draft.trim() });
      setEditing(false);
      onChanged();
    } catch (e) {
      setErr(e instanceof ApiError ? "Gagal menyimpan." : "Kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirmAction({
      title: "Hapus komentar?",
      message: "Komentar dan balasannya akan dihapus permanen.",
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await discussionService.removeComment(comment.comment_id);
      onChanged();
    } catch {
      setBusy(false);
    }
  };

  return (
    <Card
      style={[styles.comment, isReply && styles.reply] as any}
      tone={isReply ? "tertiary" : "surface"}
      testID={`comment-${comment.comment_id}`}
    >
      <View style={styles.head}>
        <Avatar name={comment.author.name} uri={comment.author.picture} size={isReply ? 28 : 32} />
        <View style={styles.authorBlock}>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.time}>{formatRelative(comment.created_at)}</Text>
        </View>
        <Badge label={rb.label} tone={rb.tone} />
      </View>

      {editing ? (
        <>
          <Input
            value={draft}
            onChangeText={setDraft}
            multiline
            style={styles.bodyInput}
            error={err}
            testID={`comment-edit-input-${comment.comment_id}`}
          />
          <View style={styles.editActions}>
            <Button label="Simpan" onPress={save} loading={busy} disabled={draft.trim().length < 1} testID={`comment-edit-save-${comment.comment_id}`} />
            <Button label="Batal" variant="outline" onPress={() => { setEditing(false); setDraft(comment.body); }} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.commentBody}>{comment.body}</Text>
          <View style={styles.actionsRow}>
            {!isReply ? (
              <Pressable style={styles.actionBtn} onPress={() => onReply(comment.comment_id, comment.author.name)} testID={`comment-reply-${comment.comment_id}`}>
                <Icon name="return-down-forward" size={16} color={colors.brandPrimary} />
                <Text style={[styles.actionText, { color: colors.brandPrimary }]}>Balas</Text>
              </Pressable>
            ) : null}
            {mine ? (
              <>
                <Pressable style={styles.actionBtn} onPress={() => setEditing(true)} testID={`comment-edit-${comment.comment_id}`}>
                  <Icon name="create-outline" size={16} color={colors.muted} />
                  <Text style={[styles.actionText, { color: colors.muted }]}>Edit</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={remove} testID={`comment-delete-${comment.comment_id}`}>
                  <Icon name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Hapus</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </>
      )}
    </Card>
  );
}

export default function DiscussionThreadScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { discussionId } = useLocalSearchParams<{ discussionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const myId = user?.user_id;
  const threadId = discussionId ?? "";

  const [thread, setThread] = useState<DiscussionThread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Topic edit state
  const [editingTopic, setEditingTopic] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [topicBusy, setTopicBusy] = useState(false);
  const [topicErr, setTopicErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    discussionService
      .get(threadId)
      .then(setThread)
      .catch(() => setError("Diskusi tidak ditemukan."));
  }, [threadId]);

  useFocusEffect(
    useCallback(() => {
      if (threadId) load();
    }, [threadId, load]),
  );

  const reload = useCallback(() => {
    discussionService.get(threadId).then(setThread).catch(() => undefined);
  }, [threadId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    discussionService
      .get(threadId)
      .then(setThread)
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [threadId]);

  const grouped = useMemo(() => {
    if (!thread) return [];
    const replies = new Map<string, DiscussionComment[]>();
    for (const c of thread.comments) {
      if (c.parent_comment_id) {
        const list = replies.get(c.parent_comment_id) ?? [];
        list.push(c);
        replies.set(c.parent_comment_id, list);
      }
    }
    return thread.comments
      .filter((c) => !c.parent_comment_id)
      .map((c) => ({ comment: c, children: replies.get(c.comment_id) ?? [] }));
  }, [thread]);

  const submit = async () => {
    if (body.trim().length < 1 || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await discussionService.addComment(threadId, {
        body: body.trim(),
        parent_comment_id: replyTo?.id ?? null,
      });
      setBody("");
      setReplyTo(null);
      reload();
    } catch (e) {
      setFormError(
        e instanceof ApiError ? "Gagal mengirim balasan. Coba lagi." : "Terjadi kesalahan jaringan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditTopic = () => {
    if (!thread) return;
    setEditTitle(thread.discussion.title);
    setEditBody(thread.discussion.body);
    setTopicErr(null);
    setEditingTopic(true);
  };

  const saveTopic = async () => {
    if (editTitle.trim().length < 3 || editBody.trim().length < 1 || topicBusy) return;
    setTopicBusy(true);
    setTopicErr(null);
    try {
      await discussionService.update(threadId, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setEditingTopic(false);
      reload();
    } catch (e) {
      setTopicErr(e instanceof ApiError ? "Gagal menyimpan." : "Kesalahan jaringan.");
    } finally {
      setTopicBusy(false);
    }
  };

  const deleteTopic = async () => {
    const ok = await confirmAction({
      title: "Hapus diskusi?",
      message: "Diskusi beserta seluruh balasannya akan dihapus permanen.",
      confirmLabel: "Hapus",
      destructive: true,
    });
    if (!ok) return;
    try {
      await discussionService.remove(threadId);
      router.back();
    } catch {
      // keep user on screen if delete fails
    }
  };

  if (error) {
    return (
      <ScreenContainer testID="discussion-thread">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="thread-back">
            <Icon name="arrow-back" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
        <EmptyState icon="alert-circle" title="Ups" description={error} actionLabel="Coba lagi" onAction={load} />
      </ScreenContainer>
    );
  }

  if (!thread) return <LoadingSpinner fullScreen label="Memuat diskusi..." />;

  const { discussion } = thread;
  const topicBadge = roleBadge(discussion.author.role);
  const topicMine = discussion.author.user_id === myId;

  return (
    <ScreenContainer
      scroll
      keyboardAvoiding
      testID="discussion-thread"
      contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brandPrimary} />}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="thread-back">
          <Icon name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Diskusi</Text>
      </View>

      <Card elevated style={styles.topic} testID="thread-topic">
        <View style={styles.head}>
          <Avatar name={discussion.author.name} uri={discussion.author.picture} size={40} />
          <View style={styles.authorBlock}>
            <Text style={styles.authorName}>{discussion.author.name}</Text>
            <Text style={styles.time}>{formatRelative(discussion.created_at)}</Text>
          </View>
          <Badge label={topicBadge.label} tone={topicBadge.tone} />
        </View>

        {editingTopic ? (
          <>
            <Input value={editTitle} onChangeText={setEditTitle} maxLength={140} style={styles.titleInput} testID="topic-edit-title" />
            <Input value={editBody} onChangeText={setEditBody} multiline style={styles.bodyInput} error={topicErr} testID="topic-edit-body" />
            <View style={styles.editActions}>
              <Button label="Simpan" onPress={saveTopic} loading={topicBusy} disabled={editTitle.trim().length < 3 || editBody.trim().length < 1} testID="topic-edit-save" />
              <Button label="Batal" variant="outline" onPress={() => setEditingTopic(false)} />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.topicTitle}>{discussion.title}</Text>
            <Text style={styles.topicBody}>{discussion.body}</Text>
            {topicMine ? (
              <View style={styles.actionsRow}>
                <Pressable style={styles.actionBtn} onPress={startEditTopic} testID="topic-edit">
                  <Icon name="create-outline" size={16} color={colors.muted} />
                  <Text style={[styles.actionText, { color: colors.muted }]}>Edit</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={deleteTopic} testID="topic-delete">
                  <Icon name="trash-outline" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Hapus</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        )}
      </Card>

      <Text style={styles.sectionLabel}>{discussion.comment_count} Balasan</Text>

      {grouped.length === 0 ? (
        <EmptyState icon="chatbubble-ellipses" title="Belum ada balasan" description="Jadilah yang pertama membalas diskusi ini." />
      ) : (
        grouped.map(({ comment, children }) => (
          <View key={comment.comment_id}>
            <CommentItem
              comment={comment}
              isReply={false}
              mine={comment.author.user_id === myId}
              onReply={(id, name) => setReplyTo({ id, name })}
              onChanged={reload}
            />
            {children.map((child) => (
              <CommentItem
                key={child.comment_id}
                comment={child}
                isReply
                mine={child.author.user_id === myId}
                onReply={() => undefined}
                onChanged={reload}
              />
            ))}
          </View>
        ))
      )}

      <View style={styles.composer}>
        {replyTo ? (
          <View style={styles.replyingRow}>
            <Text style={styles.replyingText}>Membalas {replyTo.name}</Text>
            <Pressable onPress={() => setReplyTo(null)} testID="cancel-reply">
              <Icon name="close-circle" size={20} color={colors.muted} />
            </Pressable>
          </View>
        ) : null}
        <Input
          placeholder={replyTo ? "Tulis balasanmu..." : "Tulis komentar..."}
          value={body}
          onChangeText={setBody}
          multiline
          style={styles.bodyInput}
          error={formError}
          testID="comment-input"
        />
        <Button
          label={replyTo ? "Kirim Balasan" : "Kirim Komentar"}
          onPress={submit}
          loading={submitting}
          disabled={body.trim().length < 1}
          testID="comment-submit"
        />
      </View>
    </ScreenContainer>
  );
}
