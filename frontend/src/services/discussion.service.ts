import { apiFetch } from "@/src/services/api";
import type {
  Discussion,
  DiscussionComment,
  DiscussionThread,
} from "@/src/types/discussion";

export const discussionService = {
  list: (courseId: string) =>
    apiFetch<{ discussions: Discussion[] }>(`/courses/${courseId}/discussions`),

  create: (courseId: string, payload: { title: string; body: string }) =>
    apiFetch<Discussion>(`/courses/${courseId}/discussions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  get: (discussionId: string) =>
    apiFetch<DiscussionThread>(`/discussions/${discussionId}`),

  addComment: (
    discussionId: string,
    payload: { body: string; parent_comment_id?: string | null },
  ) =>
    apiFetch<DiscussionComment>(`/discussions/${discussionId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (discussionId: string, payload: { title: string; body: string }) =>
    apiFetch<Discussion>(`/discussions/${discussionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  remove: (discussionId: string) =>
    apiFetch<{ ok: boolean }>(`/discussions/${discussionId}`, {
      method: "DELETE",
    }),

  updateComment: (commentId: string, payload: { body: string }) =>
    apiFetch<DiscussionComment>(`/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  removeComment: (commentId: string) =>
    apiFetch<{ ok: boolean }>(`/comments/${commentId}`, {
      method: "DELETE",
    }),
};
