import { Question } from '@/src/types';
import { anatomyPhysiologyQuestions } from '@/src/data/questionBank/anatomyPhysiology';
import { communityHealthQuestions } from '@/src/data/questionBank/communityHealth';
import { medicalSurgicalQuestions } from '@/src/data/questionBank/medicalSurgical';
import { microbiologyIpcQuestions } from '@/src/data/questionBank/microbiologyIpc';
import { nursingEthicsQuestions } from '@/src/data/questionBank/nursingEthics';
import { obstetricsQuestions } from '@/src/data/questionBank/obstetrics';
import { pediatricsQuestions } from '@/src/data/questionBank/pediatrics';
import { pharmacologyQuestions } from '@/src/data/questionBank/pharmacology';
import { psychiatryQuestions } from '@/src/data/questionBank/psychiatry';

export const QUESTION_BANK: Question[] = [
  ...medicalSurgicalQuestions,
  ...communityHealthQuestions,
  ...obstetricsQuestions,
  ...pediatricsQuestions,
  ...pharmacologyQuestions,
  ...nursingEthicsQuestions,
  ...psychiatryQuestions,
  ...anatomyPhysiologyQuestions,
  ...microbiologyIpcQuestions,
];
