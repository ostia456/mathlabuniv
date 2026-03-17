import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { dsApi } from '@/services/api';
import type { DynamicalSystem, SimulationResult, PhasePortraitData } from '@/types';
import Plot from 'react-plotly.js';
import { Play } from 'lucide-react';

class PlotErrorBoundary extends Component<
  { children: ReactNode; fallbackTitle: string },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode; fallbackTitle: string }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-4 text-sm text-red-600">
          <div className="max-w-[700px]">
            <div className="font-semibold">{this.props.fallbackTitle}</div>
            <div className="mt-2 font-mono break-words">{this.state.error.message}</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function buildVectorFieldSegments(
  X: number[][],
  Y: number[][],
  U: number[][],
  V: number[][],
  scale = 0.25
) {
  const xs: Array<number | null> = [];
  const ys: Array<number | null> = [];

  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < X[i].length; j++) {
      const x0 = X[i][j];
      const y0 = Y[i][j];
      const x1 = x0 + U[i][j] * scale;
      const y1 = y0 + V[i][j] * scale;
      xs.push(x0, x1, null);
      ys.push(y0, y1, null);
    }
  }

  return { xs, ys };
}


const defaultSystems: Record<string, DynamicalSystem> = {
  harmonic_oscillator: {
    id: 'harmonic_oscillator',
    name: 'Oscillateur Harmonique',
    params: { omega: 1.0, gamma: 0.1 },
    equations: ['dx/dt = v', 'dv/dt = -ω²x - γv'],
    description: 'Oscillateur harmonique amorti',
  },
  lotka_volterra: {
    id: 'lotka_volterra',
    name: 'Lotka-Volterra',
    params: { alpha: 1.0, beta: 0.1, gamma: 1.5, delta: 0.075 },
    equations: ['dx/dt = αx - βxy', 'dy/dt = δxy - γy'],
    description: 'Modèle proie-prédateur',
  },
  lorenz: {
    id: 'lorenz',
    name: 'Système de Lorenz',
    params: { sigma: 10.0, rho: 28.0, beta: 8.0 / 3.0 },
    equations: ['dx/dt = σ(y-x)', 'dy/dt = x(ρ-z) - y', 'dz/dt = xy - βz'],
    description: 'Système chaotique de Lorenz',
  },
  pendulum: {
    id: 'pendulum',
    name: 'Pendule Simple',
    params: { g: 9.81, L: 1.0, damping: 0.1 },
    equations: ['dθ/dt = ω', 'dω/dt = -(g/L)sin(θ) - damping*ω'],
    description: 'Pendule simple avec amortissement',
  },
  van_der_pol: {
    id: 'van_der_pol',
    name: 'Oscillateur de Van der Pol',
    params: { mu: 1.0, omega: 1.0 },
    equations: ['dx/dt = y', 'dy/dt = μ(1-x²)y - ω²x'],
    description: 'Oscillateur à cycle limite',
  },
};

