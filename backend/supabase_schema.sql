-- ========================================================
-- LearnSpace Supabase PostgreSQL Schema
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users & Profiles
create table if not exists users (
    user_id text primary key,
    email text unique not null,
    name text not null,
    role text not null default 'STUDENT', -- 'STUDENT' or 'ADMIN'
    password_hash text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists profiles (
    profile_id text primary key,
    user_id text unique not null references users(user_id) on delete cascade,
    bio text,
    phone text,
    school text,
    grade text,
    avatar_url text,
    date_of_birth text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Sessions (Session management)
create table if not exists user_sessions (
    session_id text primary key,
    user_id text not null references users(user_id) on delete cascade,
    token_hash text unique not null,
    role text not null,
    expires_at timestamp with time zone not null,
    revoked boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Courses, Materials, Videos, Manual Books
create table if not exists courses (
    course_id text primary key,
    slug text unique not null,
    title text not null,
    description text not null,
    "order" integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists materials (
    material_id text primary key,
    course_id text not null references courses(course_id) on delete cascade,
    title text not null,
    description text not null,
    content text not null,
    "order" integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists material_progress (
    progress_id text primary key,
    user_id text not null references users(user_id) on delete cascade,
    material_id text not null references materials(material_id) on delete cascade,
    course_id text not null references courses(course_id) on delete cascade,
    status text not null default 'not_started',
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, material_id)
);

create table if not exists videos (
    video_id text primary key,
    course_id text not null references courses(course_id) on delete cascade,
    title text not null,
    description text not null,
    url text not null,
    duration_seconds integer not null default 0,
    "order" integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists video_progress (
    progress_id text primary key,
    user_id text not null references users(user_id) on delete cascade,
    video_id text not null references videos(video_id) on delete cascade,
    course_id text not null references courses(course_id) on delete cascade,
    watched_seconds integer default 0 not null,
    status text not null default 'not_started',
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, video_id)
);

create table if not exists manual_books (
    book_id text primary key,
    course_id text not null references courses(course_id) on delete cascade,
    title text not null,
    description text not null,
    file_url text not null,
    pages integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tests, Questions, Answers, Results
create table if not exists tests (
    test_id text primary key,
    course_id text not null references courses(course_id) on delete cascade,
    test_type text not null, -- 'pre_test' or 'post_test'
    title text not null,
    description text not null,
    passing_score integer not null default 70,
    total_questions integer not null default 0,
    "order" integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(course_id, test_type)
);

create table if not exists questions (
    question_id text primary key,
    test_id text not null references tests(test_id) on delete cascade,
    course_id text not null references courses(course_id) on delete cascade,
    test_type text not null,
    "order" integer not null default 0,
    text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists answers (
    answer_id text primary key,
    question_id text not null references questions(question_id) on delete cascade,
    "order" integer not null default 0,
    text text not null,
    is_correct boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists test_attempts (
    attempt_id text primary key,
    user_id text not null references users(user_id) on delete cascade,
    test_id text not null references tests(test_id) on delete cascade,
    course_id text not null references courses(course_id) on delete cascade,
    test_type text not null,
    status text not null default 'in_progress',
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists test_results (
    result_id text primary key,
    attempt_id text not null references test_attempts(attempt_id) on delete cascade,
    user_id text not null references users(user_id) on delete cascade,
    test_id text not null references tests(test_id) on delete cascade,
    course_id text not null references courses(course_id) on delete cascade,
    test_type text not null,
    answers jsonb not null default '{}'::jsonb,
    score integer not null default 0,
    total integer not null default 0,
    percentage integer not null default 0,
    passed boolean not null default false,
    review jsonb not null default '[]'::jsonb,
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Discussions & Comments
create table if not exists discussions (
    discussion_id text primary key,
    course_id text not null references courses(course_id) on delete cascade,
    user_id text not null references users(user_id) on delete cascade,
    title text not null,
    body text not null,
    comment_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists comments (
    comment_id text primary key,
    discussion_id text not null references discussions(discussion_id) on delete cascade,
    user_id text not null references users(user_id) on delete cascade,
    parent_comment_id text,
    body text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Notifications
create table if not exists notifications (
    notification_id text primary key,
    user_id text not null references users(user_id) on delete cascade,
    type text not null,
    title text not null,
    body text not null,
    data jsonb default '{}'::jsonb,
    read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for high performance
create index if not exists idx_users_email on users(email);
create index if not exists idx_sessions_token on user_sessions(token_hash);
create index if not exists idx_materials_course on materials(course_id, "order");
create index if not exists idx_videos_course on videos(course_id, "order");
create index if not exists idx_questions_test on questions(test_id, "order");
create index if not exists idx_answers_question on answers(question_id, "order");
create index if not exists idx_discussions_course on discussions(course_id, created_at desc);
create index if not exists idx_comments_discussion on comments(discussion_id, created_at asc);
