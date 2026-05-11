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
import { Play, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────
// Error Boundary pour capturer les crash Plotly
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Construction du champ de vecteurs (segments)
// ─────────────────────────────────────────────
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
      xs.push(x0, x0 + U[i][j] * scale, null);
      ys.push(y0, y0 + V[i][j] * scale, null);
    }
  }
  return { xs, ys };
}

// ─────────────────────────────────────────────
// Paramètres de slider par clé
// ─────────────────────────────────────────────
// FIX : certains paramètres (rho, g) dépassaient le max=10 par défaut
const PARAM_RANGES: Record<string, { min: number; max: number; step: number }> = {
  omega:   { min: 0.01, max: 10,  step: 0.01 },
  gamma:   { min: 0.01, max: 10,  step: 0.01 },
  alpha:   { min: 0.01, max: 5,   step: 0.01 },
  beta:    { min: 0.001, max: 1,  step: 0.001 },
  delta:   { min: 0.001, max: 1,  step: 0.001 },
  sigma:   { min: 0.1,  max: 20,  step: 0.1  },
  rho:     { min: 0.1,  max: 50,  step: 0.1  },  // FIX : rho Lorenz = 28, max était 10
  mu:      { min: 0.01, max: 5,   step: 0.01 },
  g:       { min: 0.1,  max: 20,  step: 0.1  },
  L:       { min: 0.1,  max: 5,   step: 0.1  },
  damping: { min: 0.0,  max: 2,   step: 0.01 },
};

function getRange(key: string) {
  return PARAM_RANGES[key] ?? { min: 0.01, max: 10, step: 0.01 };
}

