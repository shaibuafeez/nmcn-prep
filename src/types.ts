export type ExamTrack = 'general_nursing' | 'midwifery';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type CognitiveLevel = 'recall' | 'application' | 'priority';
export type QuestionDomain =
  | 'medical_surgical'
  | 'community_health'
  | 'obstetrics'
  | 'pediatrics'
  | 'pharmacology'
  | 'nursing_ethics'
  | 'psychiatry'
  | 'anatomy_physiology'
  | 'microbiology_ipc';

export interface Question {
  id: string;
  examTrack: ExamTrack;
  domain: QuestionDomain;
  subdomain: string;
  cognitiveLevel: CognitiveLevel;
  text: string;
  options: string[];
  correctAnswer: number; // index of options
  explanation: string;
  topic: string;
  difficulty: QuestionDifficulty;
  rationaleWrongOptions: string[];
  clinicalTakeaway: string;
  nigeriaNote?: string;
  sourceIds: string[];
  tags?: string[];
}

export interface QuestionSource {
  id: string;
  title: string;
  organization: string;
  url: string;
  lastReviewed: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  type: 'daily' | 'topic' | 'exam';
  timeLimit?: number; // in minutes
}

export interface QuizBlueprint {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  type: Quiz['type'];
  topic?: string;
  timeLimit?: number;
  isExamMode?: boolean;
  distribution?: Partial<Record<QuestionDomain, number>>;
}

export interface QuizSession {
  blueprintId: string;
  title: string;
  description: string;
  questions: Question[];
  isExamMode: boolean;
  timeLimit?: number;
}

export interface UserProgress {
  uid: string;
  completedQuizzes: {
    quizId: string;
    score: number;
    totalQuestions: number;
    completedAt: string;
  }[];
  dailyStreak: number;
  lastDailyCompleted: string | null;
  isPremium: boolean;
}
