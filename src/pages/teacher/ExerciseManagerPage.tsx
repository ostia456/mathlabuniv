import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { dashboardApi } from '@/services/api';
import { toast } from 'sonner';
import { BookOpen, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';

interface ExerciseStats {
  exercise: {
    id: number;
    title: string;
    module: string;
    difficulty: number;
  };
  stats: {
    total_attempts: number;
    correct_attempts: number;
    success_rate: number;
    avg_score: number;
    avg_time: number;
  };
}

export function ExerciseManagerPage() {
  const [exercises, setExercises] = useState<ExerciseStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await dashboardApi.getExerciseStats();
      setExercises(data.exercises);
    } catch (error) {
      toast.error('Erreur lors du chargement des exercices');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (d: number) => {
    const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[d - 1] || 'bg-yellow-500';
  };

  const getModuleName = (module: string) => {
    const names: Record<string, string> = {
      dynamical_systems: 'Systèmes Dynamiques',
      numerical_methods: 'Méthodes Numériques',
      linear_algebra: 'Algèbre Linéaire',
      graph_theory: 'Théorie des Graphes',
    };
    return names[module] || module;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Exercices</h1>
        <p className="text-muted-foreground">
          Statistiques et analyse des exercices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total exercices</p>
                <p className="text-3xl font-bold">{exercises.length}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tentatives totales</p>
                <p className="text-3xl font-bold">
                  {exercises.reduce((sum, e) => sum + e.stats.total_attempts, 0)}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de réussite moyen</p>
                <p className="text-3xl font-bold">
                  {exercises.length > 0
                    ? (exercises.reduce((sum, e) => sum + e.stats.success_rate, 0) / exercises.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-3xl font-bold">
                  {exercises.length > 0
                    ? (exercises.reduce((sum, e) => sum + e.stats.avg_score, 0) / exercises.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Exercices</CardTitle>
          <CardDescription>
            Performance détaillée de chaque exercice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {exercises.map((item) => (
              <div
                key={item.exercise.id}
                className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{item.exercise.title}</h3>
                    <Badge className={getDifficultyColor(item.exercise.difficulty)}>
                      Niveau {item.exercise.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getModuleName(item.exercise.module)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{item.stats.total_attempts}</p>
                    <p className="text-xs text-muted-foreground">Tentatives</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{item.stats.success_rate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Réussite</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{item.stats.avg_score.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Score moyen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{item.stats.avg_time.toFixed(0)}s</p>
                    <p className="text-xs text-muted-foreground">Temps moyen</p>
                  </div>
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpen className="mx-auto h-12 w-12 mb-4" />
                <p>Aucun exercice disponible pour le moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Module Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['dynamical_systems', 'numerical_methods', 'linear_algebra', 'graph_theory'].map((module) => {
              const moduleExercises = exercises.filter((e) => e.exercise.module === module);
              const avgSuccess = moduleExercises.length > 0
                ? moduleExercises.reduce((sum, e) => sum + e.stats.success_rate, 0) / moduleExercises.length
                : 0;

              return (
                <div key={module} className="rounded-lg border p-4">
                  <p className="font-medium">{getModuleName(module)}</p>
                  <p className="text-2xl font-bold mt-2">{moduleExercises.length}</p>
                  <p className="text-sm text-muted-foreground">exercices</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Réussite</span>
                      <span>{avgSuccess.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200 mt-1">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${avgSuccess}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
