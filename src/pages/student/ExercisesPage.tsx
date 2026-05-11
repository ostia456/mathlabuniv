import { useState, useEffect, useRef } from 'react';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exerciseApi } from '@/services/api';
import type { Exercise, ExerciseAttempt } from '@/types';
import { toast } from 'sonner';
import {
  CheckCircle, XCircle, Clock, Trophy, BookOpen, Calculator,
  Grid3X3, Share2, LineChart, Lightbulb, RotateCcw, ChevronRight,
  TrendingUp, History, Flame, Star,
} from 'lucide-react';
import { GraphDiagram } from '@/components/graph/GraphDiagram';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const MODULES = [
  { id: 'dynamical_systems',  name: 'Systèmes Dynamiques', icon: LineChart,   color: 'bg-blue-500' },
  { id: 'numerical_methods',  name: 'Méthodes Numériques',  icon: Calculator,  color: 'bg-green-500' },
  { id: 'linear_algebra',     name: 'Algèbre Linéaire',     icon: Grid3X3,     color: 'bg-purple-500' },
  { id: 'graph_theory',       name: 'Théorie des Graphes',  icon: Share2,      color: 'bg-orange-500' },
];

const EXERCISE_TYPES: Record<string, { id: string; label: string }[]> = {
  dynamical_systems: [
    { id: 'ode',       label: 'Équations différentielles' },
    { id: 'stability', label: 'Stabilité' },
  ],
  numerical_methods: [
    { id: 'numerical_integration', label: 'Intégration numérique' },
    { id: 'convergence',           label: 'Convergence' },
  ],
  linear_algebra: [
    { id: 'matrix',      label: 'Matrices' },
    { id: 'eigenvalues', label: 'Valeurs propres' },
  ],
  graph_theory: [
    { id: 'shortest_path', label: 'Plus court chemin' },
    { id: 'mst',           label: 'Arbre couvrant minimal' },
  ],
};

