export interface TestQuestion {
  question_id: string;
  course_id: string;
  test_type: "pre_test";
  order: number;
  text: string;
  options: string[];
}

export interface ReviewItem {
  question_id: string;
  order: number;
  text: string;
  options: string[];
  selected_index: number | null;
  correct_index: number;
  is_correct: boolean;
}

export interface TestAttempt {
  attempt_id: string;
  course_id: string;
  test_type: "pre_test";
  answers: Record<string, number>;
  score: number;
  total: number;
  percentage: number;
  review: ReviewItem[];
  completed_at: string;
}

export interface PreTestData {
  course_id: string;
  course_title: string;
  test_type: "pre_test";
  total_questions: number;
  questions: TestQuestion[];
  attempt: TestAttempt | null;
}

export interface CourseModuleState {
  key: string;
  title: string;
  description: string;
  icon: string;
  locked: boolean;
  completed: boolean;
}

export interface CourseProgress {
  course_id: string;
  title: string;
  pre_test_completed: boolean;
  completed_count: number;
  total_modules: number;
  progress_percent: number;
  next_module: string | null;
  modules: CourseModuleState[];
}
