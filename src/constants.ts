import { Question } from './types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    examTrack: 'general_nursing',
    domain: 'obstetrics',
    subdomain: 'Antepartum haemorrhage',
    cognitiveLevel: 'application',
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
    difficulty: 'medium',
    rationaleWrongOptions: [
      'Placental abruption is classically painful rather than painless.',
      'Uterine rupture is a more catastrophic event and not the most likely presentation here.',
      'Vasa previa is less likely than placenta previa in this vignette.',
    ],
    clinicalTakeaway: 'Late-pregnancy painless bleeding should make you think placenta previa until reviewed.',
    sourceIds: ['nmcn-general-exam-form', 'who-pcpnc-guide'],
  },
  {
    id: '2',
    examTrack: 'general_nursing',
    domain: 'medical_surgical',
    subdomain: 'Seizure first aid',
    cognitiveLevel: 'priority',
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
    difficulty: 'easy',
    rationaleWrongOptions: [
      'A tongue blade can injure the patient and should not be inserted.',
      'Restraint can cause harm during seizure activity.',
      'Oral diazepam is not the immediate first action during an active convulsion.',
    ],
    clinicalTakeaway: 'Seizure care starts with airway protection and injury prevention.',
    sourceIds: ['nmcn-general-exam-form'],
  },
  {
    id: '3',
    examTrack: 'general_nursing',
    domain: 'medical_surgical',
    subdomain: 'Diabetic ketoacidosis',
    cognitiveLevel: 'application',
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
    difficulty: 'hard',
    rationaleWrongOptions: [
      'Hypernatremia is not the most immediate insulin-related shift of concern in DKA.',
      'Hypercalcemia is not the classic critical electrolyte issue here.',
      'Hypomagnesemia can occur but is not the primary immediate risk during insulin initiation.',
    ],
    clinicalTakeaway: 'In DKA, potassium monitoring is as important as glucose correction.',
    sourceIds: ['nmcn-general-exam-form'],
  }
];
