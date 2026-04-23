import { Question } from '@/src/types';

type QuestionInput = Omit<Question, 'examTrack'>;

export const buildQuestion = (question: QuestionInput): Question => ({
  examTrack: 'general_nursing',
  ...question,
});

export const sourceSets = {
  curriculum: ['nmcn-general-exam-form'],
  community: ['nmcn-general-exam-form', 'nphcda-phc-course-catalog'],
  malaria: ['nmcn-general-exam-form', 'nphcda-phc-course-catalog', 'who-malaria-guidelines'],
  maternity: ['nmcn-general-exam-form', 'who-pcpnc-guide'],
  ethics: ['nmcn-general-exam-form', 'nmcn-code-of-conduct'],
  psychiatry: ['nmcn-general-exam-form', 'fmoh-public-health-policies'],
  ipc: ['nmcn-general-exam-form', 'who-hand-hygiene'],
};
