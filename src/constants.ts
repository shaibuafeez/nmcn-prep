import { Question } from './types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'A 28-year-old pregnant woman at 34 weeks gestation presents with sudden onset of painless vaginal bleeding. What is the most likely diagnosis?',
    options: [
      'Abruptio Placentae',
      'Placenta Previa',
      'Uterine Rupture',
      'Vasa Previa'
    ],
    correctAnswer: 1,
    explanation: 'Placenta previa typically presents as painless, bright red vaginal bleeding in the third trimester. Abruptio placentae is usually painful.',
    topic: 'Obstetrics',
    difficulty: 'medium'
  },
  {
    id: '2',
    text: 'Which of the following is the primary nursing intervention for a patient experiencing a tonic-clonic seizure?',
    options: [
      'Insert a padded tongue blade',
      'Restrain the patient to prevent injury',
      'Turn the patient to the side',
      'Administer oral diazepam immediately'
    ],
    correctAnswer: 2,
    explanation: 'Turning the patient to the side helps maintain a patent airway and prevents aspiration. Never insert anything into the mouth or restrain a seizing patient.',
    topic: 'Med-Surg',
    difficulty: 'easy'
  },
  {
    id: '3',
    text: 'In the management of a patient with Diabetic Ketoacidosis (DKA), which electrolyte imbalance is of most concern during insulin therapy?',
    options: [
      'Hypernatremia',
      'Hypokalemia',
      'Hypercalcemia',
      'Hypomagnesemia'
    ],
    correctAnswer: 1,
    explanation: 'Insulin causes potassium to shift from the extracellular fluid into the cells, which can lead to severe hypokalemia. Potassium levels must be monitored closely.',
    topic: 'Med-Surg',
    difficulty: 'hard'
  }
];