const DIFFICULTY_CONFIG = [
  { label: 'Très facile', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  { label: 'Facile',      color: 'bg-green-500',   text: 'text-green-700',   bg: 'bg-green-50' },
  { label: 'Moyen',       color: 'bg-yellow-500',  text: 'text-yellow-700',  bg: 'bg-yellow-50' },
  { label: 'Difficile',   color: 'bg-orange-500',  text: 'text-orange-700',  bg: 'bg-orange-50' },
  { label: 'Expert',      color: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50' },
];

function diffConf(d: number) {
  return DIFFICULTY_CONFIG[Math.min(Math.max(d - 1, 0), 4)];
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export function ExercisesPage() {
  // ── Configuration ──────────────────────────────────────────────────────────
  const [selectedModule, setSelectedModule] = useState('dynamical_systems');
  const [selectedType, setSelectedType]     = useState('ode');
  const [difficulty, setDifficulty]         = useState(1);

  // ── État exercice ──────────────────────────────────────────────────────────
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [answer, setAnswer]                   = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [result, setResult]                   = useState<any>(null);
  const [startTime, setStartTime]             = useState(0);
  const [elapsed, setElapsed]                 = useState(0);
  const [showHint, setShowHint]               = useState(false);
  const [hintIndex, setHintIndex]             = useState(0);

  // ── Historique ─────────────────────────────────────────────────────────────
  const [history, setHistory]     = useState<ExerciseAttempt[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  // ── Streak ─────────────────────────────────────────────────────────────────
  const [streak, setStreak] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (currentExercise && !result) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentExercise, result, startTime]);

  // ── Charger l'historique ───────────────────────────────────────────────────
  const loadHistory = async () => {
    setHistLoading(true);
    try {
      const data = await exerciseApi.getHistory();
      setHistory(data);
    } catch {
      toast.error("Erreur lors du chargement de l'historique.");
    } finally {
      setHistLoading(false);
    }
  };

  // ── Générer un exercice ────────────────────────────────────────────────────
  const generateExercise = async () => {
    setIsLoading(true);
    setResult(null);
    setAnswer('');
    setShowHint(false);
    setHintIndex(0);
    setElapsed(0);
    try {
      const data = await exerciseApi.generate({
        module:     selectedModule,
        type:       selectedType || EXERCISE_TYPES[selectedModule][0].id,
        difficulty,
      });
      setCurrentExercise(data.exercise);
      setStartTime(Date.now());
      if (data.difficulty_adjusted) {
        toast.info('Difficulté adaptée à votre niveau !', { icon: '🎯' });
      }
    } catch {
      toast.error("Erreur lors de la génération de l'exercice.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Soumettre la réponse ───────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!currentExercise) return;
    setIsLoading(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const data = await exerciseApi.submit(currentExercise.id, {
        answer:     parseFloat(answer),
        time_spent: timeSpent,
      });
      setResult(data);
      if (data.is_correct) {
        setStreak((s) => s + 1);
        toast.success('Bonne réponse ! 🎉');
      } else {
        setStreak(0);
        toast.error('Mauvaise réponse. Réessayez !');
      }
    } catch {
      toast.error('Erreur lors de la soumission.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Réinitialiser ──────────────────────────────────────────────────────────
  const resetExercise = () => {
    setCurrentExercise(null);
    setResult(null);
    setAnswer('');
    setShowHint(false);
    setHintIndex(0);
    setElapsed(0);
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedType(EXERCISE_TYPES[moduleId][0].id);
    resetExercise();
  };

  // ── Rendu du problème ──────────────────────────────────────────────────────
  const renderProblem = (ex: Exercise) => {
    const pd = ex.problem_data;
    return (
      <div className="space-y-3">
        {pd.equation && (
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Équation</p>
            <p className="font-mono text-lg font-semibold text-blue-900">{pd.equation}</p>
          </div>
        )}
        {pd.function && (
          <div className="rounded-lg bg-green-50 border border-green-100 p-3">
            <p className="text-xs text-green-600 font-medium mb-1">Fonction</p>
            <p className="font-mono text-lg font-semibold text-green-900">f(x) = {pd.function}</p>
          </div>
        )}
        {pd.initial_condition && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Condition initiale :</span>
            <span className="font-mono font-medium">
              t₀ = {pd.initial_condition[0]}, y₀ = {pd.initial_condition[1]}
            </span>
          </div>
        )}
        {pd.a !== undefined && pd.b !== undefined && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Intervalle :</span>
            <span className="font-mono font-medium">[{pd.a}, {pd.b}]</span>
          </div>
        )}
        {pd.matrix && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Matrice A :</p>
            <div className="font-mono text-sm bg-muted rounded p-2 inline-block">
              {pd.matrix.map((row: number[], i: number) => (
                <div key={i}>[ {row.join('  ')} ]</div>
              ))}
            </div>
            {pd.operation && (
              <p className="text-sm mt-2">
                <span className="text-muted-foreground">Opération :</span>{' '}
                <span className="font-medium capitalize">{pd.operation}</span>
              </p>
            )}
          </div>
        )}
        {pd.edges && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Graphe :</p>
            <GraphDiagram
              numNodes={pd.num_nodes || 5}
              edges={pd.edges}
              start={pd.start}
              end={pd.end}
            />
          </div>
        )}
        {pd.start !== undefined && pd.end !== undefined && !pd.edges && (
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">Nœuds :</span>
            <span className="font-mono font-medium">départ = {pd.start}, arrivée = {pd.end}</span>
          </div>
        )}
        {pd.question && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 mt-2">
            <p className="text-xs text-primary font-medium mb-1">❓ Question</p>
            <p className="font-medium text-primary">{pd.question}</p>
          </div>
        )}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Rendu principal
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercices</h1>
          <p className="text-muted-foreground">
            Exercices générés automatiquement et adaptés à votre niveau
          </p>
        </div>
        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-orange-700">{streak} bonne{streak > 1 ? 's' : ''} de suite !</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="exercise" onValueChange={(v) => v === 'history' && loadHistory()}>
        <TabsList>
          <TabsTrigger value="exercise">
            <BookOpen className="mr-2 h-4 w-4" />
            Exercice
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ── Onglet Exercice ── */}
        <TabsContent value="exercise" className="space-y-6 mt-4">
          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Panneau de configuration ── */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Configuration</CardTitle>
                <CardDescription>Choisissez le module et la difficulté</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Modules */}
                <div className="space-y-2">
                  <Label>Module</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODULES.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModuleChange(m.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-medium transition-all
                          ${selectedModule === m.id
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                          }`}
                      >
                        <m.icon className="h-5 w-5" />
                        <span className="text-center leading-tight">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type d'exercice</Label>
                  <div className="space-y-1">
                    {EXERCISE_TYPES[selectedModule]?.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all
                          ${selectedType === t.id
                            ? 'border-primary bg-primary/5 font-medium text-primary'
                            : 'border-border hover:bg-muted'
                          }`}
                      >
                        <ChevronRight className={`inline h-3 w-3 mr-1 transition-transform ${selectedType === t.id ? 'rotate-90' : ''}`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulté */}
                <div className="space-y-2">
                  <Label>Difficulté</Label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((d) => {
                      const conf = diffConf(d);
                      return (
                        <button
                          key={d}
                          onClick={() => setDifficulty(d)}
                          title={conf.label}
                          className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all
                            ${difficulty === d
                              ? `${conf.color} text-white shadow-md scale-105`
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                  <p className={`text-xs font-medium ${diffConf(difficulty).text}`}>
                    {diffConf(difficulty).label}
                  </p>
                </div>

              </CardContent>
              <CardFooter>
                <Button onClick={generateExercise} disabled={isLoading} className="w-full">
                  {isLoading
                    ? <Spinner className="mr-2 h-4 w-4" />
                    : <BookOpen className="mr-2 h-4 w-4" />
                  }
                  {currentExercise ? 'Nouvel exercice' : 'Générer un exercice'}
                </Button>
              </CardFooter>
            </Card>

            {/* ── Zone exercice ── */}
            <div className="lg:col-span-2 space-y-4">
              {!currentExercise ? (
                // ── État vide ──
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="rounded-full bg-primary/10 p-6 mb-4">
                      <Star className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">Prêt à s'entraîner ?</h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                      Configurez les paramètres à gauche et cliquez sur "Générer un exercice" pour commencer.
                    </p>
                    <Button onClick={generateExercise} disabled={isLoading} className="mt-6">
                      {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <BookOpen className="mr-2 h-4 w-4" />}
                      Générer un exercice
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                // ── Exercice en cours ──
                <Card>
                  <CardHeader>
                    {/* En-tête avec badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">
                            {MODULES.find((m) => m.id === currentExercise.module)?.name}
                          </Badge>
                          <Badge className={`${diffConf(currentExercise.difficulty).color} text-white`}>
                            {diffConf(currentExercise.difficulty).label}
                          </Badge>
                          <Badge variant="outline">
                            <Trophy className="mr-1 h-3 w-3" />
                            {currentExercise.points} pts
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{currentExercise.title}</CardTitle>
                        <CardDescription>{currentExercise.description}</CardDescription>
                      </div>
                      {/* Timer */}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-1.5 shrink-0">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">{elapsed}s</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Problème */}
                    <div className="rounded-xl bg-muted/40 border p-4">
                      <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">
                        Problème
                      </p>
                      {renderProblem(currentExercise)}
                    </div>

                    {/* Indice */}
                    {currentExercise.hints && currentExercise.hints.length > 0 && !result && (
                      <div>
                        {showHint ? (
                          <Alert className="border-yellow-200 bg-yellow-50">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                              <strong>Indice {hintIndex + 1}/{currentExercise.hints.length} :</strong>{' '}
                              {currentExercise.hints[hintIndex]}
                              {hintIndex < currentExercise.hints.length - 1 && (
                                <button
                                  onClick={() => setHintIndex((i) => i + 1)}
                                  className="ml-2 underline text-yellow-700 text-xs"
                                >
                                  Indice suivant
                                </button>
                              )}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(true)}
                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          >
                            <Lightbulb className="mr-2 h-4 w-4" />
                            Voir un indice
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Saisie de la réponse */}
                    {!result && (
                      <div className="space-y-2">
                        <Label htmlFor="answer">Votre réponse (valeur numérique)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="answer"
                            type="number"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Entrez votre réponse..."
                            step="any"
                            className="font-mono"
                            onKeyDown={(e) => e.key === 'Enter' && answer && submitAnswer()}
                          />
                          <Button onClick={submitAnswer} disabled={isLoading || !answer}>
                            {isLoading ? <Spinner className="h-4 w-4" /> : 'Valider'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Appuyez sur Entrée pour valider
                        </p>
                      </div>
                    )}

                    {/* Résultat */}
                    {result && (
                      <div className={`rounded-xl border-2 p-4 ${
                        result.is_correct
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {result.is_correct
                            ? <CheckCircle className="h-5 w-5 text-green-600" />
                            : <XCircle className="h-5 w-5 text-red-600" />
                          }
                          <span className={`font-semibold ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                            {result.is_correct ? '✅ Bonne réponse !' : '❌ Mauvaise réponse'}
                          </span>
                        </div>

                        <p className="text-sm mb-3">{result.feedback}</p>

                        {!result.is_correct && result.correct_answer !== undefined && (
                          <p className="text-sm font-medium text-red-700">
                            Réponse correcte : <strong className="font-mono">{
                              typeof result.correct_answer === 'number'
                                ? result.correct_answer.toFixed(4)
                                : JSON.stringify(result.correct_answer)
                            }</strong>
                          </p>
                        )}

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-current/10 text-sm">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span>Score : <strong>{result.score}%</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Temps : <strong>{elapsed}s</strong></span>
                          </div>
                          {result.progress && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              <span>Niveau : <strong>{result.progress.current_difficulty}/5</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    {result ? (
                      <>
                        <Button onClick={generateExercise} disabled={isLoading} className="flex-1">
                          {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : <BookOpen className="mr-2 h-4 w-4" />}
                          Exercice suivant
                        </Button>
                        {!result.is_correct && (
                          <Button
                            variant="outline"
                            onClick={() => { setResult(null); setAnswer(''); }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réessayer
                          </Button>
                        )}
                        <Button variant="ghost" onClick={resetExercise}>
                          Changer de module
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={resetExercise} className="ml-auto">
                        Annuler
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Onglet Historique ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des tentatives</CardTitle>
              <CardDescription>Vos 50 dernières tentatives</CardDescription>
            </CardHeader>
            <CardContent>
              {histLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <History className="h-12 w-12 mb-4" />
                  <p>Aucune tentative pour le moment.</p>
                  <p className="text-sm mt-1">Générez un exercice pour commencer !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        attempt.is_correct ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {attempt.is_correct
                          ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                          : <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        }
                        <div>
                          <p className="text-sm font-medium">Exercice #{attempt.exercise_id}</p>
                          <p className="text-xs text-muted-foreground">{attempt.feedback}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-right shrink-0">
                        <div>
                          <p className="font-bold">{attempt.score}%</p>
                          <p className="text-xs text-muted-foreground">score</p>
                        </div>
                        <div>
                          <p className="font-mono">{attempt.time_spent}s</p>
                          <p className="text-xs text-muted-foreground">temps</p>
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {new Date(attempt.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
