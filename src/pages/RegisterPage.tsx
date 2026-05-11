import { useState, useRef, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api'; // adapte si ton API s'appelle autrement
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Loader2, MailCheck, CheckCircle2, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Step = 'register' | 'verify' | 'success';

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate  = useNavigate();
  const { register } = useAuth();

  // ── États globaux ──────────────────────────────────────────────────────────
  const [step, setStep]       = useState<Step>('register');
  const [error, setError]     = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Étape 1 : formulaire d'inscription ────────────────────────────────────
  const [formData, setFormData] = useState({
    first_name:      '',
    last_name:       '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });

  // ── Étape 2 : vérification email ──────────────────────────────────────────
  const CODE_LENGTH = 6;
  const [code, setCode]             = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const codeRefs                    = useRef<Array<HTMLInputElement | null>>(Array(CODE_LENGTH).fill(null));
  const [resendCooldown, setResendCooldown] = useState(0); // secondes restantes
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Étape 1 — Soumission du formulaire d'inscription
  // ─────────────────────────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        first_name: formData.first_name,
        last_name:  formData.last_name,
        email:      formData.email,
        password:   formData.password,
      });
      // Succès → passe à l'étape de vérification
      startCooldown(60);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Étape 2 — Gestion des 6 cases du code
  // ─────────────────────────────────────────────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    // N'accepte que les chiffres
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError('');

    // Avance automatiquement à la case suivante
    if (digit && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (code[index]) {
        // Efface la case courante
        const newCode = [...code];
        newCode[index] = '';
        setCode(newCode);
      } else if (index > 0) {
        // Recule à la case précédente
        codeRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0)           codeRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) codeRefs.current[index + 1]?.focus();
  };

  // Gestion du coller (ex : copier "123456" depuis l'email)
  const handleCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const newCode = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { newCode[i] = ch; });
    setCode(newCode);
    // Focus sur la dernière case remplie
    const lastIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    codeRefs.current[lastIndex]?.focus();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Étape 2 — Soumission du code de vérification
  // ─────────────────────────────────────────────────────────────────────────
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) {
      setError('Veuillez saisir les 6 chiffres du code.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.verifyEmail({ email: formData.email, code: fullCode });
      setStep('success');
      // Redirige vers /login après 3 secondes
      setTimeout(() => navigate('/login', {
        state: { message: '✅ Compte vérifié ! Vous pouvez maintenant vous connecter.' }
      }), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Code incorrect ou expiré.');
      // Efface les cases en cas d'erreur
      setCode(Array(CODE_LENGTH).fill(''));
      codeRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Étape 2 — Renvoyer le code
  // ─────────────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      await authApi.resendVerification({ email: formData.email });
      startCooldown(60);
      setCode(Array(CODE_LENGTH).fill(''));
      codeRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Impossible de renvoyer le code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Rendu
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/20 p-4">
      <div className="w-full max-w-md">

        {/* En-tête */}
        <div className="mb-8 flex flex-col items-center">
          <GraduationCap className="h-16 w-16 text-primary" />
          <h1 className="mt-4 text-3xl font-bold">MathLab University</h1>
          <p className="text-muted-foreground">Plateforme de simulation mathématique</p>
        </div>

        {/* ── Étape 1 : Formulaire d'inscription ── */}
        {step === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
              <CardDescription>Créez votre compte pour commencer à apprendre</CardDescription>
            </CardHeader>

            <form onSubmit={handleRegisterSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name" name="first_name" placeholder="Jean"
                      value={formData.first_name} onChange={handleChange} required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name" name="last_name" placeholder="Dupont"
                      value={formData.last_name} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email" name="email" type="email" placeholder="votre@email.com"
                    value={formData.email} onChange={handleChange} required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password" name="password" type="password" placeholder="••••••••"
                    value={formData.password} onChange={handleChange} required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                    value={formData.confirmPassword} onChange={handleChange} required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inscription...</>
                  ) : "S'inscrire"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ── Étape 2 : Vérification email ── */}
        {step === 'verify' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <div className="rounded-full bg-primary/10 p-3">
                  <MailCheck className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle>Vérifiez votre email</CardTitle>
              <CardDescription>
                Un code à 6 chiffres a été envoyé à{' '}
                <span className="font-medium text-foreground">{formData.email}</span>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleVerifySubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 6 cases de saisie */}
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { codeRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      onPaste={index === 0 ? handleCodePaste : undefined}
                      className={`
                        h-12 w-10 rounded-lg border-2 text-center text-xl font-bold
                        transition-all duration-150 outline-none
                        ${digit
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-input bg-background text-foreground'
                        }
                        focus:border-primary focus:ring-2 focus:ring-primary/20
                      `}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Vous pouvez aussi coller le code directement depuis votre email
                </p>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || code.join('').length < CODE_LENGTH}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Vérification...</>
                  ) : 'Vérifier mon email'}
                </Button>

                {/* Bouton renvoyer le code */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  {resendCooldown > 0
                    ? `Renvoyer le code (${resendCooldown}s)`
                    : 'Renvoyer le code'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep('register'); setError(''); setCode(Array(CODE_LENGTH).fill('')); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  ← Modifier mon email
                </button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ── Étape 3 : Succès → redirection auto vers /login ── */}
        {step === 'success' && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-xl font-bold">Email vérifié !</h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                Votre compte a été activé avec succès. Vous allez être redirigé vers la
                page de connexion dans quelques secondes…
              </p>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />
              <Link to="/login" className="text-sm text-primary hover:underline mt-1">
                Se connecter maintenant →
              </Link>
            </CardContent>
          </Card>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          UNSTIM — Département de Mathématiques-Informatique
        </p>
      </div>
    </div>
  );
}
