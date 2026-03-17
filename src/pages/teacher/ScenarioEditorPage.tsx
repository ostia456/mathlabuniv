import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { scenarioApi } from '@/services/api';
import type { Scenario } from '@/types';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';

const modules = [
  { id: 'dynamical_systems', name: 'Systèmes Dynamiques' },
  { id: 'numerical_methods', name: 'Méthodes Numériques' },
  { id: 'linear_algebra', name: 'Algèbre Linéaire' },
  { id: 'graph_theory', name: 'Théorie des Graphes' },
];

export function ScenarioEditorPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: 'dynamical_systems',
    instructions: '',
    is_public: false,
    config: {},
    locked_params: [] as string[],
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await scenarioApi.list();
      setScenarios(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des scénarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await scenarioApi.create(formData);
      toast.success('Scénario créé avec succès');
      setIsDialogOpen(false);
      resetForm();
      loadScenarios();
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const handleUpdate = async () => {
    if (!editingScenario) return;
    try {
      await scenarioApi.update(editingScenario.id, formData);
      toast.success('Scénario mis à jour');
      setIsDialogOpen(false);
      setEditingScenario(null);
      resetForm();
      loadScenarios();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce scénario?')) return;
    try {
      await scenarioApi.delete(id);
      toast.success('Scénario supprimé');
      loadScenarios();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleClone = async (id: number) => {
    try {
      await scenarioApi.clone(id);
      toast.success('Scénario cloné');
      loadScenarios();
    } catch (error) {
      toast.error('Erreur lors du clonage');
    }
  };

  const openEditDialog = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setFormData({
      title: scenario.title,
      description: scenario.description,
      module: scenario.module,
      instructions: scenario.instructions,
      is_public: scenario.is_public,
      config: scenario.config,
      locked_params: scenario.locked_params,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingScenario(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      module: 'dynamical_systems',
      instructions: '',
      is_public: false,
      config: {},
      locked_params: [],
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Scénarios</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos scénarios pédagogiques
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau scénario
        </Button>
      </div>

      {/* Scenarios List */}
      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{scenario.title}</CardTitle>
                    {scenario.is_public && (
                      <Badge variant="secondary">Public</Badge>
                    )}
                  </div>
                  <CardDescription>{scenario.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClone(scenario.id)}
                    title="Cloner"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(scenario)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(scenario.id)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Module:</span>{' '}
                  {modules.find(m => m.id === scenario.module)?.name}
                </div>
                <div>
                  <span className="text-muted-foreground">Code:</span>{' '}
                  <code className="rounded bg-muted px-1">{scenario.share_code}</code>
                </div>
                <div>
                  <span className="text-muted-foreground">Créé le:</span>{' '}
                  {new Date(scenario.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {scenarios.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun scénario créé pour le moment</p>
            <Button onClick={openCreateDialog} variant="outline" className="mt-4">
              Créer votre premier scénario
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingScenario ? 'Modifier le scénario' : 'Nouveau scénario'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nom du scénario"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du scénario"
              />
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={formData.module}
                onValueChange={(v) => setFormData({ ...formData, module: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instructions pour les étudiants</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Consignes et objectifs du scénario"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_public">Rendre public</Label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingScenario ? handleUpdate : handleCreate}
                className="flex-1"
              >
                {editingScenario ? 'Mettre à jour' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
