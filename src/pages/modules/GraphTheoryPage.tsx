import { useState, useCallback } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { gtApi } from '@/services/api';
import { type GraphAlgorithmResult } from '@/types';
import { Play, RefreshCw, AlertCircle } from 'lucide-react';


interface GraphState {
  nodes: { id: number; neighbors: [number, number][] }[];
  numNodes: number;
}

// Génère un graphe linéaire simple : 0→1→2→...→n-1 avec poids aléatoires
function buildDefaultGraph(n: number): GraphState {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: i,
    neighbors:
      i < n - 1
        ? ([[i + 1, Math.floor(Math.random() * 9) + 1]] as [number, number][])
        : ([] as [number, number][]),
  }));
  return { nodes, numNodes: n };
}

// Recadre une valeur dans [0, max]
function clamp(val: number, max: number): number {
  return Math.min(Math.max(0, val), max);
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
  const [error, setError] = useState<string | null>(null);

  // ---------- Positions des nœuds en cercle ----------
  const getNodePosition = (id: number, total: number) => {
    const angle = (id * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 150;
    return {
      x: 200 + radius * Math.cos(angle),
      y: 200 + radius * Math.sin(angle),
    };
  };

  // ---------- Changement du nombre de nœuds ----------
  // FIX : on reconstruit immédiatement le graphe quand numNodes change
  const handleNumNodesChange = (val: string) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 2 || n > 10) return;

    setNumNodes(n);

    const newGraph = buildDefaultGraph(n);
    setGraph(newGraph);

    // Recadrage des nœuds départ/arrivée
    setStartNode((prev) => clamp(prev, n - 1));
    setEndNode((prev) => clamp(prev, n - 1));

    setResult(null);
    setCurrentStep(0);
    setError(null);
  };

  // ---------- Normalise adjacency_list quel que soit le format retourné par l'API ----------
  // L'API peut retourner :
  //   - un tableau  : [ [[1,4],[2,1]], [[3,1]], ... ]
  //   - un objet    : { "0": [[1,4],[2,1]], "1": [[3,1]], ... }
  function normalizeAdjacencyList(
    raw: any,
    n: number
  ): [number, number][][] {
    if (Array.isArray(raw)) {
      // Déjà un tableau indexé
      return raw as [number, number][][];
    }
    if (raw && typeof raw === 'object') {
      // Objet → on reconstruit le tableau dans l'ordre des clés numériques
      return Array.from({ length: n }, (_, i) => (raw[String(i)] ?? raw[i] ?? []) as [number, number][]);
    }
    return Array.from({ length: n }, () => []);
  }

  // ---------- Génération via l'API ----------
  const generateGraph = async (type: string) => {
    setError(null);
    try {
      const data = await gtApi.generate({
        type: type as any,
        num_nodes: numNodes,
        edge_probability: 0.4,
        weighted: true,
      });

      if (!data || !data.adjacency_list) {
        setError("La génération du graphe n'a retourné aucune donnée.");
        return;
      }

      const newNumNodes: number = data.num_nodes ?? numNodes;

      // FIX : normalise le format avant d'appeler .map()
      const adjArray = normalizeAdjacencyList(data.adjacency_list, newNumNodes);

      const newGraph: GraphState = {
        nodes: adjArray.map((neighbors, id) => ({ id, neighbors })),
        numNodes: newNumNodes,
      };

      setGraph(newGraph);
      setNumNodes(newNumNodes);

      // Recadrage des nœuds départ/arrivée
      setStartNode((prev) => clamp(prev, newNumNodes - 1));
      setEndNode((prev) => clamp(prev, newNumNodes - 1));

      setResult(null);
      setCurrentStep(0);
    } catch (err: any) {
      console.error('Graph generation failed:', err);
      setError(err?.message || 'Erreur lors de la génération du graphe.');
    }
  };

  // ---------- Exécution de l'algorithme ----------
  const runAlgorithm = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setCurrentStep(0);

    // Validation des nœuds avant l'appel API
    if (startNode >= graph.numNodes) {
      setError(`Nœud départ ${startNode} invalide (max ${graph.numNodes - 1})`);
      setIsLoading(false);
      return;
    }
    if (algorithm === 'dijkstra' && endNode >= graph.numNodes) {
      setError(`Nœud arrivée ${endNode} invalide (max ${graph.numNodes - 1})`);
      setIsLoading(false);
      return;
    }

    try {
      const adjList: Record<string, [number, number][]> = {};
      graph.nodes.forEach((n) => {
        adjList[n.id] = n.neighbors;
      });

      let data: GraphAlgorithmResult | undefined;

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

      if (!data) {
        setError("L'API n'a retourné aucune donnée. Vérifiez que le serveur est démarré.");
        return;
      }

      setResult(data);
    } catch (err: any) {
      console.error('Algorithm failed:', err);
      setError(
        err?.message ||
          "Erreur lors de l'exécution. Vérifiez que le serveur backend est disponible."
      );
    } finally {
      setIsLoading(false);
    }
  }, [algorithm, graph, startNode, endNode]);

  // ---------- Animation ----------
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

  // ---------- Couleur des nœuds selon l'algorithme et l'étape ----------
  const getNodeColor = (nodeId: number) => {
    const isLastStep = !result?.steps || currentStep >= result.steps.length - 1;
    const traversalOrder = result?.traversal_order ?? [];

    // ── DIJKSTRA : chemin optimal en rouge, exploré en vert clair, départ/arrivée en bleu ──
    if (algorithm === 'dijkstra') {
      if (result?.path && result.path.length > 0 && isLastStep) {
        const isStart = nodeId === result.path[0];
        const isEnd   = nodeId === result.path[result.path.length - 1];
        if (isStart || isEnd) return '#3b82f6';
        if (result.path.includes(nodeId)) return '#ef4444';
        if (result.steps?.[result.steps.length - 1]?.visited?.includes(nodeId))
          return '#86efac';
        return '#fff';
      }
    }

    // ── BFS : ordre de visite en dégradé vert (premier visité = vert foncé, dernier = vert clair) ──
    if (algorithm === 'bfs') {
      if (traversalOrder.length > 0 && isLastStep) {
        const idx = traversalOrder.indexOf(nodeId);
        if (idx === 0) return '#3b82f6';  // nœud de départ en bleu
        if (idx !== -1) {
          // dégradé : 1er visité = vert foncé, dernier = vert clair
          const ratio = idx / (traversalOrder.length - 1);
          const g = Math.round(120 + ratio * 100); // 120 → 220
          return `rgb(34, ${g}, 94)`;
        }
        return '#fff';
      }
    }

    // ── DFS : ordre de visite en dégradé orange (premier = orange foncé, dernier = jaune) ──
    if (algorithm === 'dfs') {
      if (traversalOrder.length > 0 && isLastStep) {
        const idx = traversalOrder.indexOf(nodeId);
        if (idx === 0) return '#3b82f6';  // nœud de départ en bleu
        if (idx !== -1) {
          const ratio = idx / (traversalOrder.length - 1);
          const r = Math.round(234 - ratio * 20);
          const g = Math.round(88  + ratio * 100);
          return `rgb(${r}, ${g}, 12)`;
        }
        return '#fff';
      }
    }

    // ── Animation étape par étape (commun à tous) ──
    if (!result?.steps || currentStep >= result.steps.length) return '#fff';
    const step = result.steps[currentStep];
    if (step.current === nodeId || step.current_node === nodeId) return '#ef4444';
    if (step.visited?.includes(nodeId)) return '#22c55e';
    return '#fff';
  };

  // ---------- Couleur du texte des nœuds (blanc si fond foncé) ----------
  const getNodeTextColor = (nodeId: number) => {
    const bg = getNodeColor(nodeId);
    // fond blanc ou vert très clair → texte sombre
    if (bg === '#fff' || bg === '#86efac') return '#1e3a5f';
    return '#ffffff';
  };

  // ---------- Couleur des arêtes ----------
  const getEdgeColor = (fromId: number, toId: number) => {
    // Dijkstra : arête du chemin en rouge
    if (algorithm === 'dijkstra' && result?.path && result.path.length >= 2) {
      const path = result.path;
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === fromId && path[i + 1] === toId) ||
            (path[i] === toId   && path[i + 1] === fromId)) return '#ef4444';
      }
    }
    // BFS : arête de l'arbre de parcours en vert
    if (algorithm === 'bfs' && result?.traversal_order && result.traversal_order.length > 0) {
      const order = result.traversal_order;
      const fi = order.indexOf(fromId);
      const ti = order.indexOf(toId);
      if (fi !== -1 && ti !== -1 && Math.abs(fi - ti) === 1) return '#16a34a';
    }
    // DFS : arête de l'arbre de parcours en orange
    if (algorithm === 'dfs' && result?.traversal_order && result.traversal_order.length > 0) {
      const order = result.traversal_order;
      const fi = order.indexOf(fromId);
      const ti = order.indexOf(toId);
      if (fi !== -1 && ti !== -1 && Math.abs(fi - ti) === 1) return '#ea580c';
    }
    return '#94a3b8'; // gris clair par défaut
  };

  const getEdgeWidth = (fromId: number, toId: number) => {
    if (algorithm === 'dijkstra' && result?.path && result.path.length >= 2) {
      const path = result.path;
      for (let i = 0; i < path.length - 1; i++) {
        if ((path[i] === fromId && path[i + 1] === toId) ||
            (path[i] === toId   && path[i + 1] === fromId)) return 4;
      }
    }
    if ((algorithm === 'bfs' || algorithm === 'dfs') && result?.traversal_order) {
      const order = result.traversal_order;
      const fi = order.indexOf(fromId);
      const ti = order.indexOf(toId);
      if (fi !== -1 && ti !== -1 && Math.abs(fi - ti) === 1) return 3;
    }
    return 1.5;
  };

  const getEdgeOpacity = (fromId: number, toId: number) => {
    const color = getEdgeColor(fromId, toId);
    return color === '#94a3b8' ? 0.35 : 1;
  };

  // ---------- Handler sécurisé pour les inputs nœud ----------
  const handleNodeInput = (
    val: string,
    setter: (n: number) => void,
    max: number
  ) => {
    const parsed = parseInt(val);
    if (!isNaN(parsed)) setter(clamp(parsed, max));
  };

  // ---------- Rendu ----------
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Théorie des Graphes</h1>
        <p className="text-muted-foreground">
          Visualisation des algorithmes de parcours et plus courts chemins
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Panneau de configuration ── */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Définissez le graphe et l'algorithme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Génération */}
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

            {/* Nombre de nœuds — FIX : handleNumNodesChange reconstruit le graphe */}
            <div className="space-y-2">
              <Label>Nombre de nœuds (2–10)</Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={numNodes}
                onChange={(e) => handleNumNodesChange(e.target.value)}
              />
            </div>

            {/* Algorithme */}
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

            {/* Nœuds départ / arrivée */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Départ (0–{graph.numNodes - 1})</Label>
                <Input
                  type="number"
                  min={0}
                  max={graph.numNodes - 1}
                  value={startNode}
                  onChange={(e) =>
                    handleNodeInput(e.target.value, setStartNode, graph.numNodes - 1)
                  }
                />
              </div>
              {algorithm === 'dijkstra' && (
                <div className="space-y-2">
                  <Label>Arrivée (0–{graph.numNodes - 1})</Label>
                  <Input
                    type="number"
                    min={0}
                    max={graph.numNodes - 1}
                    value={endNode}
                    onChange={(e) =>
                      handleNodeInput(e.target.value, setEndNode, graph.numNodes - 1)
                    }
                  />
                </div>
              )}
            </div>

            {/* Message d'erreur visible — FIX : les erreurs silencieuses sont maintenant affichées */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bouton Exécuter */}
            <Button onClick={runAlgorithm} disabled={isLoading} className="w-full">
              {isLoading ? <Spinner className="mr-2" /> : <Play className="mr-2 h-4 w-4" />}
              Exécuter
            </Button>

            {result?.steps && (
              <Button
                onClick={playAnimation}
                disabled={isPlaying}
                variant="outline"
                className="w-full"
              >
                {isPlaying ? 'Animation en cours...' : '▶ Animer étape par étape'}
              </Button>
            )}

            {/* Résultats */}
            {result && (
              <div className="rounded-lg bg-muted p-3 space-y-2">
                <Label className="text-xs font-semibold">Résultats</Label>
                {result.path && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Chemin :</span>{' '}
                    <span className="font-mono">{result.path.join(' → ')}</span>
                  </div>
                )}
                {result.distances && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Distance :</span>{' '}
                    <span className="font-mono font-semibold">
                      {/* FIX : clé entière + -1 = inaccessible (JSON ne supporte pas Infinity) */}
                      {result.distances[endNode] === undefined || result.distances[endNode] === -1
                        ? '∞ (inaccessible)'
                        : result.distances[endNode]}
                    </span>
                  </div>
                )}
                {result.traversal_order && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Ordre de visite :</span>{' '}
                    <span className="font-mono">{result.traversal_order.join(' → ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Curseur d'étapes */}
            {result?.steps && result.steps.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">
                  Étape {currentStep + 1} / {result.steps.length}
                </Label>
                <input
                  type="range"
                  min={0}
                  max={result.steps.length - 1}
                  value={currentStep}
                  onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Visualisation SVG ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualisation du Graphe</CardTitle>
            {/* FIX : affiche le vrai nombre de nœuds du graphe courant */}
            <CardDescription>
              Graphe à {graph.numNodes} nœud{graph.numNodes > 1 ? 's' : ''} — représentation
              interactive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] border rounded-lg flex items-center justify-center bg-gray-50">
              <svg width="400" height="400" viewBox="0 0 400 400">
                {/* Arêtes — chemin final en rouge/épais */}
                {graph.nodes.map((node) =>
                  node.neighbors.map(([neighborId, weight]) => {
                    const start  = getNodePosition(node.id, graph.numNodes);
                    const end    = getNodePosition(neighborId, graph.numNodes);
                    const color  = getEdgeColor(node.id, neighborId);
                    const width  = getEdgeWidth(node.id, neighborId);
                    const onPath = color === '#ef4444';
                    return (
                      <g key={`edge-${node.id}-${neighborId}`}>
                        <line
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke={color}
                          strokeWidth={width}
                          opacity={getEdgeOpacity(node.id, neighborId)}
                        />
                        <text
                          x={(start.x + end.x) / 2}
                          y={(start.y + end.y) / 2 - 4}
                          fill={color === '#94a3b8' ? '#94a3b8' : color}
                          fontSize={width >= 3 ? '12' : '10'}
                          fontWeight={width >= 3 ? 'bold' : 'normal'}
                          opacity={getEdgeOpacity(node.id, neighborId)}
                          textAnchor="middle"
                        >
                          {weight}
                        </text>
                      </g>
                    );
                  })
                )}

                {/* Nœuds */}
                {graph.nodes.map((node) => {
                  const pos = getNodePosition(node.id, graph.numNodes);
                  return (
                    <g key={`node-${node.id}`}>
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
                        fill={getNodeTextColor(node.id)}
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Légende dynamique selon l'algorithme */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500" />
                <span>Départ {algorithm === 'dijkstra' ? '/ Arrivée' : ''}</span>
              </div>
              {algorithm === 'dijkstra' && <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-red-400 bg-red-500" />
                  <span>Chemin optimal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-300 bg-green-200" />
                  <span>Exploré</span>
                </div>
              </>}
              {algorithm === 'bfs' && <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-700 bg-green-700" />
                  <span>Visité en premier</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-green-300 bg-green-300" />
                  <span>Visité en dernier</span>
                </div>
              </>}
              {algorithm === 'dfs' && <>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-orange-700 bg-orange-700" />
                  <span>Visité en premier</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400 bg-yellow-400" />
                  <span>Visité en dernier</span>
                </div>
              </>}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />
                <span>Non visité</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Infos algorithmes ── */}
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
