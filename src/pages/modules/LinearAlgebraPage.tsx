import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { laApi } from '@/services/api';
import { type MatrixTransformation, type SVDResult } from '@/types';
import Plot from 'react-plotly.js';
import { Play } from 'lucide-react';

const presetMatrices = {
  identity: { name: 'Identité', matrix: [[1, 0], [0, 1]] },
  scaling: { name: 'Homothétie', matrix: [[2, 0], [0, 2]] },
  rotation: { name: 'Rotation 45°', matrix: [[0.707, -0.707], [0.707, 0.707]] },
  shear: { name: 'Cisaillement', matrix: [[1, 1], [0, 1]] },
  reflection: { name: 'Réflexion', matrix: [[1, 0], [0, -1]] },
};

export function LinearAlgebraPage() {
  const [matrix, setMatrix] = useState<number[][]>([[2, 1], [1, 2]]);
  const [transformation, setTransformation] = useState<MatrixTransformation | null>(null);
  const [svdResult, setSvdResult] = useState<SVDResult | null>(null);
  const [eigenResult, setEigenResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transform');

  const runTransformation = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await laApi.visualizeGrid({ matrix, grid_size: 5 });
      setTransformation(result);
    } catch (error) {
      console.error('Transformation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matrix]);

  const runSVD = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await laApi.svd({ matrix });
      setSvdResult(result);
    } catch (error) {
      console.error('SVD failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matrix]);

  const runEigen = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await laApi.eigen({ matrix });
      setEigenResult(result);
    } catch (error) {
      console.error('Eigen decomposition failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [matrix]);

  const handleMatrixChange = (i: number, j: number, value: string) => {
    const newMatrix = matrix.map((row) => [...row]);
    newMatrix[i][j] = parseFloat(value) || 0;
    setMatrix(newMatrix);
  };

  const loadPreset = (preset: string) => {
    const presetMatrix = presetMatrices[preset as keyof typeof presetMatrices];
    if (presetMatrix) {
      setMatrix(presetMatrix.matrix.map((row) => [...row]));
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'transform' && !transformation) {
      runTransformation();
    } else if (tab === 'svd' && !svdResult) {
      runSVD();
    } else if (tab === 'eigen' && !eigenResult) {
      runEigen();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Algèbre Linéaire</h1>
        <p className="text-muted-foreground">
          Visualisation des transformations linéaires, SVD, et valeurs propres
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Matrice</CardTitle>
            <CardDescription>Définissez la matrice de transformation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div className="space-y-2">
              <Label>Presets</Label>
              <Select onValueChange={loadPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une matrice" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presetMatrices).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Matrix Input */}
            <div className="space-y-2">
              <Label>Matrice 2×2</Label>
              <div className="grid grid-cols-2 gap-2">
                {matrix.map((row, i) =>
                  row.map((val, j) => (
                    <Input
                      key={`${i}-${j}`}
                      type="number"
                      value={val}
                      onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                      step={0.1}
                      className="text-center font-mono"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={runTransformation} disabled={isLoading} className="w-full">
                {isLoading ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
                Visualiser transformation
              </Button>
              <Button onClick={runSVD} disabled={isLoading} variant="outline" className="w-full">
                Calculer SVD
              </Button>
              <Button onClick={runEigen} disabled={isLoading} variant="outline" className="w-full">
                Valeurs propres
              </Button>
            </div>

            {/* Properties */}
            {transformation?.properties && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <Label className="text-xs">Propriétés</Label>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Déterminant:</span>
                    <span className="font-mono">{transformation.properties.determinant.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rang:</span>
                    <span className="font-mono">{transformation.properties.rank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="font-mono">{transformation.properties.condition_number.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inversible:</span>
                    <span>{transformation.properties.is_invertible ? 'Oui' : 'Non'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualisation</CardTitle>
            <CardDescription>Transformation du plan et décompositions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="transform">Transformation</TabsTrigger>
                <TabsTrigger value="svd">SVD</TabsTrigger>
                <TabsTrigger value="eigen">Valeurs Propres</TabsTrigger>
              </TabsList>

              <TabsContent value="transform" className="h-[400px]">
                {transformation ? (
                  <Plot
                    data={[
                      // Original grid
                      ...transformation.horizontal_lines_original.map((line, i) => ({
                        x: [line[0][0], line[1][0]],
                        y: [line[0][1], line[1][1]],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        line: { color: '#94a3b8', width: 1 },
                        showlegend: i === 0,
                        name: 'Original',
                        hoverinfo: 'skip',
                      })),
                      ...transformation.vertical_lines_original.map((line) => ({
                        x: [line[0][0], line[1][0]],
                        y: [line[0][1], line[1][1]],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        line: { color: '#94a3b8', width: 1 },
                        showlegend: false,
                        hoverinfo: 'skip',
                      })),
                      // Transformed grid
                      ...transformation.horizontal_lines_transformed.map((line, i) => ({
                        x: [line[0][0], line[1][0]],
                        y: [line[0][1], line[1][1]],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        line: { color: '#3b82f6', width: 2 },
                        showlegend: i === 0,
                        name: 'Transformé',
                        hoverinfo: 'skip',
                      })),
                      ...transformation.vertical_lines_transformed.map((line) => ({
                        x: [line[0][0], line[1][0]],
                        y: [line[0][1], line[1][1]],
                        type: 'scatter' as const,
                        mode: 'lines' as const,
                        line: { color: '#3b82f6', width: 2 },
                        showlegend: false,
                        hoverinfo: 'skip',
                      })),
                      // Unit vectors
                      {
                        x: [0, transformation.unit_vectors_transformed[0][0]],
                        y: [0, transformation.unit_vectors_transformed[0][1]],
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { color: '#ef4444', width: 3 },
                        marker: { size: 8 },
                        name: 'e₁ transformé',
                      },
                      {
                        x: [0, transformation.unit_vectors_transformed[1][0]],
                        y: [0, transformation.unit_vectors_transformed[1][1]],
                        type: 'scatter',
                        mode: 'lines+markers',
                        line: { color: '#22c55e', width: 3 },
                        marker: { size: 8 },
                        name: 'e₂ transformé',
                      },
                    ]}
                    layout={{
                      title: 'Transformation du plan',
                      xaxis: { title: 'x', scaleanchor: 'y', range: [-10, 10] },
                      yaxis: { title: 'y', range: [-10, 10] },
                      autosize: true,
                      margin: { l: 50, r: 50, t: 50, b: 50 },
                      legend: { orientation: 'h', y: -0.2 },
                    }}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="svd" className="h-[400px]">
                {svdResult ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Plot
                      data={[
                        {
                          x: svdResult.steps.original[0],
                          y: svdResult.steps.original[1],
                          type: 'scatter',
                          mode: 'lines',
                          fill: 'toself',
                          fillcolor: 'rgba(59, 130, 246, 0.2)',
                          line: { color: '#3b82f6' },
                          name: 'Original',
                        },
                      ]}
                      layout={{
                        title: '1. Original',
                        xaxis: { scaleanchor: 'y', range: [-2, 2] },
                        yaxis: { range: [-2, 2] },
                        autosize: true,
                        margin: { l: 30, r: 30, t: 40, b: 30 },
                      }}
                      style={{ width: '100%', height: '180px' }}
                    />
                    <Plot
                      data={[
                        {
                          x: svdResult.steps.after_Vt[0],
                          y: svdResult.steps.after_Vt[1],
                          type: 'scatter',
                          mode: 'lines',
                          fill: 'toself',
                          fillcolor: 'rgba(34, 197, 94, 0.2)',
                          line: { color: '#22c55e' },
                          name: 'V^T · x',
                        },
                      ]}
                      layout={{
                        title: '2. Rotation V^T',
                        xaxis: { scaleanchor: 'y', range: [-2, 2] },
                        yaxis: { range: [-2, 2] },
                        autosize: true,
                        margin: { l: 30, r: 30, t: 40, b: 30 },
                      }}
                      style={{ width: '100%', height: '180px' }}
                    />
                    <Plot
                      data={[
                        {
                          x: svdResult.steps.after_Sigma[0],
                          y: svdResult.steps.after_Sigma[1],
                          type: 'scatter',
                          mode: 'lines',
                          fill: 'toself',
                          fillcolor: 'rgba(245, 158, 11, 0.2)',
                          line: { color: '#f59e0b' },
                          name: 'Σ · V^T · x',
                        },
                      ]}
                      layout={{
                        title: '3. Étalage Σ',
                        xaxis: { scaleanchor: 'y', range: [-5, 5] },
                        yaxis: { range: [-5, 5] },
                        autosize: true,
                        margin: { l: 30, r: 30, t: 40, b: 30 },
                      }}
                      style={{ width: '100%', height: '180px' }}
                    />
                    <Plot
                      data={[
                        {
                          x: svdResult.steps.after_U[0],
                          y: svdResult.steps.after_U[1],
                          type: 'scatter',
                          mode: 'lines',
                          fill: 'toself',
                          fillcolor: 'rgba(239, 68, 68, 0.2)',
                          line: { color: '#ef4444' },
                          name: 'U · Σ · V^T · x',
                        },
                      ]}
                      layout={{
                        title: '4. Rotation U',
                        xaxis: { scaleanchor: 'y', range: [-5, 5] },
                        yaxis: { range: [-5, 5] },
                        autosize: true,
                        margin: { l: 30, r: 30, t: 40, b: 30 },
                      }}
                      style={{ width: '100%', height: '180px' }}
                    />
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="eigen" className="h-[400px]">
                {eigenResult ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <Plot
                      data={[
                        {
                          x: [0, 1, 0, -1, 0],
                          y: [1, 0, -1, 0, 1],
                          type: 'scatter',
                          mode: 'lines',
                          fill: 'toself',
                          fillcolor: 'rgba(59, 130, 246, 0.1)',
                          line: { color: '#3b82f6' },
                          name: 'Cercle unité',
                        },
                        ...eigenResult.eigenvalues.map((ev: any, i: number) => {
                          const vec = eigenResult.eigenvectors[i];
                          return {
                            x: [0, vec[0] * 2],
                            y: [0, vec[1] * 2],
                            type: 'scatter',
                            mode: 'lines+markers',
                            line: { color: ['#ef4444', '#22c55e'][i], width: 3 },
                            marker: { size: 8 },
                            name: `v${i + 1} (λ=${complex(ev.value).toFixed(2)})`,
                          };
                        }),
                      ]}
                      layout={{
                        title: 'Vecteurs propres',
                        xaxis: { scaleanchor: 'y', range: [-3, 3] },
                        yaxis: { range: [-3, 3] },
                        autosize: true,
                        margin: { l: 50, r: 50, t: 50, b: 50 },
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div className="space-y-4">
                      <h4 className="font-semibold">Valeurs propres</h4>
                      {eigenResult.eigenvalues.map((ev: any, i: number) => (
                        <div key={i} className="rounded-lg bg-muted p-3">
                          <div className="font-mono text-sm">
                            λ{i + 1} = {complex(ev.value).toFixed(4)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Stabilité: {ev.stability}
                          </div>
                        </div>
                      ))}
                      <div className="pt-4 border-t">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Trace:</span>{' '}
                          {eigenResult.trace.toFixed(4)}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Déterminant:</span>{' '}
                          {eigenResult.determinant.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Spinner />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function complex(c: { real: number; imag: number } | number): number {
  if (typeof c === 'number') return c;
  return c.real;
}