export function DynamicalSystemsPage() {
  const [selectedSystem, setSelectedSystem] = useState<string>('harmonic_oscillator');
  const [params, setParams] = useState<Record<string, number>>(defaultSystems.harmonic_oscillator.params);
  const [initialState, setInitialState] = useState<number[]>([1.0, 0.0]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [phasePortrait, setPhasePortrait] = useState<PhasePortraitData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tSpan, setTSpan] = useState<[number, number]>([0, 20]);

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    try {
      const result = await dsApi.simulate({
        system: selectedSystem,
        params,
        initial_state: initialState,
        t_span: tSpan,
        dt: 0.01,
      });
      setSimulation(result);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  }, [selectedSystem, params, initialState, tSpan]);

  const runPhasePortrait = useCallback(async () => {
    try {
      const result = await dsApi.getPhasePortrait({
        system: selectedSystem,
        params,
        x_range: [-3, 3],
        y_range: [-3, 3],
        grid_size: 20,
      });
      setPhasePortrait(result);
    } catch (error) {
      console.error('Phase portrait failed:', error);
    }
  }, [selectedSystem, params]);

  useEffect(() => {
    runSimulation();
    runPhasePortrait();
  }, [runSimulation, runPhasePortrait]);

  const handleSystemChange = (systemId: string) => {
    setSelectedSystem(systemId);
    setParams(defaultSystems[systemId].params);
    setInitialState(systemId === 'lorenz' ? [1.0, 1.0, 1.0] : [1.0, 0.0]);
  };

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const system = defaultSystems[selectedSystem];
  const is3D = selectedSystem === 'lorenz';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Systèmes Dynamiques</h1>
        <p className="text-muted-foreground">
          Simulation d'équations différentielles ordinaires et analyse de portraits de phase
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Configurez le système et les conditions initiales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* System Selection */}
            <div className="space-y-2">
              <Label>Système</Label>
              <Select value={selectedSystem} onValueChange={handleSystemChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(defaultSystems).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{system.description}</p>
            </div>

            {/* Equations Display */}
            <div className="rounded-lg bg-muted p-3">
              <Label className="text-xs">Équations</Label>
              <div className="mt-1 space-y-1 font-mono text-sm">
                {system.equations.map((eq, i) => (
                  <div key={i}>{eq}</div>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="space-y-4">
              <Label>Paramètres du système</Label>
              {Object.entries(params).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">{key}</span>
                    <span className="text-sm text-muted-foreground">{value.toFixed(3)}</span>
                  </div>
                  <Slider
                    value={[value]}
                    onValueChange={([v]) => handleParamChange(key, v)}
                    min={0.01}
                    max={key === 'g' ? 20 : 10}
                    step={0.01}
                  />
                </div>
              ))}
            </div>

            {/* Initial Conditions */}
            <div className="space-y-2">
              <Label>Conditions initiales</Label>
              <div className="grid grid-cols-2 gap-2">
                {initialState.map((val, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-xs text-muted-foreground">x{i + 1}(0)</span>
                    <input
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newState = [...initialState];
                        newState[i] = parseFloat(e.target.value) || 0;
                        setInitialState(newState);
                      }}
                      className="w-full rounded-md border px-2 py-1 text-sm"
                      step={0.1}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Time Span */}
            <div className="space-y-2">
              <Label>Intervalle de temps</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">t₀</span>
                  <input
                    type="number"
                    value={tSpan[0]}
                    onChange={(e) => setTSpan([parseFloat(e.target.value) || 0, tSpan[1]])}
                    className="w-full rounded-md border px-2 py-1 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">t₁</span>
                  <input
                    type="number"
                    value={tSpan[1]}
                    onChange={(e) => setTSpan([tSpan[0], parseFloat(e.target.value) || 10])}
                    className="w-full rounded-md border px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>

            <Button onClick={runSimulation} disabled={isSimulating} className="w-full">
              {isSimulating ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
              Simuler
            </Button>
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualisation</CardTitle>
            <CardDescription>Trajectoires et portrait de phase</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trajectory">
              <TabsList className="mb-4">
                <TabsTrigger value="trajectory">Trajectoire</TabsTrigger>
                <TabsTrigger value="phase">Portrait de Phase</TabsTrigger>
                {!is3D && <TabsTrigger value="time">Évolution temporelle</TabsTrigger>}
              </TabsList>

              <TabsContent value="trajectory" className="h-[400px]">
                {simulation && simulation.solution?.length ? (
                  <PlotErrorBoundary fallbackTitle="Erreur d'affichage Plotly (Trajectoire)">
                    <Plot
                      data={[
                        {
                          x: simulation.solution.map((s) => s[0]),
                          y: simulation.solution.map((s) => s[1]),
                          z: is3D ? simulation.solution.map((s) => s[2]) : undefined,
                          type: is3D ? 'scatter3d' : 'scatter',
                          mode: 'lines',
                          line: { color: '#3b82f6', width: 2 },
                          name: 'Trajectoire',
                        },
                        {
                          x: [simulation.solution[0][0]],
                          y: [simulation.solution[0][1]],
                          z: is3D ? [simulation.solution[0][2]] : undefined,
                          type: is3D ? 'scatter3d' : 'scatter',
                          mode: 'markers',
                          marker: { color: '#22c55e', size: 10 },
                          name: 'Début',
                        },
                      ]}
                      layout={{
                        title: is3D ? 'Trajectoire 3D' : 'Portrait de Phase',
                        xaxis: { title: 'x₁' },
                        yaxis: { title: 'x₂' },
                        scene: is3D
                          ? {
                              xaxis: { title: 'x' },
                              yaxis: { title: 'y' },
                              zaxis: { title: 'z' },
                            }
                          : undefined,
                        autosize: true,
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </PlotErrorBoundary>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="phase" className="h-[400px]">
                {phasePortrait ? (
                  <PlotErrorBoundary fallbackTitle="Erreur d'affichage Plotly (Portrait de phase)">
                    <Plot
                      data={(() => {
                        const { xs, ys } = buildVectorFieldSegments(
                          phasePortrait.X,
                          phasePortrait.Y,
                          phasePortrait.U_norm,
                          phasePortrait.V_norm,
                          0.25
                        );
                        return [
                          {
                            x: xs,
                            y: ys,
                            type: 'scatter' as const,
                            mode: 'lines' as const,
                            line: { color: '#3b82f6', width: 1 },
                            name: 'Champ de vecteurs',
                            hoverinfo: 'skip' as const,
                          },
                          ...(simulation && simulation.solution?.length
                            ? [
                                {
                                  x: simulation.solution.map((s) => s[0]),
                                  y: simulation.solution.map((s) => s[1]),
                                  type: 'scatter' as const,
                                  mode: 'lines' as const,
                                  line: { color: '#ef4444', width: 2 },
                                  name: 'Trajectoire',
                                },
                              ]
                            : []),
                        ];
                      })()}
                      layout={{
                        title: 'Portrait de Phase avec Champ de Vecteurs',
                        xaxis: { title: 'x₁', range: [-3, 3] },
                        yaxis: { title: 'x₂', range: [-3, 3], scaleanchor: 'x' },
                        autosize: true,
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </PlotErrorBoundary>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="time" className="h-[400px]">
                {simulation && !is3D ? (
                  <Plot
                    data={[
                      {
                        x: simulation.t,
                        y: simulation.solution.map((s) => s[0]),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'x₁(t)',
                        line: { color: '#3b82f6' },
                      },
                      {
                        x: simulation.t,
                        y: simulation.solution.map((s) => s[1]),
                        type: 'scatter',
                        mode: 'lines',
                        name: 'x₂(t)',
                        line: { color: '#ef4444' },
                      },
                    ]}
                    layout={{
                      title: 'Évolution temporelle',
                      xaxis: { title: 't' },
                      yaxis: { title: 'x' },
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Non disponible pour les systèmes 3D
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Oscillateur Harmonique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Modèle fondamental en physique décrivant les oscillations autour d'une position d'équilibre.
              Le paramètre γ contrôle l'amortissement.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotka-Volterra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Modèle classique d'interaction proie-prédateur. Les solutions périodiques
              montrent les cycles de population.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Système de Lorenz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Système chaotique célèbre pour son attracteur en forme de papillon.
              Grande sensibilité aux conditions initiales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
