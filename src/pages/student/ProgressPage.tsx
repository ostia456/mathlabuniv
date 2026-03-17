import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { exerciseApi } from '@/services/api';
import type { UserProgress, ExerciseAttempt } from '@/types';
import { LineChart, Calculator, Grid3X3, Share2, Trophy, Target, Clock, TrendingUp } from 'lucide-react';

const moduleIcons: Record<string, React.ElementType> = {
  dynamical_systems: LineChart,
  numerical_methods: Calculator,
  linear_algebra: Grid3X3,
  graph_theory: Share2,
};

const moduleNames: Record<string, string> = {
  dynamical_systems: 'Systèmes Dynamiques',
  numerical_methods: 'Méthodes Numériques',
  linear_algebra: 'Algèbre Linéaire',
  graph_theory: 'Théorie des Graphes',
};

export function ProgressPage() {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [history, setHistory] = useState<ExerciseAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progressData, historyData] = await Promise.all([
          exerciseApi.getProgress(),
          exerciseApi.getHistory(),
        ]);
        setProgress(progressData);
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const totalPoints = progress.reduce((sum, p) => sum + p.total_points, 0);
  const totalExercises = progress.reduce((sum, p) => sum + p.exercises_completed, 0);
  const totalAttempts = progress.reduce((sum, p) => sum + p.exercises_attempted, 0);
  const avgSuccessRate = progress.length > 0
    ? progress.reduce((sum, p) => sum + p.success_rate, 0) / progress.length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ma Progression</h1>
        <p className="text-muted-foreground">
          Suivez votre évolution dans tous les modules
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points totaux</p>
                <p className="text-3xl font-bold">{totalPoints}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exercices réussis</p>
                <p className="text-3xl font-bold">{totalExercises}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
                <p className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tentatives</p>
                <p className="text-3xl font-bold">{totalAttempts}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progression par Module</CardTitle>
          <CardDescription>
            Votre avancement détaillé dans chaque domaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Commencez par faire des exercices pour voir votre progression!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {progress.map((p) => {
                const Icon = moduleIcons[p.module] || LineChart;
                return (
                  <div key={p.module} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{moduleNames[p.module] || p.module}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.exercises_completed} exercices complétés
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{p.total_points}</p>
                        <p className="text-sm text-muted-foreground">points</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Taux de réussite</span>
                          <span>{p.success_rate.toFixed(0)}%</span>
                        </div>
                        <Progress value={p.success_rate} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Niveau actuel</span>
                          <span>{p.current_difficulty}/5</span>
                        </div>
                        <Progress value={(p.current_difficulty / 5) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progression</span>
                          <span>{p.exercises_completed}/{p.exercises_attempted}</span>
                        </div>
                        <Progress 
                          value={p.exercises_attempted > 0 
                            ? (p.exercises_completed / p.exercises_attempted) * 100 
                            : 0} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique Récent</CardTitle>
          <CardDescription>
            Vos dernières tentatives d'exercices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Aucun exercice complété pour le moment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    attempt.is_correct ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        attempt.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {attempt.is_correct ? '✓' : '✗'}
                    </div>
                    <div>
                      <p className="font-medium">Exercice #{attempt.exercise_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{attempt.score}%</p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.time_spent}s
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
