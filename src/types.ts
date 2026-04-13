export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of options
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  type: 'daily' | 'topic' | 'exam';
  timeLimit?: number; // in minutes
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
