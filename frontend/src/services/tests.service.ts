import { apiFetch } from "@/src/services/api";
import type { CourseProgress, PreTestData, TestAttempt } from "@/src/types/test";

export const testsService = {
  getPreTest: (courseId: string) =>
    apiFetch<PreTestData>(`/tests/${courseId}/pre-test`),

  submitPreTest: (courseId: string, answers: Record<string, number>) =>
    apiFetch<TestAttempt>(`/tests/${courseId}/pre-test/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  getCourseProgress: (courseId: string) =>
    apiFetch<CourseProgress>(`/courses/${courseId}/progress`),

  resetPreTest: (courseId: string) =>
    apiFetch<{ ok: boolean }>(`/tests/${courseId}/pre-test/reset`, {
      method: "POST",
    }),
};
