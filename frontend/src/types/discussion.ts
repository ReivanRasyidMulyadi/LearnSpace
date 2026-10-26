export interface DiscussionAuthor {
  user_id: string;
  name: string;
  role: "STUDENT" | "ADMIN";
  picture?: string | null;
}

export interface Discussion {
  discussion_id: string;
  course_id: string;
  title: string;
  body: string;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author: DiscussionAuthor;
}

export interface DiscussionComment {
  comment_id: string;
  discussion_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  author: DiscussionAuthor;
}

export interface DiscussionThread {
  discussion: Discussion;
  comments: DiscussionComment[];
}
