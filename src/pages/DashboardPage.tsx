import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { exerciseApi } from '@/services/api';
import type { UserProgress } from '@/types';
import {
  LineChart,
  Calculator,
  Grid3X3,
  Share2,
  Trophy,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

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

export function DashboardPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await exerciseApi.getProgress();
        setProgress(data);
      } catch (error) {
        console.error('Failed to load progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  const totalPoints = progress.reduce((sum, p) => sum + p.total_points, 0);
  const totalExercises = progress.reduce((sum, p) => sum + p.exercises_completed, 0);
  const avgSuccessRate = progress.length > 0
    ? progress.reduce((sum, p) => sum + p.success_rate, 0) / progress.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Bonjour, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre progression sur MathLab University
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
                <p className="text-sm text-muted-foreground">Exercices complétés</p>
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
                <p className="text-sm text-muted-foreground">Taux de réussite</p>
                <p className="text-3xl font-bold">{avgSuccessRate.toFixed(1)}%</p>
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
                <p className="text-sm text-muted-foreground">Modules actifs</p>
                <p className="text-3xl font-bold">{progress.length}/4</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Progress */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progression par Module</CardTitle>
            <CardDescription>
              Votre avancement dans chaque domaine des mathématiques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Commencez par faire des exercices pour voir votre progression!</p>
                <Button asChild className="mt-4">
                  <Link to="/exercises">Commencer</Link>
                </Button>
              </div>
            ) : (
              progress.map((p) => {
                const Icon = moduleIcons[p.module] || BookOpen;
                return (
                  <div key={p.module} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{moduleNames[p.module] || p.module}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {p.exercises_completed}/{p.exercises_attempted} exercices
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={p.success_rate} className="flex-1" />
                      <span className="text-sm font-medium w-12 text-right">
                        {p.success_rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Niveau: {p.current_difficulty}/5</span>
                      <span>{p.total_points} points</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accès Rapide</CardTitle>
            <CardDescription>
              Naviguez rapidement vers les différentes sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/modules/dynamical-systems">
                <span className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Systèmes Dynamiques
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/modules/numerical-methods">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Méthodes Numériques
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/modules/linear-algebra">
                <span className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Algèbre Linéaire
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/modules/graph-theory">
                <span className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Théorie des Graphes
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link to="/exercises">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Exercices
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>
            Vos derniers exercices et simulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <Clock className="mx-auto h-8 w-8 mb-2" />
              <p>L'historique de vos activités apparaîtra ici</p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/exercises">Faire un exercice</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
