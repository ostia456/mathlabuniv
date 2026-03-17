import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { nmApi } from '@/services/api';
import { type NumericalMethod, type NumericalSolution } from '@/types';
import Plot from 'react-plotly.js';
import { Play, Info } from 'lucide-react';

const methods: NumericalMethod[] = [
  { id: 'euler_explicit', name: 'Euler Explicite', order: 1, description: 'Méthode d\'Euler explicite' },
  { id: 'euler_modified', name: 'Euler Modifié', order: 2, description: 'Méthode du point milieu' },
  { id: 'runge_kutta_2', name: 'Runge-Kutta 2', order: 2, description: 'Méthode de Heun' },
  { id: 'runge_kutta_4', name: 'Runge-Kutta 4', order: 4, description: 'Méthode RK4 classique' },
  { id: 'adams_bashforth_2', name: 'Adams-Bashforth 2', order: 2, description: 'Méthode à 2 pas' },
];

const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

export function NumericalMethodsPage() {
  const [function_str, setFunction] = useState('-y + sin(t)');
  const [y0, setY0] = useState(1);
  const [t0] = useState(0);
  const [tf, setTf] = useState(10);
  const [h, setH] = useState(0.1);
  const [exactSolution, setExactSolution] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['euler_explicit', 'runge_kutta_4']);
  const [results, setResults] = useState<Record<string, NumericalSolution> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [convergenceData, setConvergenceData] = useState<any>(null);

  const runComparison = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await nmApi.compare({
        methods: selectedMethods,
        function: function_str,
        y0,
        t0,
        tf,
        h,
        exact_solution: exactSolution || undefined,
      });
      setResults(data.results);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMethods, function_str, y0, t0, tf, h, exactSolution]);

  const runConvergenceStudy = useCallback(async () => {
    if (!exactSolution) return;
    setIsLoading(true);
    try {
      const data = await nmApi.convergenceStudy({
        method: selectedMethods[0] || 'runge_kutta_4',
        function: function_str,
        y0,
        t0,
        tf,
        exact_solution: exactSolution,
      });
      setConvergenceData(data);
    } catch (error) {
      console.error('Convergence study failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMethods, function_str, y0, t0, tf, exactSolution]);

  const toggleMethod = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((m) => m !== methodId)
        : [...prev, methodId]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Méthodes Numériques</h1>
        <p className="text-muted-foreground">
          Comparaison des méthodes d'intégration numérique et analyse de convergence
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Définissez l'équation différentielle et les paramètres</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Function Input */}
            <div className="space-y-2">
              <Label>Équation différentielle (dy/dt = )</Label>
              <Input
                value={function_str}
                onChange={(e) => setFunction(e.target.value)}
                placeholder="-y + sin(t)"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez t et y comme variables. Ex: -y + sin(t)
              </p>
            </div>

            {/* Initial Conditions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>y(0)</Label>
                <Input
                  type="number"
                  value={y0}
                  onChange={(e) => setY0(parseFloat(e.target.value) || 0)}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label>t final</Label>
                <Input
                  type="number"
                  value={tf}
                  onChange={(e) => setTf(parseFloat(e.target.value) || 10)}
                />
              </div>
            </div>

            {/* Step Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pas de discrétisation (h)</Label>
                <span className="text-sm text-muted-foreground">{h.toFixed(3)}</span>
              </div>
              <Slider
                value={[h]}
                onValueChange={([v]) => setH(v)}
                min={0.001}
                max={1}
                step={0.001}
              />
            </div>

            {/* Exact Solution (optional) */}
            <div className="space-y-2">
              <Label>Solution exacte (optionnel)</Label>
              <Input
                value={exactSolution}
                onChange={(e) => setExactSolution(e.target.value)}
                placeholder="exp(-t) + sin(t) - cos(t)"
              />
              <p className="text-xs text-muted-foreground">
                Permet de calculer l'erreur
              </p>
            </div>

            {/* Method Selection */}
            <div className="space-y-2">
              <Label>Méthodes à comparer</Label>
              <div className="space-y-2">
                {methods.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.id}
                      checked={selectedMethods.includes(method.id)}
                      onCheckedChange={() => toggleMethod(method.id)}
                    />
                    <label
                      htmlFor={method.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {method.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        (ordre {method.order})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={runComparison}
              disabled={isLoading || selectedMethods.length === 0}
              className="w-full"
            >
              {isLoading ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
              Comparer
            </Button>

            {exactSolution && (
              <Button
                onClick={runConvergenceStudy}
                disabled={isLoading || selectedMethods.length === 0}
                variant="outline"
                className="w-full"
              >
                Étude de convergence
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Résultats</CardTitle>
            <CardDescription>Comparaison des solutions numériques</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="solutions">
              <TabsList className="mb-4">
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
                <TabsTrigger value="errors">Erreurs</TabsTrigger>
                <TabsTrigger value="convergence">Convergence</TabsTrigger>
              </TabsList>

              <TabsContent value="solutions" className="h-[400px]">
                {results ? (
                  <Plot
                    data={[
                      ...Object.entries(results).map(([methodId, result], index) => ({
                        x: result.t,
                        y: result.y,
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        name: methods.find((m) => m.id === methodId)?.name || methodId,
                        line: { color: colors[index % colors.length], width: 2 },
                      })),
                    ]}
                    layout={{
                      title: 'Comparaison des méthodes numériques',
                      xaxis: { title: 't' },
                      yaxis: { title: 'y' },
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                      legend: { orientation: 'h', y: -0.2 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Info className="mb-2 h-8 w-8" />
                    <p>Lancez une comparaison pour voir les résultats</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="h-[400px]">
                {results && exactSolution ? (
                  <Plot
                    data={[
                      ...Object.entries(results)
                        .filter(([_, result]) => result.error)
                        .map(([methodId, result], index) => ({
                          x: result.t,
                          y: result.error,
                          type: 'scatter' as const,
                          mode: 'lines' as const,
                          name: methods.find((m) => m.id === methodId)?.name || methodId,
                          line: { color: colors[index % colors.length], width: 2 },
                        })),
                    ]}
                    layout={{
                      title: 'Erreur par rapport à la solution exacte',
                      xaxis: { title: 't' },
                      yaxis: { title: '|erreur|', type: 'log' },
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                      legend: { orientation: 'h', y: -0.2 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Info className="mb-2 h-8 w-8" />
                    <p>Entrez une solution exacte pour voir les erreurs</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="convergence" className="h-[400px]">
                {convergenceData ? (
                  <Plot
                    data={[
                      {
                        x: convergenceData.convergence_data.map((d: any) => d.h),
                        y: convergenceData.convergence_data.map((d: any) => d.error),
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: 'Erreur réelle',
                        line: { color: '#3b82f6', width: 2 },
                      },
                      {
                        x: convergenceData.convergence_data.map((d: any) => d.h),
                        y: convergenceData.convergence_data.map((d: any) => {
                          const h_ratio = d.h / convergenceData.convergence_data[0].h;
                          return convergenceData.convergence_data[0].error * Math.pow(h_ratio, convergenceData.theoretical_order);
                        }),
                        type: 'scatter',
                        mode: 'lines',
                        name: `Ordre ${convergenceData.theoretical_order} (théorique)`,
                        line: { color: '#ef4444', dash: 'dash', width: 2 },
                      },
                    ]}
                    layout={{
                      title: `Étude de convergence - Ordre estimé: ${convergenceData.estimated_order?.toFixed(2) || 'N/A'}`,
                      xaxis: { title: 'h', type: 'log' },
                      yaxis: { title: 'Erreur max', type: 'log' },
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                    <Info className="mb-2 h-8 w-8" />
                    <p>Lancez une étude de convergence pour voir les résultats</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Method Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {methods.slice(0, 4).map((method) => (
          <Card key={method.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{method.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{method.description}</p>
              <p className="mt-2 text-xs">Ordre: {method.order}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
