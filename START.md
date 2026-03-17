# 🚀 Démarrage Rapide - MathLab University

## ⚠️ Problème d'authentification ?

Le site en ligne (https://urk4l2fofuir6.ok.kimi.link) est **SEULEMENT le frontend**.
Pour vous connecter, vous DEVEZ démarrer le backend sur votre ordinateur.

---

## 📋 Étapes pour démarrer (5 minutes)

### Étape 1: Ouvrir un terminal

### Étape 2: Aller dans le dossier backend
```bash
cd backend
```

### Étape 3: Créer l'environnement virtuel
```bash
python3 -m venv venv
```

### Étape 4: Activer l'environnement
**Sur Mac/Linux:**
```bash
source venv/bin/activate
```

**Sur Windows:**
```bash
venv\Scripts\activate
```

### Étape 5: Installer les dépendances
```bash
pip install -r requirements.txt
```

### Étape 6: Créer la base de données et les utilisateurs
```bash
python init_db.py
```

### Étape 7: Démarrer le serveur
```bash
python run.py
```

Vous devriez voir:
```
* Running on http://localhost:5000
```

---

## ✅ Connexion au site

1. Ouvrez **https://urk4l2fofuir6.ok.kimi.link** dans votre navigateur
2. Cliquez sur "Se connecter"
3. Utilisez ces identifiants:

| Email | Mot de passe |
|-------|-------------|
| `ostiadedo456@gmail.com` | `12345678` |
| `testsimplement@gmail.com` | `12345678` |

---

## 🛑 Arrêter le serveur

Dans le terminal, appuyez sur **Ctrl+C**

Pour désactiver l'environnement virtuel:
```bash
deactivate
```

---

## 🔧 Problèmes courants

### "python3: command not found"
Essayez avec `python` au lieu de `python3`

### "pip: command not found"
Installez pip:
```bash
python -m ensurepip --upgrade
```

### "Module not found"
Assurez-vous que l'environnement virtuel est activé (vous voyez `(venv)` dans le terminal)

---

## 📧 Comptes disponibles

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| ostiadedo456@gmail.com | 12345678 | Étudiant |
| testsimplement@gmail.com | 12345678 | Étudiant |
| professeur@mathlab.edu | 12345678 | Enseignant |
| admin@mathlab.edu | 12345678 | Admin |
