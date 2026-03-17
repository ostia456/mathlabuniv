import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Calculator,
  Grid3X3,
  Share2,
  BookOpen,
  ArrowRight,
  Sparkles,
  Users,
  Target,
} from 'lucide-react';

const modules = [
  {
    id: 'dynamical-systems',
    name: 'Systèmes Dynamiques',
    description: 'Simulation d\'équations différentielles, portraits de phase, analyse de stabilité',
    icon: LineChart,
    color: 'bg-blue-500',
    path: '/modules/dynamical-systems',
  },
  {
    id: 'numerical-methods',
    name: 'Méthodes Numériques',
    description: 'Comparaison des méthodes d\'intégration, analyse d\'erreur, convergence',
    icon: Calculator,
    color: 'bg-green-500',
    path: '/modules/numerical-methods',
  },
  {
    id: 'linear-algebra',
    name: 'Algèbre Linéaire',
    description: 'Transformations linéaires, SVD, valeurs propres, méthodes itératives',
    icon: Grid3X3,
    color: 'bg-purple-500',
    path: '/modules/linear-algebra',
  },
  {
    id: 'graph-theory',
    name: 'Théorie des Graphes',
    description: 'Algorithmes de parcours, plus courts chemins, arbres couvrants',
    icon: Share2,
    color: 'bg-orange-500',
    path: '/modules/graph-theory',
  },
];

const features = [
  {
    icon: Sparkles,
    title: 'Simulations Interactives',
    description: 'Manipulez les paramètres en temps réel et visualisez les résultats instantanément.',
  },
  {
    icon: BookOpen,
    title: 'Exercices Générés',
    description: 'Des exercices uniques générés procéduralement avec correction automatique.',
  },
  {
    icon: Target,
    title: 'Progression Adaptative',
    description: 'La difficulté s\'adapte automatiquement à votre niveau de maîtrise.',
  },
  {
    icon: Users,
    title: 'Scénarios Pédagogiques',
    description: 'Les enseignants peuvent créer et partager des scénarios personnalisés.',
  },
];

export function HomePage() {
  useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-16 text-primary-foreground">
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Bienvenue sur MathLab University
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/90">
            Une plateforme interactive de simulation mathématique pour visualiser,
            manipuler et expérimenter les concepts fondamentaux des mathématiques appliquées.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-black text-white hover:bg-black/90">
              <Link to="/exercises">
                <BookOpen className="mr-2 h-5 w-5" />
                Commencer les exercices
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-black text-white hover:bg-black/90"
            >
              <Link to="/modules/dynamical-systems">
                Explorer les modules
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Modules Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Modules de Simulation</h2>
            <p className="text-muted-foreground">
              Explorez les quatre domaines des mathématiques appliquées
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <Card key={module.id} className="group transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg ${module.color} p-3 text-white`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={module.path}>
                      Ouvrir
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <CardTitle className="mt-4">{module.name}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="rounded-2xl bg-muted/50 px-6 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold">Fonctionnalités Clés</h2>
          <p className="mt-2 text-muted-foreground">
            Une approche moderne de l'apprentissage des mathématiques
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="bg-background">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="text-center">
        <h2 className="text-2xl font-bold">Prêt à commencer?</h2>
        <p className="mt-2 text-muted-foreground">
          Choisissez un module et commencez à explorer les mathématiques de manière interactive.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/modules/dynamical-systems">
              <LineChart className="mr-2 h-5 w-5" />
              Systèmes Dynamiques
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/exercises">
              <BookOpen className="mr-2 h-5 w-5" />
              Exercices
            </Link>
          </Button>
        </div>
      </section>

      {/* Info Section */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h3 className="text-lg font-semibold">UNSTIM - Département de Mathématiques-Informatique</h3>
            <p className="text-sm text-muted-foreground">
              Projet de Licence 3 - Responsable: DEDO E. Ostia
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Date: Lundi 2 mars 2026</p>
            <p>Version 1.0</p>
          </div>
        </div>
      </section>
    </div>
  );
}
