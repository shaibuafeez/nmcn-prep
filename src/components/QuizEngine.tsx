import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, Timer, AlertCircle, ChevronLeft, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { QUESTION_SOURCES } from '@/src/data/questionSources';
import { Question } from '@/src/types';

interface QuizEngineProps {
  questions: Question[];
  onComplete: (score: number) => void;
  onCancel: () => void;
  title: string;
  isExamMode?: boolean;
  timeLimitMinutes?: number;
}

export function QuizEngine({
  questions,
  onComplete,
  onCancel,
  title,
  isExamMode = false,
  timeLimitMinutes = 180,
}: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isAnswered, setIsAnswered] = React.useState(false);
  const [submittedAnswers, setSubmittedAnswers] = React.useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = React.useState(isExamMode ? timeLimitMinutes * 60 : 0);
  const [showResults, setShowResults] = React.useState(false);
  const [isReviewMode, setIsReviewMode] = React.useState(false);
  const [reviewIndex, setReviewIndex] = React.useState(0);

  const currentQuestion = isReviewMode ? questions[reviewIndex] : questions[currentIndex];

  const score = React.useMemo(
    () =>
      questions.reduce((total, question) => {
        return total + (submittedAnswers[question.id] === question.correctAnswer ? 1 : 0);
      }, 0),
    [questions, submittedAnswers],
  );

  const topicPerformance = React.useMemo(() => {
    const topicMap = new Map<string, { correct: number; total: number }>();

    questions.forEach((question) => {
      const current = topicMap.get(question.topic) ?? { correct: 0, total: 0 };
      const wasCorrect = submittedAnswers[question.id] === question.correctAnswer;

      topicMap.set(question.topic, {
        correct: current.correct + (wasCorrect ? 1 : 0),
        total: current.total + 1,
      });
    });

    return [...topicMap.entries()]
      .map(([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((left, right) => right.accuracy - left.accuracy);
  }, [questions, submittedAnswers]);

  const strongestTopic = topicPerformance[0];
  const weakestTopics = [...topicPerformance].reverse().slice(0, 2);

  React.useEffect(() => {
    if (!isExamMode || showResults || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamMode, showResults, timeLeft]);

  React.useEffect(() => {
    if (isExamMode && timeLeft === 0 && !showResults) {
      setShowResults(true);
    }
  }, [isExamMode, timeLeft, showResults]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered && !isExamMode) {
      return;
    }

    setSelectedOption(index);
    setSubmittedAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: index,
    }));

    if (!isExamMode) {
      setIsAnswered(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setSubmittedAnswers({});
    setTimeLeft(isExamMode ? timeLimitMinutes * 60 : 0);
    setShowResults(false);
    setIsReviewMode(false);
    setReviewIndex(0);
  };

  const reviewSelection = submittedAnswers[currentQuestion.id] ?? null;
  const currentSources = currentQuestion.sourceIds
    .map((sourceId) => QUESTION_SOURCES[sourceId])
    .filter(Boolean);

  const Confetti = () => (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {[...Array(20)].map((_, index) => (
        <motion.div
          key={index}
          initial={{
            top: -20,
            left: `${Math.random() * 100}%`,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            top: '120%',
            rotate: 360,
            left: `${Math.random() * 100}%`,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 2,
          }}
          className={`absolute h-4 w-4 rounded-sm ${
            ['bg-primary', 'bg-amber-400', 'bg-emerald-400', 'bg-indigo-400'][
              Math.floor(Math.random() * 4)
            ]
          }`}
        />
      ))}
    </div>
  );

  if (showResults && !isReviewMode) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-6 backdrop-blur-xl">
        <Confetti />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="mx-auto w-full max-w-2xl"
        >
          <Card className="glass overflow-hidden border-none shadow-2xl">
            <div className="h-2 bg-primary" />
            <CardHeader className="pt-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
              >
                <Trophy size={48} />
              </motion.div>
              <CardTitle className="font-heading text-4xl font-black">Quiz Completed!</CardTitle>
              <CardDescription className="text-lg">
                Source-backed review for {title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 px-10 pb-10 text-center">
              <div className="flex justify-center gap-12">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Final Score
                  </p>
                  <p className="text-5xl font-black tracking-tighter text-primary">
                    {score}/{questions.length}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Accuracy
                  </p>
                  <p className="text-5xl font-black tracking-tighter text-emerald-600">
                    {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-secondary/50 p-8 text-left">
                <div className="mb-3 flex items-center gap-3">
                  <AlertCircle size={20} className="text-primary" />
                  <h4 className="font-bold text-foreground">Performance Insights</h4>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {strongestTopic ? (
                    <>
                      Strongest area: <strong>{strongestTopic.topic}</strong> at{' '}
                      <strong>{strongestTopic.accuracy}%</strong> accuracy.
                    </>
                  ) : (
                    'Your result is ready for review.'
                  )}
                </p>
                {weakestTopics.length > 0 && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Next focus:
                    {' '}
                    {weakestTopics.map((topic) => `${topic.topic} (${topic.accuracy}%)`).join(' and ')}.
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-primary/10 bg-primary/5 p-6 text-left">
                <p className="text-xs font-black uppercase tracking-widest text-primary">
                  Built From
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Original questions with rationales and source tags aligned to the NMCN training domains.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-16 rounded-2xl border-2 font-bold"
                    onClick={handleRetake}
                  >
                    Retake Quiz
                  </Button>
                  <Button
                    className="h-16 rounded-2xl bg-primary text-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90"
                    onClick={() => onComplete(score)}
                  >
                    Continue
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="h-14 w-full rounded-2xl font-bold"
                  onClick={() => setIsReviewMode(true)}
                >
                  Review Detailed Answers
                </Button>
                <Button variant="link" className="font-bold text-muted-foreground" onClick={onCancel}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-background">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <header className="flex h-20 items-center justify-between px-6 md:px-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={isReviewMode ? () => setIsReviewMode(false) : onCancel}
          className="rounded-full font-bold text-muted-foreground"
        >
          <ChevronLeft size={20} className="mr-1" />
          {isReviewMode ? 'Back to Results' : 'Quit'}
        </Button>

        <div className="flex items-center gap-4">
          {isReviewMode ? (
            <Badge
              variant="outline"
              className="rounded-full border-2 border-primary/20 px-4 py-1.5 font-black uppercase tracking-widest text-primary"
            >
              Review Mode
            </Badge>
          ) : (
            isExamMode && (
              <div
                className={`flex items-center gap-2 rounded-full px-5 py-2 font-mono text-sm font-black shadow-sm ${
                  timeLeft < 300
                    ? 'animate-pulse bg-destructive text-destructive-foreground'
                    : 'bg-secondary text-foreground'
                }`}
              >
                <Timer size={18} />
                {formatTime(timeLeft)}
              </div>
            )
          )}
          <Badge className="rounded-full bg-primary/10 px-4 py-1.5 font-bold text-primary hover:bg-primary/10">
            {(isReviewMode ? reviewIndex : currentIndex) + 1} / {questions.length}
          </Badge>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 md:py-12">
        {!isReviewMode && (
          <div className="mb-10 space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <Progress
              value={((currentIndex + 1) / questions.length) * 100}
              className="h-2.5 rounded-full bg-secondary"
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={isReviewMode ? reviewIndex : currentIndex}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-10"
          >
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-primary px-4 py-1 font-bold">
                  {currentQuestion.topic}
                </Badge>
                <Badge variant="outline" className="rounded-full border-2 px-4 py-1 font-bold capitalize">
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline" className="rounded-full border-2 px-4 py-1 font-bold">
                  {currentQuestion.cognitiveLevel}
                </Badge>
              </div>
              <h3 className="font-heading text-3xl font-black leading-tight text-foreground md:text-5xl">
                {currentQuestion.text}
              </h3>
            </div>

            <div className="grid gap-4">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = index === currentQuestion.correctAnswer;
                const isSelected = index === (isReviewMode ? reviewSelection : selectedOption);

                let state = 'idle';
                if (isReviewMode) {
                  if (isCorrect) state = 'correct';
                  else if (isSelected) state = 'incorrect';
                } else if (isAnswered && !isExamMode) {
                  if (isCorrect) state = 'correct';
                  else if (isSelected) state = 'incorrect';
                  else state = 'dimmed';
                } else if (isSelected) {
                  state = 'selected';
                }

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: state === 'idle' && !isReviewMode ? 1.01 : 1 }}
                    whileTap={{ scale: state === 'idle' && !isReviewMode ? 0.98 : 1 }}
                    onClick={() => !isReviewMode && handleOptionSelect(index)}
                    disabled={(isAnswered && !isExamMode) || isReviewMode}
                    className={`group relative flex w-full items-center justify-between rounded-3xl border-2 p-6 text-left transition-all duration-300 md:p-8 ${
                      state === 'correct'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 shadow-lg shadow-emerald-500/20'
                        : state === 'incorrect'
                          ? 'border-destructive bg-destructive/10 text-destructive shadow-lg shadow-destructive/20'
                          : state === 'selected'
                            ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10'
                            : state === 'dimmed'
                              ? 'border-border opacity-40 grayscale'
                              : 'border-border bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black transition-all duration-300 ${
                          state === 'correct'
                            ? 'bg-emerald-500 text-white'
                            : state === 'incorrect'
                              ? 'bg-destructive text-white'
                              : state === 'selected'
                                ? 'bg-primary text-white'
                                : 'bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg font-bold leading-snug md:text-xl">{option}</span>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center">
                      {state === 'correct' && <Check size={28} className="text-emerald-500" />}
                      {state === 'incorrect' && <X size={28} className="text-destructive" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence>
              {(isReviewMode || (isAnswered && !isExamMode)) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-4xl border-2 border-primary/10 bg-primary/5 p-8 md:p-10"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      <AlertCircle size={24} />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-heading text-2xl font-bold text-foreground">
                        Expert Explanation
                      </h5>
                      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                        {currentQuestion.explanation}
                      </p>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                            Clinical Takeaway
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {currentQuestion.clinicalTakeaway}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                          <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                            Why The Others Are Wrong
                          </p>
                          <div className="mt-2 space-y-2">
                            {currentQuestion.rationaleWrongOptions.map((rationale) => (
                              <p key={rationale} className="text-sm text-muted-foreground">
                                {rationale}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {currentQuestion.nigeriaNote && (
                        <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">
                            Nigeria Note
                          </p>
                          <p className="mt-2 text-sm text-emerald-900/80">
                            {currentQuestion.nigeriaNote}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                          Source Tags
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {currentSources.map((source) => (
                            <Badge key={source.id} variant="secondary" className="rounded-full px-3 py-1">
                              {source.organization}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {isReviewMode ? (
                        <div className="mt-8 flex gap-4">
                          <Button
                            variant="outline"
                            className="h-14 rounded-full border-2 px-8 font-bold"
                            disabled={reviewIndex === 0}
                            onClick={() => setReviewIndex((previous) => previous - 1)}
                          >
                            Previous
                          </Button>
                          <Button
                            className="h-14 rounded-full bg-primary px-10 text-lg font-bold shadow-xl shadow-primary/20"
                            onClick={
                              reviewIndex === questions.length - 1
                                ? () => setIsReviewMode(false)
                                : () => setReviewIndex((previous) => previous + 1)
                            }
                          >
                            {reviewIndex === questions.length - 1 ? 'Finish Review' : 'Next Question'}
                            <ArrowRight size={20} className="ml-2" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="mt-8 h-14 rounded-full bg-primary px-10 text-lg font-bold shadow-xl shadow-primary/20"
                          onClick={handleNext}
                        >
                          {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                          <ArrowRight size={20} className="ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isExamMode && (
              <div className="flex justify-end pt-6">
                <Button
                  className="h-16 rounded-full bg-primary px-12 text-xl font-bold shadow-2xl shadow-primary/30"
                  disabled={selectedOption === null}
                  onClick={currentIndex === questions.length - 1 ? () => setShowResults(true) : handleNext}
                >
                  {currentIndex === questions.length - 1 ? 'Submit Exam' : 'Next Question'}
                  <ArrowRight size={24} className="ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
