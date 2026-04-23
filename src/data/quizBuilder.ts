import { Question, QuestionDomain, QuizBlueprint, QuizSession } from '@/src/types';
import { QUESTION_BANK } from '@/src/data/questionBank';
import {
  DAILY_CHALLENGE_BLUEPRINT,
  FULL_MOCK_EXAM_BLUEPRINT,
  TOPIC_QUIZ_BLUEPRINTS,
} from '@/src/data/quizBlueprints';

const shuffle = <T>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const takeQuestions = (questions: Question[], count: number) => shuffle(questions).slice(0, count);

const takeByDistribution = (distribution: Partial<Record<QuestionDomain, number>>) => {
  const selected = Object.entries(distribution).flatMap(([domain, count]) => {
    if (!count) {
      return [];
    }

    const domainQuestions = QUESTION_BANK.filter((question) => question.domain === domain);
    return takeQuestions(domainQuestions, count);
  });

  return shuffle(selected);
};

const buildSessionFromBlueprint = (blueprint: QuizBlueprint): QuizSession => {
  let questions: Question[] = [];

  if (blueprint.topic) {
    questions = takeQuestions(
      QUESTION_BANK.filter((question) => question.topic === blueprint.topic),
      blueprint.questionCount,
    );
  } else if (blueprint.distribution) {
    questions = takeByDistribution(blueprint.distribution);
  }

  return {
    blueprintId: blueprint.id,
    title: blueprint.title,
    description: blueprint.description,
    questions,
    isExamMode: blueprint.isExamMode ?? false,
    timeLimit: blueprint.timeLimit,
  };
};

export const buildDailyChallengeSession = () => buildSessionFromBlueprint(DAILY_CHALLENGE_BLUEPRINT);

export const buildFullMockExamSession = () => buildSessionFromBlueprint(FULL_MOCK_EXAM_BLUEPRINT);

export const buildTopicQuizSession = (topic: string) => {
  const blueprint = TOPIC_QUIZ_BLUEPRINTS.find((item) => item.topic === topic);
  return blueprint ? buildSessionFromBlueprint(blueprint) : null;
};

export const TOPIC_CATALOG = TOPIC_QUIZ_BLUEPRINTS.map((blueprint) => ({
  title: blueprint.topic ?? blueprint.title,
  quizTitle: blueprint.title,
  description: blueprint.description,
  questionCount: QUESTION_BANK.filter((question) => question.topic === blueprint.topic).length,
}));

export const QUESTION_BANK_STATS = {
  totalQuestions: QUESTION_BANK.length,
  topicCount: TOPIC_CATALOG.length,
};

export { DAILY_CHALLENGE_BLUEPRINT, FULL_MOCK_EXAM_BLUEPRINT };
