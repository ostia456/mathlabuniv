import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { gtApi } from '@/services/api';
import { type GraphAlgorithmResult } from '@/types';
import { Play, RefreshCw } from 'lucide-react';

interface GraphState {
  nodes: { id: number; neighbors: [number, number][] }[];
  numNodes: number;
}

export function GraphTheoryPage() {
  const [numNodes, setNumNodes] = useState(5);
  const [graph, setGraph] = useState<GraphState>({
    nodes: [
      { id: 0, neighbors: [[1, 4], [2, 1]] },
      { id: 1, neighbors: [[3, 1]] },
      { id: 2, neighbors: [[1, 2], [3, 5]] },
      { id: 3, neighbors: [[4, 3]] },
      { id: 4, neighbors: [] },
    ],
    numNodes: 5,
  });
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [startNode, setStartNode] = useState(0);
  const [endNode, setEndNode] = useState(4);
  const [result, setResult] = useState<GraphAlgorithmResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Calculate node positions in a circle
  const getNodePosition = (id: number, total: number) => {
    const angle = (id * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 150;
    const centerX = 200;
    const centerY = 200;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const runAlgorithm = useCallback(async () => {
    setIsLoading(true);
    setCurrentStep(0);
    try {
      const adjList: Record<string, [number, number][]> = {};
      graph.nodes.forEach((n) => {
        adjList[n.id] = n.neighbors;
      });

      let data;
      switch (algorithm) {
        case 'dijkstra':
          data = await gtApi.dijkstra({
            adjacency_list: adjList,
            start: startNode,
            end: endNode,
          });
          break;
        case 'bfs':
          data = await gtApi.bfs({
            adjacency_list: adjList,
            start: startNode,
          });
          break;
        case 'dfs':
          data = await gtApi.dfs({
            adjacency_list: adjList,
            start: startNode,
          });
          break;
        default:
          data = await gtApi.dijkstra({
            adjacency_list: adjList,
            start: startNode,
            end: endNode,
          });
      }
      setResult(data);
    } catch (error) {
      console.error('Algorithm failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, graph, startNode, endNode]);

  const generateGraph = async (type: string) => {
    try {
      const data = await gtApi.generate({
        type: type as any,
        num_nodes: numNodes,
        edge_probability: 0.4,
        weighted: true,
      });

      const newGraph: GraphState = {
        nodes: data.adjacency_list.map((neighbors: [number, number][], id: number) => ({
          id,
          neighbors,
        })),
        numNodes: data.num_nodes,
      };
      setGraph(newGraph);
      setResult(null);
      setCurrentStep(0);
    } catch (error) {
      console.error('Graph generation failed:', error);
    }
  };

  const playAnimation = () => {
    if (!result?.steps) return;
    setIsPlaying(true);
    setCurrentStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= result.steps.length) {
        clearInterval(interval);
        setIsPlaying(false);
      } else {
        setCurrentStep(step);
      }
    }, 1000);
  };

  const getNodeColor = (nodeId: number) => {
    if (!result?.steps || currentStep >= result.steps.length) return '#fff';
    const step = result.steps[currentStep];
    if (step.current === nodeId || step.current_node === nodeId) return '#ef4444';
    if (step.visited?.includes(nodeId)) return '#22c55e';
    return '#fff';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Théorie des Graphes</h1>
        <p className="text-muted-foreground">
          Visualisation des algorithmes de parcours et plus courts chemins
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Définissez le graphe et l'algorithme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Graph Generation */}
            <div className="space-y-2">
              <Label>Générer un graphe</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => generateGraph('random')}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Aléatoire
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateGraph('tree')}>
                  Arbre
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateGraph('complete')}>
                  Complet
                </Button>
                <Button variant="outline" size="sm" onClick={() => generateGraph('bipartite')}>
                  Biparti
                </Button>
              </div>
            </div>

            {/* Number of Nodes */}
            <div className="space-y-2">
              <Label>Nombre de nœuds</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={numNodes}
                onChange={(e) => setNumNodes(parseInt(e.target.value) || 5)}
              />
            </div>

            {/* Algorithm Selection */}
            <div className="space-y-2">
              <Label>Algorithme</Label>
              <Select value={algorithm} onValueChange={setAlgorithm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dijkstra">Dijkstra</SelectItem>
                  <SelectItem value="bfs">BFS (Largeur)</SelectItem>
                  <SelectItem value="dfs">DFS (Profondeur)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start/End Nodes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nœud départ</Label>
                <Input
                  type="number"
                  min={0}
                  max={graph.numNodes - 1}
                  value={startNode}
                  onChange={(e) => setStartNode(parseInt(e.target.value) || 0)}
                />
              </div>
              {algorithm === 'dijkstra' && (
                <div className="space-y-2">
                  <Label>Nœud arrivée</Label>
                  <Input
                    type="number"
                    min={0}
                    max={graph.numNodes - 1}
                    value={endNode}
                    onChange={(e) => setEndNode(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <Button onClick={runAlgorithm} disabled={isLoading} className="w-full">
              {isLoading ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
              Exécuter
            </Button>

            {result?.steps && (
              <Button onClick={playAnimation} disabled={isPlaying} variant="outline" className="w-full">
                {isPlaying ? 'Animation...' : 'Animer'}
              </Button>
            )}

            {/* Results */}
            {result && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <Label className="text-xs">Résultats</Label>
                {result.path && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Chemin:</span>{' '}
                    {result.path.join(' → ')}
                  </div>
                )}
                {result.distances && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Distance:</span>{' '}
                    {result.distances[endNode] === Infinity
                      ? '∞'
                      : result.distances[endNode]}
                  </div>
                )}
                {result.traversal_order && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ordre:</span>{' '}
                    {result.traversal_order.join(' → ')}
                  </div>
                )}
              </div>
            )}

            {/* Step Control */}
            {result?.steps && result.steps.length > 0 && (
              <div className="space-y-2">
                <Label>Étape {currentStep + 1} / {result.steps.length}</Label>
                <input
                  type="range"
                  min={0}
                  max={result.steps.length - 1}
                  value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualisation du Graphe</CardTitle>
            <CardDescription>Représentation interactive du graphe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] border rounded-lg flex items-center justify-center bg-gray-50">
              <svg width="400" height="400" viewBox="0 0 400 400">
                {/* Edges */}
                {graph.nodes.map((node) =>
                  node.neighbors.map(([neighborId, weight]) => {
                    const start = getNodePosition(node.id, graph.numNodes);
                    const end = getNodePosition(neighborId, graph.numNodes);
                    return (
                      <g key={`${node.id}-${neighborId}`}>
                        <line
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                        <text
                          x={(start.x + end.x) / 2}
                          y={(start.y + end.y) / 2}
                          fill="#3b82f6"
                          fontSize="12"
                          textAnchor="middle"
                        >
                          {weight}
                        </text>
                      </g>
                    );
                  })
                )}
                
                {/* Nodes */}
                {graph.nodes.map((node) => {
                  const pos = getNodePosition(node.id, graph.numNodes);
                  return (
                    <g key={node.id}>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="20"
                        fill={getNodeColor(node.id)}
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <text
                        x={pos.x}
                        y={pos.y}
                        dy="0.35em"
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white" />
                <span>Non visité</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-green-500" />
                <span>Visité</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-red-500" />
                <span>En cours</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Algorithm Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dijkstra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Algorithme de plus court chemin pour les graphes pondérés avec poids positifs.
              Utilise une file de priorité pour sélectionner le nœud le plus proche.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">BFS (Breadth-First Search)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Parcours en largeur qui explore tous les voisins avant de passer au niveau suivant.
              Trouve le chemin le plus court en nombre d'arêtes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">DFS (Depth-First Search)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Parcours en profondeur qui explore aussi loin que possible avant de revenir en arrière.
              Utilise une pile (LIFO) pour gérer les nœuds à visiter.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
