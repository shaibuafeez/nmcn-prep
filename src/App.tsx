import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  User, 
  Settings, 
  GraduationCap,
  Clock,
  Zap,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Upload,
  CheckCircle2,
  Search,
  Menu,
  X,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuizEngine } from '@/src/components/QuizEngine';
import { MOCK_QUESTIONS } from '@/src/constants';
import { auth, db, signInWithGoogle, isConfigured, handleFirestoreError, OperationType } from '@/src/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, updateDoc, increment, query, orderBy, limit } from 'firebase/firestore';

declare global {
  interface Window {
    PaystackPop: {
      setup(options: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        onSuccess: (transaction: { reference: string }) => void;
        onCancel: () => void;
      }): { openIframe: () => void };
    };
  }
}

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [isAuthReady, setIsAuthReady] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [activeQuiz, setActiveQuiz] = React.useState<{ questions: typeof MOCK_QUESTIONS, title: string, isExam?: boolean } | null>(null);
  const [isPremium, setIsPremium] = React.useState(false);
  const [userStats, setUserStats] = React.useState<any>(null);
  const [leaderboardUsers, setLeaderboardUsers] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab === 'leaderboard') {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('points', 'desc'), limit(10));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeaderboardUsers(users);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      
      return () => unsubscribe();
    }
  }, [activeTab]);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Fetch or create user profile in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              isPremium: false,
              points: 0,
              dailyStreak: 0,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, newProfile);
            setUserStats(newProfile);
          } else {
            setUserStats(userSnap.data());
            setIsPremium(userSnap.data().isPremium || false);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }

        // Real-time listener for user stats
        const unsubStats = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserStats(data);
            setIsPremium(data.isPremium || false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });

        return () => unsubStats();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const startQuiz = (title: string, isExam = false) => {
    setActiveQuiz({
      questions: MOCK_QUESTIONS, // In a real app, we'd filter or fetch questions
      title,
      isExam
    });
  };

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <QuizEngine 
          questions={activeQuiz.questions}
          title={activeQuiz.title}
          isExamMode={activeQuiz.isExam}
          onComplete={async (score) => {
            console.log('Quiz completed with score:', score);
            if (user) {
              const historyRef = collection(db, 'users', user.uid, 'history');
              try {
                await addDoc(historyRef, {
                  quizId: activeQuiz.title,
                  score,
                  total: activeQuiz.questions.length,
                  completedAt: new Date().toISOString()
                });
                
                // Update points
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                  points: increment(score * 10)
                });
              } catch (error) {
                handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/history`);
              }
            }
            setActiveQuiz(null);
          }}
          onCancel={() => setActiveQuiz(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/10">
      {/* Desktop Sidebar */}
      <nav className="hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:w-80 md:flex-col md:border-r md:bg-card/50 md:px-6 md:py-10 md:backdrop-blur-2xl">
        <div className="flex items-center gap-4 px-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 overflow-hidden group transition-transform hover:scale-105">
            <img src="https://picsum.photos/seed/succinate/400/400" alt="Succinate World" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-card bg-emerald-500 shadow-sm" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-tight text-foreground uppercase leading-none">NMCN</h1>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Prep Master</p>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-1.5">
          <NavItem 
            icon={<LayoutDashboard size={22} strokeWidth={2.5} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<BookOpen size={22} strokeWidth={2.5} />} 
            label="Quizzes" 
            active={activeTab === 'quizzes'} 
            onClick={() => setActiveTab('quizzes')} 
          />
          <NavItem 
            icon={<Clock size={22} strokeWidth={2.5} />} 
            label="Exam Mode" 
            active={activeTab === 'exam'} 
            onClick={() => setActiveTab('exam')} 
          />
          <NavItem 
            icon={<Trophy size={22} strokeWidth={2.5} />} 
            label="Leaderboard" 
            active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')} 
          />
          <NavItem 
            icon={<User size={22} strokeWidth={2.5} />} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
          />
          <NavItem 
            icon={<Crown size={22} strokeWidth={2.5} />}
            label="Premium" 
            active={activeTab === 'premium'} 
            onClick={() => setActiveTab('premium')} 
          />
        </div>

        <div className="mt-auto">
          <Card className="overflow-hidden border-none bg-secondary/50 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Study Goal</span>
              <span className="text-xs font-bold text-primary">75%</span>
            </div>
            <Progress value={75} className="h-2 rounded-full bg-background" />
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              You're <span className="font-bold text-foreground">250 points</span> away from the Weekly Top 10.
            </p>
          </Card>
        </div>
      </nav>

      {/* Mobile Navigation - Modern Integrated Dock */}
      <nav className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-[32px] border border-white/20 bg-black/90 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl md:hidden">
        <MobileNavItem 
          icon={<LayoutDashboard size={20} />} 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
        />
        <MobileNavItem 
          icon={<BookOpen size={20} />} 
          active={activeTab === 'quizzes'} 
          onClick={() => setActiveTab('quizzes')} 
        />
        <MobileNavItem 
          icon={<Clock size={20} />} 
          active={activeTab === 'exam'} 
          onClick={() => setActiveTab('exam')} 
        />
        <MobileNavItem 
          icon={<Trophy size={20} />} 
          active={activeTab === 'leaderboard'} 
          onClick={() => setActiveTab('leaderboard')} 
        />
        <MobileNavItem 
          icon={<User size={20} />} 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')} 
        />
      </nav>

      {/* Main Content Area */}
      <main className="relative min-h-screen md:pl-80 overflow-hidden">
        {/* Ambient Background Blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
          <div className="absolute top-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
          <div className="absolute bottom-[10%] left-[10%] h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
        </div>

        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-background/40 px-6 backdrop-blur-2xl md:px-8">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div>
            <h2 className="font-heading text-2xl font-black capitalize tracking-tight text-foreground">{activeTab}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5">
                <Clock size={10} className="text-primary" />
                <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {isPremium && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1">
                  <Zap size={12} className="text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pro</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end md:flex">
              <p className="text-xs font-black text-foreground">{user?.displayName || 'Candidate'}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{isPremium ? 'Premium Pro' : 'Free Tier'}</p>
            </div>
            <div className="h-10 w-10 rounded-xl border-2 border-primary/20 p-0.5 transition-transform hover:scale-105 cursor-pointer" onClick={() => setActiveTab('profile')}>
              <img src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} alt="Avatar" className="h-full w-full rounded-lg object-cover" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-5 pb-32 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'dashboard' && <DashboardView userStats={userStats} onStartDaily={() => startQuiz('Daily Challenge')} />}
            {activeTab === 'quizzes' && <QuizzesView onStartTopic={(topic) => startQuiz(`${topic} Quiz`)} />}
            {activeTab === 'exam' && <ExamModeView onStartExam={() => startQuiz('Full Mock Exam', true)} isPremium={isPremium} />}
            {activeTab === 'leaderboard' && <LeaderboardView users={leaderboardUsers} currentUser={user} />}
            {activeTab === 'profile' && <ProfileView user={user} userStats={userStats} isPremium={isPremium} setIsPremium={setIsPremium} onLogout={handleLogout} setActiveTab={setActiveTab} />}
            {activeTab === 'premium' && <PremiumView isPremium={isPremium} setActiveTab={setActiveTab} user={user} />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-500 ${
        active 
          ? 'bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(var(--primary),0.3)]' 
          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="sidebar-glow"
          className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
          initial={false}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <motion.div 
        className="relative z-10"
        animate={{ scale: active ? 1.1 : 1, rotate: active ? [0, -10, 10, 0] : 0 }}
      >
        {icon}
      </motion.div>
      <span className="relative z-10 text-sm font-black tracking-tight">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute right-4 h-5 w-1 rounded-full bg-primary-foreground/40"
          initial={false}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex h-16 w-16 items-center justify-center"
    >
      {active && (
        <motion.div 
          layoutId="mobile-active-bg"
          className="absolute inset-0 rounded-full bg-primary shadow-[0_10px_30px_rgba(var(--primary),0.4)]"
          initial={false}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        />
      )}
      <motion.div 
        className={`relative z-10 transition-colors duration-300 ${active ? 'text-primary-foreground' : 'text-white/40'}`}
        animate={{ 
          scale: active ? 1.2 : 1,
          y: active ? -4 : 0
        }}
      >
        {icon}
      </motion.div>
      {active && (
        <motion.div 
          layoutId="mobile-indicator"
          className="absolute -bottom-1 h-1 w-4 rounded-full bg-primary-foreground"
          initial={false}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function DashboardView({ userStats, onStartDaily }: { userStats: any, onStartDaily: () => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* Hero Bento Card */}
      <Card className="relative overflow-hidden border-none bg-primary p-6 md:p-8 text-primary-foreground shadow-xl shadow-primary/30 lg:col-span-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-[60px]" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="space-y-2">
            <Badge className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              Daily Challenge
            </Badge>
            <h3 className="font-heading text-2xl font-black leading-tight tracking-tight md:text-4xl">
              Ready for your <br />
              morning pulse?
            </h3>
            <p className="max-w-md text-sm font-medium opacity-80">
              15 high-yield questions curated by AI to strengthen your weak areas.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-card px-8 text-base font-black text-primary shadow-lg transition-all hover:scale-105 hover:bg-card/90 active:scale-95"
              onClick={onStartDaily}
            >
              Start Now
            </Button>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full border-2 border-primary bg-secondary/20 backdrop-blur-md" />
              ))}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-white/10 text-[9px] font-black backdrop-blur-md">
                +2k
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Bento Card */}
      <Card className="flex flex-col border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 lg:col-span-4">
        <div className="flex-1 space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Streak</p>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-black tracking-tighter text-orange-500">{userStats?.dailyStreak || 0} Days</p>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Zap size={18} className="fill-orange-500 text-orange-500" />
                </motion.div>
              </div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Clock size={18} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Points</p>
              <p className="text-2xl font-black tracking-tighter text-primary">{userStats?.points?.toLocaleString() || 0}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Trophy size={18} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>Overall Mastery</span>
              <span className="text-primary">24.8%</span>
            </div>
            <Progress value={24.8} className="h-2 rounded-full bg-secondary" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-black tracking-tighter text-emerald-600">78%</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg. Time</p>
              <p className="text-2xl font-black tracking-tighter text-primary">45s</p>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/30 p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={14} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Rank #450</span>
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">
              You're in the <span className="font-bold text-foreground">Top 15%</span> of Lagos candidates.
            </p>
          </div>
        </div>
      </Card>

      {/* Topic Mastery Bento */}
      <Card className="border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 lg:col-span-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-black tracking-tight">Topic Mastery</h3>
          <Button variant="ghost" size="sm" className="font-black text-primary text-xs">View All</Button>
        </div>
        <div className="space-y-4">
          <TopicProgress label="Obstetrics" value={85} color="bg-pink-500" />
          <TopicProgress label="Medical-Surgical" value={62} color="bg-blue-500" />
          <TopicProgress label="Pediatrics" value={45} color="bg-orange-500" />
          <TopicProgress label="Pharmacology" value={30} color="bg-purple-500" />
        </div>
      </Card>

      {/* Study Plan Bento */}
      <Card className="border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 lg:col-span-7">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-black tracking-tight">Personalized Plan</h3>
          <Badge variant="outline" className="rounded-full border-2 px-3 py-0.5 font-black uppercase tracking-widest text-[9px]">AI Generated</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <motion.div
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-2xl border-2 border-primary/10 bg-primary/5 p-5 transition-all hover:border-primary/30"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Zap size={18} />
            </div>
            <h4 className="text-base font-black tracking-tight">Finish Daily MCQ</h4>
            <p className="mt-1 text-xs font-medium text-muted-foreground opacity-80">Earn 50 points & maintain streak</p>
            <Button className="mt-4 w-full h-10 rounded-xl bg-primary text-sm font-black shadow-md" onClick={onStartDaily}>Start</Button>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-2xl border-2 border-border bg-secondary/20 p-5 transition-all hover:border-primary/20"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <BookOpen size={18} />
            </div>
            <h4 className="text-base font-black tracking-tight">Review Med-Surg</h4>
            <p className="mt-1 text-xs font-medium text-muted-foreground opacity-80">Your weakest topic this week</p>
            <Button variant="outline" className="mt-4 w-full h-10 rounded-xl border-2 text-sm font-black">Review</Button>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}

function TopicProgress({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground/60">{value}%</span>
      </div>
      <Progress value={value} className="h-1.5 bg-secondary/30" indicatorClassName={color} />
    </div>
  );
}

function QuizItem({ title, questions, time, difficulty }: { title: string, questions: number, time: string, difficulty: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 p-4 transition-colors hover:bg-secondary/20">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookOpen size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{questions} Questions • {time} • {difficulty}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon">
        <ChevronRight size={20} className="text-muted-foreground/40" />
      </Button>
    </div>
  );
}

function ActivityItem({ title, time, score }: { title: string, time: string, score: string }) {
  return (
    <div className="flex items-center justify-between border-l-2 border-primary/30 pl-4 py-1">
      <div>
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{score}</Badge>
    </div>
  );
}

function QuizzesView({ onStartTopic }: { onStartTopic: (topic: string) => void }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const topics = [
    { name: 'Obstetrics', color: 'bg-pink-500', icon: <BookOpen size={20} /> },
    { name: 'Medical-Surgical', color: 'bg-blue-500', icon: <Zap size={20} /> },
    { name: 'Pediatrics', color: 'bg-orange-500', icon: <User size={20} /> },
    { name: 'Psychiatry', color: 'bg-purple-500', icon: <Settings size={20} /> },
    { name: 'Community Health', color: 'bg-emerald-500', icon: <GraduationCap size={20} /> },
    { name: 'Pharmacology', color: 'bg-indigo-500', icon: <Zap size={20} /> },
    { name: 'Nursing Ethics', color: 'bg-slate-500', icon: <BookOpen size={20} /> },
    { name: 'Anatomy', color: 'bg-red-500', icon: <Settings size={20} /> }
  ];

  const filteredTopics = topics.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div>
            <h3 className="font-heading text-2xl md:text-3xl font-black tracking-tight text-foreground">Topic Quizzes</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground">Master every subject in the NMCN curriculum</p>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search topics..."
              className="h-10 rounded-xl border-2 border-border bg-card pl-10 pr-4 text-sm font-bold transition-all focus:border-primary focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-10 rounded-xl border-2 font-black uppercase tracking-widest text-[9px]">Filter</Button>
          <Button variant="outline" className="h-10 rounded-xl border-2 font-black uppercase tracking-widest text-[9px]">Sort</Button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filteredTopics.map((topic) => (
          <motion.div
            key={topic.name}
            whileHover={{ y: -4 }}
            className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-lg shadow-slate-200/30 transition-all border border-transparent hover:border-primary/10"
          >
            <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full opacity-10 blur-2xl ${topic.color}`} />

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground">
              {topic.icon}
            </div>

            <div className="space-y-1">
              <h4 className="font-heading text-lg font-black tracking-tight">{topic.name}</h4>
              <p className="text-xs font-medium text-muted-foreground opacity-80">150+ Questions available</p>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-muted-foreground">Mastery</span>
                <span className="text-primary">65%</span>
              </div>
              <Progress value={65} className="h-1.5 rounded-full bg-secondary" />
              <Button
                className="h-10 w-full rounded-xl bg-foreground text-sm font-black text-background transition-all hover:bg-primary hover:text-primary-foreground"
                onClick={() => onStartTopic(topic.name)}
              >
                Browse Quizzes
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ExamModeView({ onStartExam, isPremium }: { onStartExam: () => void, isPremium: boolean }) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 45, hours: 12, minutes: 30 });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Exam Countdown */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-2 text-center md:text-left">
            <Badge className="bg-primary/20 text-primary border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Next NMCN Exam</Badge>
            <h3 className="font-heading text-xl md:text-2xl font-black tracking-tight">May 2026 Professional Exam</h3>
            <p className="text-sm font-medium text-white/40">Stay consistent. Preparation is key.</p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Days', value: timeLeft.days },
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Mins', value: timeLeft.minutes }
            ].map((unit) => (
              <div key={unit.label} className="flex flex-col items-center gap-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-xl font-black border border-white/10">
                  {unit.value}
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-lg"
        >
          <Clock size={28} strokeWidth={2.5} />
        </motion.div>
        <h3 className="font-heading text-2xl md:text-3xl font-black tracking-tight text-foreground">Exam Simulation</h3>
        <p className="mx-auto max-w-xl text-sm font-medium leading-relaxed text-muted-foreground">
          Experience the real NMCN exam environment. 200 questions, 3 hours, no instant feedback.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="group relative overflow-hidden rounded-2xl border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.01]">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <CardHeader className="p-0">
            <Badge className="mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">Standard Mock</Badge>
            <CardTitle className="font-heading text-xl md:text-2xl font-black tracking-tight">Mock Exam 1</CardTitle>
            <CardDescription className="text-sm font-medium mt-1">200 Questions • 180 Minutes</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-5">
            <ul className="mb-5 space-y-2 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Full curriculum coverage
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Timed environment
              </li>
            </ul>
            <Button
              className="h-12 w-full rounded-xl bg-primary text-sm font-black shadow-lg shadow-primary/20"
              onClick={onStartExam}
            >
              Start Exam
            </Button>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl border-none bg-slate-900 p-6 md:p-8 text-white shadow-xl shadow-slate-900/40 transition-all hover:scale-[1.01]">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute right-5 top-5 rounded-full bg-amber-500 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-black">Premium</div>
          <CardHeader className="p-0">
            <Badge className="mb-3 w-fit rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-500">Advanced Mock</Badge>
            <CardTitle className="font-heading text-xl md:text-2xl font-black tracking-tight">Predictive 2026</CardTitle>
            <CardDescription className="text-sm font-medium mt-1 text-white/60">AI-Generated Questions</CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-5">
            <ul className="mb-5 space-y-2 text-sm font-medium text-white/60">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Based on 2026 trends
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                AI-powered weak area focus
              </li>
            </ul>
            <Button
              className="h-12 w-full rounded-xl bg-amber-500 text-sm font-black text-black shadow-lg shadow-amber-500/20"
              onClick={isPremium ? onStartExam : () => {}}
              disabled={!isPremium}
            >
              {isPremium ? 'Start Exam' : 'Unlock with Premium'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Previous Exams Section */}
      {isPremium && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-black tracking-tight text-foreground">Previous Attempts</h3>
            <Button variant="ghost" size="sm" className="font-black text-primary text-xs">View History</Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { date: 'Apr 10, 2026', score: '165/200', status: 'Pass', color: 'text-emerald-500' },
              { date: 'Apr 05, 2026', score: '142/200', status: 'Pass', color: 'text-emerald-500' },
              { date: 'Mar 28, 2026', score: '118/200', status: 'Fail', color: 'text-destructive' }
            ].map((attempt, i) => (
              <Card key={i} className="border-none bg-card p-5 shadow-md rounded-xl transition-all hover:scale-[1.02]">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{attempt.date}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-black tracking-tight">{attempt.score}</p>
                    <p className={`text-xs font-bold uppercase tracking-widest ${attempt.color}`}>{attempt.status}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="rounded-lg text-xs font-bold">Review</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardView({ users, currentUser }: { users: any[], currentUser: any }) {
  const topThree = [
    users[1] || { rank: 2, displayName: 'Waiting...', points: 0, avatar: 'https://picsum.photos/seed/user2/100/100' },
    users[0] || { rank: 1, displayName: 'Waiting...', points: 0, avatar: 'https://picsum.photos/seed/user1/100/100' },
    users[2] || { rank: 3, displayName: 'Waiting...', points: 0, avatar: 'https://picsum.photos/seed/user3/100/100' }
  ].map((u, i) => ({ ...u, rank: i === 1 ? 1 : i === 0 ? 2 : 3 }));

  const otherUsers = users.slice(3);
  const currentUserRank = users.findIndex(u => u.uid === currentUser?.uid) + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-heading text-2xl md:text-3xl font-black tracking-tight text-foreground">National Leaderboard</h3>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Top candidates across Nigeria this week</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-2">
          <Trophy className="text-primary" size={18} />
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">Your Rank</p>
            <p className="text-sm font-black text-primary">
              #{currentUserRank > 0 ? currentUserRank : '---'}
              <span className="text-[10px] font-medium opacity-60"> / {users.length}+</span>
            </p>
          </div>
        </div>
      </div>

      {/* Podium Layout */}
      <div className="grid gap-4 md:grid-cols-3 md:items-end">
        {topThree.map((user, idx) => (
          <motion.div
            key={user.uid || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: user.rank === 1 ? 0.2 : user.rank === 2 ? 0.1 : 0.3 }}
            className="relative"
          >
            <Card className={`relative overflow-hidden border-none p-5 text-center transition-all hover:scale-[1.01] rounded-2xl ${
              user.rank === 1
                ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 md:h-[280px] z-10'
                : 'bg-card shadow-lg shadow-slate-200/40 md:h-[240px]'
            }`}>
              {user.rank === 1 && (
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
                <div className="relative">
                  <div className={`h-16 w-16 rounded-full border-3 p-0.5 ${user.rank === 1 ? 'border-white/40' : 'border-primary/20'}`}>
                    <img src={user.photoURL || `https://picsum.photos/seed/user${user.rank}/100/100`} alt={user.displayName} className="h-full w-full rounded-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-black shadow-md ${
                    user.rank === 1 ? 'bg-amber-400 text-black' :
                    user.rank === 2 ? 'bg-slate-300 text-slate-800' : 'bg-orange-400 text-white'
                  }`}>
                    #{user.rank}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-heading text-base font-black tracking-tight truncate w-full max-w-[180px]">{user.displayName || 'Anonymous'}</h4>
                  <p className={`text-[10px] font-medium ${user.rank === 1 ? 'text-white/60' : 'text-muted-foreground'}`}>{user.school || 'Nursing School'}</p>
                </div>

                <div className={`rounded-xl px-4 py-1.5 text-sm font-black ${user.rank === 1 ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                  {(user.points || 0).toLocaleString()} PTS
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="overflow-hidden border-none bg-card shadow-lg shadow-slate-200/40 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rank</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">School</th>
                <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {otherUsers.map((user, idx) => {
                const rank = idx + 4;
                return (
                  <tr key={user.uid || idx} className="group transition-colors hover:bg-secondary/20">
                    <td className="px-5 py-3 text-sm font-black text-muted-foreground">#{rank}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary border border-border/50 overflow-hidden">
                          <img src={user.photoURL || `https://picsum.photos/seed/user${rank}/40/40`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-sm font-bold text-foreground">{user.displayName || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-muted-foreground">{user.school || 'Nursing School'}</td>
                    <td className="px-5 py-3 text-right text-sm font-black text-primary">{(user.points || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ProfileView({ user, userStats, isPremium, setIsPremium, onLogout, setActiveTab }: { user: any, userStats: any, isPremium: boolean, setIsPremium: (val: boolean) => void, onLogout: () => void, setActiveTab: (tab: string) => void }) {
  // Restrict Admin access to the owner's email
  const isAdmin = user?.email === 'afeezedeifoshaibu@gmail.com';

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-border/50">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-5 md:flex-row md:items-start">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl border-3 border-primary/20 p-0.5">
              <img src={user?.photoURL || "https://picsum.photos/seed/user/200/200"} alt="Profile" className="h-full w-full rounded-[14px] object-cover" />
            </div>
            {isPremium && (
              <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black shadow-md">
                <Zap size={14} className="fill-black" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-heading text-xl md:text-2xl font-black tracking-tight">{user?.displayName || 'Prep Master Candidate'}</h3>
            <p className="text-sm font-medium text-muted-foreground">{user?.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-black uppercase tracking-widest text-[9px]">Lagos, Nigeria</Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1 font-black uppercase tracking-widest text-[9px]">LUTH Nursing School</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="h-10 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary">Edit Profile</Button>
            <Button variant="ghost" className="h-10 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 hover:text-red-600" onClick={onLogout}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 rounded-2xl">
          <h4 className="font-heading mb-4 text-lg font-black tracking-tight">Study Statistics</h4>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span className="text-sm font-bold text-muted-foreground">Total Points</span>
              <span className="text-sm font-black text-foreground">{userStats?.points?.toLocaleString() || 0}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span className="text-sm font-bold text-muted-foreground">Daily Streak</span>
              <span className="text-sm font-black text-foreground">{userStats?.dailyStreak || 0} Days</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-3">
              <span className="text-sm font-bold text-muted-foreground">Avg. Score</span>
              <span className="text-sm font-black text-emerald-600">82%</span>
            </div>
          </div>
        </Card>

        <Card className="border-none bg-slate-900 p-6 md:p-8 text-white shadow-xl shadow-slate-900/40 rounded-2xl">
          <h4 className="font-heading mb-4 text-lg font-black tracking-tight">Account Status</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white/60">Current Plan</span>
              <Badge className={`rounded-full px-3 py-1 font-black uppercase tracking-widest text-[9px] ${isPremium ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                {isPremium ? 'Premium Pro' : 'Free Tier'}
              </Badge>
            </div>

            {!isPremium ? (
              <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                <p className="text-xs font-medium text-white/60 leading-relaxed">Upgrade to unlock unlimited mock exams, AI analysis, and offline mode.</p>
                <Button className="mt-3 w-full h-10 rounded-xl bg-primary text-sm font-black uppercase tracking-widest shadow-md transition-all hover:scale-105 active:scale-95" onClick={() => setActiveTab('premium')}>
                  Upgrade Now
                </Button>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Premium Active</p>
                <p className="mt-1 text-xs font-medium text-white/60">Your subscription is active until May 12, 2026.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Admin Section - Only visible to the owner */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-emerald-500/5 p-6 border border-emerald-500/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
              <Settings size={18} />
            </div>
            <div>
              <h4 className="font-heading text-base font-black tracking-tight text-emerald-900">Owner Controls</h4>
              <p className="text-xs font-medium text-emerald-700">Restricted to: <span className="font-bold">afeezedeifoshaibu@gmail.com</span></p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-card p-4 shadow-md border border-emerald-500/10">
            <div className="space-y-0.5">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-900">Manual Upgrade Toggle</p>
              <p className="text-[10px] font-medium text-emerald-600">Verify payments and upgrade users.</p>
            </div>
            <Button
              className={`h-10 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${isPremium ? 'bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20'}`}
              onClick={() => setIsPremium(!isPremium)}
            >
              {isPremium ? 'Revoke Premium' : 'Grant Premium'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PaystackPaymentButton({ user }: { user: any }) {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handlePayment = () => {
    const key = process.env.PAYSTACK_PUBLIC_KEY;
    if (!key) {
      console.error('Paystack public key not configured');
      setStatus('error');
      return;
    }
    if (!window.PaystackPop) {
      console.error('Paystack script not loaded');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('idle');

    const handler = window.PaystackPop.setup({
      key,
      email: user.email,
      amount: 250000, // ₦2,500 in kobo
      currency: 'NGN',
      ref: `nmcn_${user.uid}_${Date.now()}`,
      onSuccess: async (transaction) => {
        try {
          const paymentRef = collection(db, 'users', user.uid, 'payments');
          await addDoc(paymentRef, {
            reference: transaction.reference,
            amount: 2500,
            status: 'success',
            paidAt: new Date().toISOString(),
          });

          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            isPremium: true,
            premiumSince: new Date().toISOString(),
            lastPaymentRef: transaction.reference,
          });

          setStatus('success');
        } catch (err) {
          console.error('Failed to record payment:', err);
          setStatus('error');
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        setLoading(false);
      },
    });

    handler.openIframe();
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 w-full h-12 rounded-xl bg-emerald-500 justify-center text-white text-sm font-black uppercase tracking-widest">
        <CheckCircle2 size={18} />
        Payment Successful
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <Button
        className="w-full h-12 rounded-xl bg-primary text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Pay ₦2,500 with Card'}
      </Button>
      {status === 'error' && (
        <p className="text-center text-xs font-bold text-red-400">Something went wrong. Please try again.</p>
      )}
    </div>
  );
}

function PremiumView({ isPremium, setActiveTab, user }: { isPremium: boolean, setActiveTab: (tab: string) => void, user: any }) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-6 md:p-8 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-[80px]" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="space-y-3">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">Premium Access</Badge>
            <h3 className="font-heading text-2xl md:text-4xl font-black leading-[0.9] tracking-tighter">
              {isPremium ? "You're a" : "Unlock Your"} <br />
              <span className="text-white/60">{isPremium ? "Prep Master Pro." : "Full Potential."}</span>
            </h3>
            <p className="max-w-md text-sm font-medium leading-relaxed text-primary-foreground/80">
              {isPremium
                ? "Enjoy unlimited access to all features, AI analysis, and predictive exams."
                : "Join 10,000+ successful nurses who aced their NMCN exams on the first try."}
            </p>
          </div>
          <div className="hidden md:flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Zap size={36} className={`fill-white text-white ${isPremium ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
        </div>
      </div>

      {!isPremium ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="group relative flex flex-col overflow-hidden border-none bg-card p-6 md:p-8 shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.01] rounded-3xl">
            <CardHeader className="p-0 mb-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-heading text-xl md:text-2xl font-black tracking-tight">Free Plan</CardTitle>
                  <CardDescription className="text-sm font-medium">Get started today</CardDescription>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl md:text-3xl font-black tracking-tighter">₦0</span>
                  <span className="text-muted-foreground font-bold text-sm">/mo</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <ul className="space-y-2.5">
                {['10 Daily MCQs', 'Basic Explanations', '1 Mock Exam / Month'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <Badge size={10} className="p-0 bg-transparent text-inherit">✓</Badge>
                    </div>
                    {item}
                  </li>
                ))}
                {['Unlimited Topic Quizzes', 'AI Study Assistant'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground/40">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Badge size={10} className="p-0 bg-transparent text-inherit">✕</Badge>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0 mt-6 w-full border-0 bg-transparent">
              <Button variant="outline" className="w-full h-12 rounded-xl border-2 text-sm font-black uppercase tracking-widest">Current Plan</Button>
            </CardFooter>
          </Card>

        <Card className="group relative flex flex-col overflow-visible border-none bg-slate-900 p-6 md:p-8 text-white shadow-xl shadow-indigo-200/40 transition-all hover:scale-[1.01] rounded-3xl">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-5 py-1.5 text-[9px] font-black text-white uppercase tracking-[0.3em] shadow-lg shadow-primary/30 z-20 whitespace-nowrap">Most Popular</div>

          <CardHeader className="p-0 mb-5 relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="font-heading text-2xl md:text-3xl font-black tracking-tighter">Premium Pro</CardTitle>
                <CardDescription className="text-sm font-medium text-white/60 mt-0.5">Everything you need to pass</CardDescription>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="text-2xl md:text-3xl font-black tracking-tighter">₦2,500</span>
                <span className="text-white/40 font-bold text-sm">/mo</span>
              </div>
            </div>
          </CardHeader>
            <CardContent className="p-0 flex-1 relative z-10">
              <ul className="space-y-2.5">
                {[
                  'Unlimited Daily MCQs',
                  'Detailed Video Explanations',
                  'Unlimited Topic Quizzes',
                  'Weekly Predictive Mock Exams',
                  'AI-Powered Weak Area Analysis',
                  'Offline Study Mode'
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-white/80">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <Zap size={10} className="fill-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-0 mt-6 relative z-10 w-full border-0 bg-transparent">
              <div className="w-full">
                <PaystackPaymentButton user={user} />
              </div>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <Card className="border-none bg-card p-8 text-center shadow-xl shadow-slate-200/40 rounded-3xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="font-heading text-2xl font-black tracking-tight">Premium Active</h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-muted-foreground">
            You have full access to all NMCN Prep Master features.
          </p>
          <Button variant="outline" className="mt-6 h-12 rounded-xl border-2 font-black uppercase tracking-widest text-sm" onClick={() => setActiveTab('dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 selection:bg-primary/30 overflow-x-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.15),transparent_50%)]" />
        <div className="absolute -top-[20%] -left-[10%] h-[1000px] w-[1000px] rounded-full bg-primary/20 blur-[160px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-indigo-500/10 blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <header className="fixed top-6 left-1/2 z-50 flex h-20 w-[92%] -translate-x-1/2 items-center justify-between rounded-[32px] border border-white/10 bg-black/40 px-6 backdrop-blur-2xl shadow-2xl md:w-[85%] md:px-10">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 overflow-hidden group transition-transform hover:scale-105">
            <img src="https://picsum.photos/seed/succinate/400/400" alt="Succinate World" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col -space-y-1">
            <h1 className="font-heading text-2xl font-black tracking-tighter text-white uppercase">NMCN</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Prep Master</p>
          </div>
        </div>
        <nav className="hidden items-center gap-12 lg:flex">
          {['Features', 'Exams', 'Pricing', 'About'].map((item) => (
            <button key={item} className="group relative text-[10px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white">
              {item}
              <span className="absolute -bottom-2 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4 md:gap-8">
          <Button variant="ghost" className="hidden font-black text-white/70 hover:text-white sm:flex uppercase tracking-widest text-[10px]" onClick={onLogin}>Log in</Button>
          <Button className="h-12 rounded-2xl bg-primary px-8 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95" onClick={onLogin}>
            Get Started
          </Button>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-40 text-center md:px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12 md:space-y-20"
          >
            <div className="inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 backdrop-blur-md md:px-10 md:py-4">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 md:text-xs">
                The Gold Standard for Nursing Excellence
              </span>
            </div>
            
            <div className="relative">
              <h2 className="font-heading mx-auto max-w-[1600px] text-[18vw] font-black leading-[0.8] tracking-tighter text-white sm:text-[15vw] md:text-[200px]">
                NMCN <br />
                <span className="relative inline-block text-primary italic skew-x-[-10deg]">
                  PREP
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 1, duration: 1.5 }}
                    className="absolute -bottom-4 left-0 h-4 bg-primary/20 md:h-8" 
                  />
                </span> MASTER.
              </h2>
            </div>

            <p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed text-white/50 md:max-w-5xl md:text-5xl">
              The most advanced study platform for Nigerian nurses. Built with precision, powered by AI, and designed for your success.
            </p>

            <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:gap-16">
              <Button 
                className="h-20 w-full rounded-[32px] bg-primary px-16 text-xl font-black uppercase tracking-widest shadow-[0_20px_80px_rgba(var(--primary),0.5)] transition-all hover:scale-105 hover:bg-primary/90 active:scale-95 md:h-32 md:w-auto md:rounded-[48px] md:px-24 md:text-4xl" 
                onClick={onLogin}
              >
                Start Free
              </Button>
              <div className="flex items-center gap-8">
                <div className="flex -space-x-6 md:-space-x-8">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 w-14 rounded-full border-4 border-[#050505] bg-white/10 shadow-2xl md:h-20 md:w-20 overflow-hidden">
                      <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="User" className="h-full w-full object-cover opacity-80" />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-lg font-black tracking-tight text-white md:text-2xl">10,000+</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 md:text-xs">Nigerian Nurses</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mt-60 w-full border-y border-white/5 py-16 opacity-30 transition-all hover:opacity-100">
            <div className="flex animate-marquee items-center gap-40 whitespace-nowrap">
              {Array(10).fill(['NMCN', 'NANNM', 'WHO', 'UNICEF', 'LAGOS HEALTH', 'ABUJA HEALTH']).flat().map((logo, i) => (
                <span key={i} className="font-heading text-6xl font-black tracking-tighter text-white uppercase">{logo}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-60 bg-[#080808]">
          <div className="mx-auto max-w-[1400px] px-8 md:px-16">
            <div className="mb-40 text-center space-y-8">
              <Badge className="bg-primary/10 text-primary border-none px-6 py-2 text-xs font-black uppercase tracking-[0.3em]">Features</Badge>
              <h3 className="font-heading text-6xl font-black leading-[0.9] tracking-tighter text-white md:text-[120px]">Everything to pass <br />on the <span className="text-primary italic">first attempt</span>.</h3>
            </div>
            <div className="grid gap-12 lg:grid-cols-12">
              <FeatureCard 
                className="lg:col-span-8 bg-white/[0.02] border-white/5"
                icon={<Zap size={48} strokeWidth={2.5} />} 
                title="Daily Pulse" 
                desc="High-yield questions delivered every morning. Stay sharp, stay consistent with AI-curated content."
              />
              <FeatureCard 
                className="lg:col-span-4 bg-white/[0.02] border-white/5"
                icon={<Clock size={48} strokeWidth={2.5} />} 
                title="Real-Time Mock" 
                desc="Perfectly simulated NMCN environment. No surprises on exam day."
              />
              <FeatureCard 
                className="lg:col-span-4 bg-white/[0.02] border-white/5"
                icon={<BookOpen size={48} strokeWidth={2.5} />} 
                title="Deep Analytics" 
                desc="AI-powered insights into your performance. Focus where it matters most."
              />
              <FeatureCard 
                className="lg:col-span-8 bg-white/[0.02] border-white/5"
                icon={<Trophy size={48} strokeWidth={2.5} />} 
                title="Leaderboard" 
                desc="Compete with thousands of candidates across Nigeria. Earn points, badges, and prestige."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black py-40">
        <div className="mx-auto max-w-[1400px] px-8 md:px-16">
          <div className="flex flex-col items-center justify-between gap-20 md:flex-row md:items-start">
            <div className="space-y-10 text-center md:text-left">
              <div className="flex items-center justify-center gap-4 md:justify-start">
                <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary text-primary-foreground overflow-hidden shadow-2xl shadow-primary/20">
                  <img src="https://picsum.photos/seed/succinate/400/400" alt="Succinate World" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="font-heading text-4xl font-black tracking-tighter text-white uppercase">NMCN</span>
              </div>
              <p className="max-w-sm text-xl font-medium leading-relaxed text-white/40">Empowering the next generation of Nigerian healthcare heroes.</p>
            </div>
            <div className="grid grid-cols-2 gap-20 md:grid-cols-3">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Platform</h4>
                <ul className="space-y-4 text-sm font-bold text-white/30">
                  <li className="hover:text-primary transition-colors cursor-pointer">Features</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Pricing</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Exams</li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Company</h4>
                <ul className="space-y-4 text-sm font-bold text-white/30">
                  <li className="hover:text-primary transition-colors cursor-pointer">About</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Careers</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
                </ul>
              </div>
              <div className="hidden space-y-6 md:block">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Legal</h4>
                <ul className="space-y-4 text-sm font-bold text-white/30">
                  <li className="hover:text-primary transition-colors cursor-pointer">Privacy</li>
                  <li className="hover:text-primary transition-colors cursor-pointer">Terms</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-40 border-t border-white/5 pt-20 text-center">
            <p className="text-sm font-bold text-white/20 uppercase tracking-widest">© 2026 NMCN Prep Master. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


function FeatureCard({ icon, title, desc, className }: { icon: React.ReactNode, title: string, desc: string, className?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`group relative overflow-hidden rounded-[48px] bg-card p-12 shadow-2xl shadow-slate-200/40 transition-all duration-500 border border-transparent hover:border-primary/10 ${className}`}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
      <div className="relative z-10 space-y-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-6">
          {icon}
        </div>
        <div className="space-y-4">
          <h3 className="font-heading text-3xl font-black tracking-tight text-white">{title}</h3>
          <p className="text-lg font-medium leading-relaxed text-white/40">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}
