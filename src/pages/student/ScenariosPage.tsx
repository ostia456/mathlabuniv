import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { scenarioApi } from '@/services/api';
import type { Scenario } from '@/types';
import { toast } from 'sonner';
import {
  BookOpen,
  Search,
  LineChart,
  Calculator,
  Grid3X3,
  Share2,
  ArrowRight,
  ScrollText,
  Hash,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const MODULE_META: Record<string, { label: string; icon: any; color: string }> = {
  dynamical_systems:  { label: 'Systèmes Dynamiques', icon: LineChart,   color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  numerical_methods:  { label: 'Méthodes Numériques',  icon: Calculator,  color: 'bg-green-500/10 text-green-600 border-green-200' },
  linear_algebra:     { label: 'Algèbre Linéaire',     icon: Grid3X3,     color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  graph_theory:       { label: 'Théorie des Graphes',  icon: Share2,      color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
};

const MODULE_PATHS: Record<string, string> = {
  dynamical_systems: '/modules/dynamical-systems',
  numerical_methods: '/modules/numerical-methods',
  linear_algebra:    '/modules/linear-algebra',
  graph_theory:      '/modules/graph-theory',
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────
export function ScenariosPage() {
  const [scenarios, setScenarios]   = useState<Scenario[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [search, setSearch]         = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [joinCode, setJoinCode]     = useState('');
  const [isJoining, setIsJoining]   = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const data = await scenarioApi.list();
      setScenarios(data);
    } catch {
      toast.error('Erreur lors du chargement des scénarios.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const result = await scenarioApi.join(joinCode.trim().toUpperCase());
      toast.success(`Scénario "${result.scenario.title}" rejoint !`);
      setJoinCode('');
      loadScenarios();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Code invalide ou expiré.');
    } finally {
      setIsJoining(false);
    }
  };

  // ── Filtrage ────────────────────────────────────────────────────────────────
  const filtered = scenarios.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === 'all' || s.module === filterModule;
    return matchSearch && matchModule;
  });

  // ── Rendu ───────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scénarios Pédagogiques</h1>
          <p className="text-muted-foreground">
            Explorez les scénarios créés par vos enseignants
          </p>
        </div>

        {/* Rejoindre par code */}
        <div className="flex gap-2">
          <Input
            placeholder="Code du scénario (ex: AB12CD34)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="w-52 font-mono uppercase"
            maxLength={8}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <Button onClick={handleJoin} disabled={isJoining || !joinCode.trim()}>
            {isJoining ? <Spinner className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Rejoindre</span>
          </Button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un scénario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Tous' },
            ...Object.entries(MODULE_META).map(([id, m]) => ({ value: id, label: m.label })),
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={filterModule === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterModule(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Liste des scénarios ── */}
      {filtered.length === 0 ? (
        // ── État vide ──────────────────────────────────────────────────────────
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted py-20 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <ScrollText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">
            {scenarios.length === 0
              ? 'Aucun scénario disponible pour le moment'
              : 'Aucun résultat pour cette recherche'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {scenarios.length === 0
              ? "Vos enseignants n'ont pas encore publié de scénarios. Revenez plus tard ou utilisez un code de partage."
              : 'Essayez un autre terme ou changez le filtre de module.'}
          </p>
          {scenarios.length === 0 && (
            <div className="mt-6 flex gap-3">
              <Button asChild variant="outline">
                <Link to="/modules/dynamical-systems">
                  <LineChart className="mr-2 h-4 w-4" />
                  Explorer les modules
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/exercises">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Faire des exercices
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        // ── Grille des scénarios ───────────────────────────────────────────────
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((scenario) => {
            const meta = MODULE_META[scenario.module] ?? MODULE_META.dynamical_systems;
            const ModuleIcon = meta.icon;
            const targetPath = MODULE_PATHS[scenario.module] ?? '/';

            return (
              <Card
                key={scenario.id}
                className="group flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  {/* Badge module */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
                      <ModuleIcon className="h-3 w-3" />
                      {meta.label}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Public
                    </Badge>
                  </div>
                  <CardTitle className="text-lg leading-snug">{scenario.title}</CardTitle>
                  {scenario.description && (
                    <CardDescription className="line-clamp-2">
                      {scenario.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-4">
                  {/* Instructions */}
                  {scenario.instructions && (
                    <div className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground line-clamp-3">
                      📋 {scenario.instructions}
                    </div>
                  )}

                  {/* Métadonnées */}
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Créé le {new Date(scenario.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      #{scenario.share_code}
                    </span>
                  </div>

                  {/* Bouton ouvrir */}
                  <Button asChild className="w-full">
                    <Link to={targetPath}>
                      Ouvrir le module
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