// ─────────────────────────────────────────────
// Systèmes par défaut
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// Layout Plotly commun
// ─────────────────────────────────────────────
// Plotly : autosize + useResizeHandler → remplit le conteneur, centré
const PLOT_STYLE = { width: '100%', height: '100%' };
const PLOT_LAYOUT_BASE = {
  autosize: true,
  margin: { l: 55, r: 30, t: 45, b: 55 },
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
};

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────
export function DynamicalSystemsPage() {
  const [selectedSystem, setSelectedSystem] = useState<string>('harmonic_oscillator');
  const [params, setParams] = useState<Record<string, number>>(
    defaultSystems.harmonic_oscillator.params
  );
  const [initialState, setInitialState] = useState<number[]>([1.0, 0.0]);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [phasePortrait, setPhasePortrait] = useState<PhasePortraitData | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tSpan, setTSpan] = useState<[number, number]>([0, 20]);
  // FIX : états d'erreur visibles
  const [simError, setSimError] = useState<string | null>(null);
  const [phaseError, setPhaseError] = useState<string | null>(null);

  const is3D = selectedSystem === 'lorenz';

  // ── Simulation ──
  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    setSimError(null);
    try {
      const result = await dsApi.simulate({
        system: selectedSystem,
        params,
        initial_state: initialState,
        t_span: tSpan,
        dt: 0.01,
      });
      if (!result) throw new Error("L'API n'a retourné aucune donnée.");
      setSimulation(result);
    } catch (err: any) {
      console.error('Simulation failed:', err);
      setSimError(err?.message ?? 'Erreur lors de la simulation.');
      setSimulation(null);
    } finally {
      setIsSimulating(false);
    }
  }, [selectedSystem, params, initialState, tSpan]);

  // ── Portrait de phase (2D uniquement) ──
  // FIX : on ne tente PAS le portrait de phase pour les systèmes 3D (Lorenz)
  const runPhasePortrait = useCallback(async () => {
    if (is3D) {
      setPhasePortrait(null);
      return;
    }
    setPhaseError(null);
    try {
      const result = await dsApi.getPhasePortrait({
        system: selectedSystem,
        params,
        x_range: [-3, 3],
        y_range: [-3, 3],
        grid_size: 20,
      });
      if (!result) throw new Error("L'API n'a retourné aucune donnée.");
      setPhasePortrait(result);
    } catch (err: any) {
      console.error('Phase portrait failed:', err);
      setPhaseError(err?.message ?? 'Erreur lors du calcul du portrait de phase.');
      setPhasePortrait(null);
    }
  }, [selectedSystem, params, is3D]);

  // FIX : on sépare le premier chargement du re-run automatique sur changement
  // pour éviter les appels en boucle infinie avec useCallback + useEffect
  useEffect(() => {
    runSimulation();
    runPhasePortrait();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // montage uniquement

  const handleSystemChange = (systemId: string) => {
    setSelectedSystem(systemId);
    setParams(defaultSystems[systemId].params);
    setInitialState(systemId === 'lorenz' ? [1.0, 1.0, 1.0] : [1.0, 0.0]);
    setSimulation(null);
    setPhasePortrait(null);
    setSimError(null);
    setPhaseError(null);
  };

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const system = defaultSystems[selectedSystem];

  // ─────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Systèmes Dynamiques</h1>
        <p className="text-muted-foreground">
          Simulation d'équations différentielles ordinaires et analyse de portraits de phase
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Panneau de configuration ── */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Configurez le système et les conditions initiales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection du système */}
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

            {/* Équations */}
            <div className="rounded-lg bg-muted p-3">
              <Label className="text-xs">Équations</Label>
              <div className="mt-1 space-y-1 font-mono text-sm">
                {system.equations.map((eq, i) => (
                  <div key={i}>{eq}</div>
                ))}
              </div>
            </div>

            {/* Paramètres — FIX : plages correctes par clé */}
            <div className="space-y-4">
              <Label>Paramètres du système</Label>
              {Object.entries(params).map(([key, value]) => {
                const range = getRange(key);
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">{key}</span>
                      <span className="text-sm text-muted-foreground">{value.toFixed(3)}</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => handleParamChange(key, v)}
                      min={range.min}
                      max={range.max}
                      step={range.step}
                    />
                  </div>
                );
              })}
            </div>

            {/* Conditions initiales */}
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

            {/* Intervalle de temps */}
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

            {/* FIX : erreur simulation visible */}
            {simError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{simError}</span>
              </div>
            )}

            <Button
              onClick={() => { runSimulation(); runPhasePortrait(); }}
              disabled={isSimulating}
              className="w-full"
            >
              {isSimulating ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
              Simuler
            </Button>
          </CardContent>
        </Card>

        {/* ── Panneau de visualisation ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualisation</CardTitle>
            <CardDescription>Trajectoires et portrait de phase</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trajectory">
              <TabsList className="mb-4">
                <TabsTrigger value="trajectory">Trajectoire</TabsTrigger>
                {!is3D && <TabsTrigger value="phase">Portrait de Phase</TabsTrigger>}
                {!is3D && <TabsTrigger value="time">Évolution temporelle</TabsTrigger>}
              </TabsList>

              {/* ── Onglet Trajectoire ── */}
              <TabsContent value="trajectory">
                {/* FIX : hauteur fixe sur le conteneur, pas h-[400px] avec height:100% */}
                <div style={{ height: 400, width: "100%", position: "relative" }}>
                  {isSimulating ? (
                    <div className="flex h-full items-center justify-center">
                      <Spinner />
                    </div>
                  ) : simError ? (
                    <div className="flex h-full items-center justify-center text-sm text-red-500 gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {simError}
                    </div>
                  ) : simulation && simulation.solution?.length ? (
                    <PlotErrorBoundary fallbackTitle="Erreur d'affichage Plotly (Trajectoire)">
                      <Plot
                        data={[
                          {
                            x: simulation.solution.map((s) => s[0]),
                            y: simulation.solution.map((s) => s[1]),
                            ...(is3D ? { z: simulation.solution.map((s) => s[2]) } : {}),
                            type: is3D ? 'scatter3d' : ('scatter' as any),
                            mode: 'lines',
                            line: { color: '#3b82f6', width: 2 },
                            name: 'Trajectoire',
                          },
                          {
                            x: [simulation.solution[0][0]],
                            y: [simulation.solution[0][1]],
                            ...(is3D ? { z: [simulation.solution[0][2]] } : {}),
                            type: is3D ? 'scatter3d' : ('scatter' as any),
                            mode: 'markers',
                            marker: { color: '#22c55e', size: 10 },
                            name: 'Début',
                          },
                        ]}
                        layout={{
                          ...PLOT_LAYOUT_BASE,
                          title: { text: is3D ? 'Trajectoire 3D' : 'Portrait de Phase', font: { size: 14 } },
                          xaxis: { title: 'x₁' },
                          yaxis: { title: 'x₂' },
                          ...(is3D
                            ? {
                                scene: {
                                  xaxis: { title: 'x' },
                                  yaxis: { title: 'y' },
                                  zaxis: { title: 'z' },
                                },
                              }
                            : {}),
                        }}
                        style={PLOT_STYLE}
                        config={{ responsive: true, displayModeBar: true, modeBarButtonsToRemove: ["sendDataToCloud", "editInChartStudio"], toImageButtonOptions: { format: "png", filename: "simulation" } }}
                        useResizeHandler
                      />
                    </PlotErrorBoundary>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Cliquez sur "Simuler" pour lancer la simulation.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Onglet Portrait de Phase (2D uniquement) ── */}
              {!is3D && (
                <TabsContent value="phase">
                  <div style={{ height: 400, width: "100%", position: "relative" }}>
                    {phaseError ? (
                      <div className="flex h-full items-center justify-center text-sm text-red-500 gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {phaseError}
                      </div>
                    ) : phasePortrait ? (
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
                              ...(simulation?.solution?.length
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
                            ...PLOT_LAYOUT_BASE,
                            title: { text: 'Portrait de Phase', font: { size: 14 } },
                            xaxis: { title: 'x₁', range: [-3, 3] },
                            yaxis: { title: 'x₂', range: [-3, 3], scaleanchor: 'x' },
                          }}
                          style={PLOT_STYLE}
                          config={{ responsive: true, displayModeBar: true, modeBarButtonsToRemove: ["sendDataToCloud", "editInChartStudio"], toImageButtonOptions: { format: "png", filename: "simulation" } }}
                          useResizeHandler
                        />
                      </PlotErrorBoundary>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Spinner />
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {/* ── Onglet Évolution temporelle (2D uniquement) ── */}
              {!is3D && (
                <TabsContent value="time">
                  <div style={{ height: 400, width: "100%", position: "relative" }}>
                    {isSimulating ? (
                      <div className="flex h-full items-center justify-center">
                        <Spinner />
                      </div>
                    ) : simError ? (
                      <div className="flex h-full items-center justify-center text-sm text-red-500 gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {simError}
                      </div>
                    ) : simulation ? (
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
                          ...PLOT_LAYOUT_BASE,
                          title: { text: 'Évolution temporelle', font: { size: 14 } },
                          xaxis: { title: 't' },
                          yaxis: { title: 'x' },
                        }}
                        style={PLOT_STYLE}
                        config={{ responsive: true, displayModeBar: true, modeBarButtonsToRemove: ["sendDataToCloud", "editInChartStudio"], toImageButtonOptions: { format: "png", filename: "simulation" } }}
                        useResizeHandler
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Cliquez sur "Simuler" pour lancer la simulation.
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ── Cartes info ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Oscillateur Harmonique</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Modèle fondamental en physique décrivant les oscillations autour d'une position
              d'équilibre. Le paramètre γ contrôle l'amortissement.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lotka-Volterra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Modèle classique d'interaction proie-prédateur. Les solutions périodiques montrent
              les cycles de population.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Système de Lorenz</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Système chaotique célèbre pour son attracteur en forme de papillon. Grande
              sensibilité aux conditions initiales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
