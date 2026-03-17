import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboardApi } from '@/services/api';
import {
  Users,
  BookOpen,
  TrendingUp,
  Target,
} from 'lucide-react';

export function TeacherDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const totalExercises = stats?.overview?.total_exercises || 0;
  const totalAttempts = stats?.overview?.total_attempts || 0;
  const successRate = stats?.overview?.success_rate || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tableau de Bord Enseignant</h1>
        <p className="text-muted-foreground">
          Statistiques et suivi de la progression des étudiants
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Étudiants</p>
                <p className="text-3xl font-bold">{stats?.overview?.total_students || 0}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exercices</p>
                <p className="text-3xl font-bold">{totalExercises}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <BookOpen className="h-6 w-6 text-green-500" />
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
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
                <p className="text-3xl font-bold">{successRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Module</CardTitle>
          <CardDescription>
            Statistiques de réussite et engagement par domaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {stats?.module_stats?.map((module: any) => (
              <div key={module.module} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{module.module.replace('_', ' ')}</span>
                  <span className="text-sm text-muted-foreground">
                    {module.attempts} tentatives
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Score moyen</span>
                      <span>{module.avg_score?.toFixed(1) || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${module.avg_score || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Students */}
      <Card>
        <CardHeader>
          <CardTitle>Top Étudiants</CardTitle>
          <CardDescription>
            Les étudiants les plus actifs et performants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.top_students?.map((student: any, index: number) => (
              <div
                key={student.user.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{student.user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{student.user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{student.total_score} points</p>
                  <p className="text-sm text-muted-foreground">
                    {student.attempt_count} exercices
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gérer les Scénarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Créez et partagez des scénarios pédagogiques personnalisés
            </p>
            <Button asChild className="w-full">
              <a href="/teacher/scenarios">Accéder</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gérer les Exercices</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consultez les statistiques des exercices et leur difficulté
            </p>
            <Button asChild className="w-full">
              <a href="/teacher/exercises">Accéder</a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Voir les Étudiants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Suivez la progression individuelle de chaque étudiant
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href="/teacher/students">Accéder</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
