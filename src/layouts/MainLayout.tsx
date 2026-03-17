import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import {
  Calculator,
  LineChart,
  Grid3X3,
  Share2,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Settings,
} from 'lucide-react';

const modules = [
  { name: 'Systèmes Dynamiques', path: '/modules/dynamical-systems', icon: LineChart },
  { name: 'Méthodes Numériques', path: '/modules/numerical-methods', icon: Calculator },
  { name: 'Algèbre Linéaire', path: '/modules/linear-algebra', icon: Grid3X3 },
  { name: 'Théorie des Graphes', path: '/modules/graph-theory', icon: Share2 },
];

export function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">MathLab University</span>
          </Link>

          {/* Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === '/' && 'bg-accent'
                    )}
                  >
                    Accueil
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Modules Dropdown */}
              <NavigationMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1">
                      Modules
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {modules.map((module) => (
                      <DropdownMenuItem key={module.path} asChild>
                        <Link to={module.path} className="flex items-center gap-2">
                          <module.icon className="h-4 w-4" />
                          {module.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/exercises">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === '/exercises' && 'bg-accent'
                    )}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Exercices
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/progress">
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      location.pathname === '/progress' && 'bg-accent'
                    )}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Progression
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {isTeacher && (
                <NavigationMenuItem>
                  <Link to="/teacher/dashboard">
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        location.pathname.startsWith('/teacher') && 'bg-accent'
                      )}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Enseignant
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user?.first_name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {user?.first_name[0]}
                  {user?.last_name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.full_name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Tableau de bord
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/progress" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Ma progression
                </Link>
              </DropdownMenuItem>
              {isTeacher && (
                <DropdownMenuItem asChild>
                  <Link to="/teacher/dashboard" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Gestion
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold">MathLab University</span>
            </div>
            <p className="text-sm text-muted-foreground">
              UNSTIM - Département de Mathématiques-Informatique
            </p>
            <p className="text-sm text-muted-foreground">
              © 2026 MathLab University. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
