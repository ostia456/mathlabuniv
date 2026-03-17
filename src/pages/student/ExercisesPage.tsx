import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { exerciseApi } from '@/services/api';
import type { Exercise } from '@/types';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Trophy, BookOpen, Calculator, Grid3X3, Share2, LineChart } from 'lucide-react';
import { GraphDiagram } from '@/components/graph/GraphDiagram';

const modules = [
  { id: 'dynamical_systems', name: 'Systèmes Dynamiques', icon: LineChart },
  { id: 'numerical_methods', name: 'Méthodes Numériques', icon: Calculator },
  { id: 'linear_algebra', name: 'Algèbre Linéaire', icon: Grid3X3 },
  { id: 'graph_theory', name: 'Théorie des Graphes', icon: Share2 },
];

const exerciseTypes: Record<string, string[]> = {
  dynamical_systems: ['ode', 'stability'],
  numerical_methods: ['numerical_integration', 'convergence'],
  linear_algebra: ['matrix', 'eigenvalues'],
  graph_theory: ['shortest_path', 'mst'],
};

export function ExercisesPage() {
  const [selectedModule, setSelectedModule] = useState('dynamical_systems');
  const [selectedType, setSelectedType] = useState('');
  const [difficulty, setDifficulty] = useState(1);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const generateExercise = async () => {
    setIsLoading(true);
    setResult(null);
    setAnswer('');
    try {
      const data = await exerciseApi.generate({
        module: selectedModule,
        type: selectedType || exerciseTypes[selectedModule][0],
        difficulty,
      });
      setCurrentExercise(data.exercise);
      setStartTime(Date.now());
    } catch (error) {
      toast.error('Erreur lors de la génération de l\'exercice');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentExercise) return;

    setIsLoading(true);
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const data = await exerciseApi.submit(currentExercise.id, {
        answer: parseFloat(answer),
        time_spent: timeSpent,
      });
      setResult(data);
      if (data.is_correct) {
        toast.success('Bonne réponse!');
      } else {
        toast.error('Mauvaise réponse. Réessayez!');
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyLabel = (d: number) => {
    const labels = ['Très facile', 'Facile', 'Moyen', 'Difficile', 'Très difficile'];
    return labels[d - 1] || 'Moyen';
  };

  const getDifficultyColor = (d: number) => {
    const colors = ['bg-green-500', 'bg-green-400', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[d - 1] || 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exercices</h1>
        <p className="text-muted-foreground">
          Générez des exercices adaptés à votre niveau et progressez
        </p>
      </div>

      {!currentExercise ? (
        <Card>
          <CardHeader>
            <CardTitle>Nouvel Exercice</CardTitle>
            <CardDescription>Configurez les paramètres de l'exercice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Module Selection */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <m.icon className="h-4 w-4" />
                        {m.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Exercise Type */}
            <div className="space-y-2">
              <Label>Type d'exercice</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-sélection" />
                </SelectTrigger>
                <SelectContent>
                  {exerciseTypes[selectedModule]?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulté: {getDifficultyLabel(difficulty)}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`h-8 w-8 rounded-full ${
                      difficulty === d ? getDifficultyColor(d) : 'bg-gray-200'
                    } ${difficulty === d ? 'text-white' : 'text-gray-600'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={generateExercise} disabled={isLoading} className="w-full">
              {isLoading ? <Spinner className="mr-2" /> : <BookOpen className="mr-2 h-4 w-4" />}
              Générer un exercice
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{currentExercise.title}</CardTitle>
                <CardDescription>{currentExercise.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{modules.find(m => m.id === currentExercise.module)?.name}</Badge>
                <Badge className={getDifficultyColor(currentExercise.difficulty)}>
                  Niveau {currentExercise.difficulty}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Problem Display */}
            <div className="rounded-lg bg-muted p-4">
              <Label className="text-xs text-muted-foreground">Problème</Label>
              <div className="mt-2 space-y-2">
                {currentExercise.problem_data.equation && (
                  <div>
                    <span className="text-sm text-muted-foreground">Équation:</span>
                    <div className="font-mono text-lg">{currentExercise.problem_data.equation}</div>
                  </div>
                )}
                {currentExercise.problem_data.initial_condition && (
                  <div>
                    <span className="text-sm text-muted-foreground">Condition initiale:</span>
                    <div className="font-mono">
                      t0={currentExercise.problem_data.initial_condition[0]}, y0={currentExercise.problem_data.initial_condition[1]}
                    </div>
                  </div>
                )}
                {currentExercise.problem_data.question && (
                  <div>
                    <span className="text-sm text-muted-foreground">Question:</span>
                    <div className="font-medium">{currentExercise.problem_data.question}</div>
                  </div>
                )}
                {currentExercise.problem_data.function && (
                  <div>
                    <span className="text-sm text-muted-foreground">Fonction:</span>
                    <div className="font-mono text-lg">f(t, y) = {currentExercise.problem_data.function}</div>
                  </div>
                )}
                {currentExercise.problem_data.a !== undefined && currentExercise.problem_data.b !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">Intervalle:</span>
                    <div className="font-mono">[{currentExercise.problem_data.a}, {currentExercise.problem_data.b}]</div>
                  </div>
                )}
                {currentExercise.problem_data.matrix && (
                  <div>
                    <span className="text-sm text-muted-foreground">Matrice:</span>
                    <div className="font-mono">
                      [{currentExercise.problem_data.matrix.map((row: number[]) => `[${row.join(', ')}]`).join(', ')}]
                    </div>
                  </div>
                )}
                {currentExercise.problem_data.operation && (
                  <div>
                    <span className="text-sm text-muted-foreground">Opération:</span>
                    <div className="font-medium">{currentExercise.problem_data.operation}</div>
                  </div>
                )}
                {currentExercise.problem_data.edges && (
                  <div>
                    <span className="text-sm text-muted-foreground">Graphe:</span>
                    <div className="mt-2">
                      <GraphDiagram
                        numNodes={currentExercise.problem_data.num_nodes || 5}
                        edges={currentExercise.problem_data.edges}
                        start={currentExercise.problem_data.start}
                        end={currentExercise.problem_data.end}
                      />
                    </div>
                  </div>
                )}
                {currentExercise.problem_data.start !== undefined && currentExercise.problem_data.end !== undefined && (
                  <div>
                    <span className="text-sm text-muted-foreground">Départ / Arrivée:</span>
                    <div className="font-mono">
                      start={currentExercise.problem_data.start}, end={currentExercise.problem_data.end}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Answer Input */}
            {!result && (
              <div className="space-y-2">
                <Label>Votre réponse</Label>
                <Input
                  type="number"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Entrez votre réponse numérique"
                  step="any"
                />
              </div>
            )}

            {/* Result */}
            {result && (
              <div className={`rounded-lg p-4 ${result.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                <div className="flex items-center gap-2">
                  {result.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${result.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                    {result.is_correct ? 'Bonne réponse!' : 'Mauvaise réponse'}
                  </span>
                </div>
                <p className="mt-2 text-sm">{result.feedback}</p>
                {!result.is_correct && result.correct_answer !== undefined && (
                  <p className="mt-2 text-sm">
                    La réponse correcte était: <strong>{result.correct_answer}</strong>
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Score: {result.score}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Temps: {Math.floor((Date.now() - startTime) / 1000)}s
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {!result ? (
              <Button onClick={submitAnswer} disabled={isLoading || !answer} className="flex-1">
                {isLoading ? <Spinner className="mr-2" /> : null}
                Soumettre
              </Button>
            ) : (
              <>
                <Button onClick={generateExercise} disabled={isLoading} className="flex-1">
                  {isLoading ? <Spinner className="mr-2" /> : null}
                  Nouvel exercice
                </Button>
                {!result.is_correct && (
                  <Button onClick={() => setResult(null)} variant="outline">
                    Réessayer
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
