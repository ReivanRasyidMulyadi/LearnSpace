export interface Subject {
  id: string;
  title: string;
  progress: number;
  pre_test_completed?: boolean;
}

export interface CourseCatalogItem {
  id: string;
  title: string;
  progress: number;
  pre_test_completed: boolean;
  total_modules: number;
}

export interface StudentDashboardData {
  greeting: string;
  streak_days: number;
  badges_earned: number;
  continue_learning: null | {
    course_id: string;
    title: string;
    progress: number;
    next_module: string;
    next_module_title: string;
  };
  subjects: Subject[];
}

export interface AdminOverview {
  metrics: {
    total_students: number;
    active_courses: number;
    completion_rate: number;
    pending_reviews: number;
  };
  recent_activity: Array<{ id: string; label: string; at: string }>;
}

export type LearningModuleKey =
  | "pre_test"
  | "materials"
  | "videos"
  | "manual_book"
  | "discussion"
  | "post_test"
  | "results";

export interface LearningModule {
  key: LearningModuleKey;
  title: string;
  description: string;
  icon: string; // ionicons name
  locked: boolean;
}
