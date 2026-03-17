# 🎓 MathLab University

Plateforme web interactive de simulation mathématique pour les étudiants en Licence Mathématiques-Informatique.

## 🚨 IMPORTANT - Pour faire fonctionner l'authentification

Le site déployé (https://urk4l2fofuir6.ok.kimi.link) est **le frontend uniquement**. 
Pour que l'authentification fonctionne, vous devez **démarrer le backend localement**.

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend (Flask)

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel (recommandé)
python3 -m venv venv

# Activer l'environnement virtuel
# Sur Linux/Mac:
source venv/bin/activate
# Sur Windows:
venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Initialiser la base de données et créer les utilisateurs par défaut
python init_db.py

# Démarrer le serveur
python run.py
```

Le backend sera accessible sur **http://localhost:5000**

### 2. Utilisateurs par défaut créés automatiquement

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `ostiadedo456@gmail.com` | `12345678` | Étudiant |
| `testsimplement@gmail.com` | `12345678` | Étudiant |
| `professeur@mathlab.edu` | `12345678` | Enseignant |
| `admin@mathlab.edu` | `12345678` | Administrateur |

### 3. Accéder au site

Ouvrez le site déployé : **https://urk4l2fofuir6.ok.kimi.link**

Connectez-vous avec l'un des comptes ci-dessus.

---

## 📁 Structure du Projet

```
mathlab-university/
├── backend/              # API Flask
│   ├── app/
│   │   ├── api/         # Routes API
│   │   ├── models/      # Modèles de données
│   │   └── __init__.py
│   ├── init_db.py       # Script d'initialisation
│   ├── requirements.txt
│   └── run.py
├── src/                  # Frontend React
│   ├── pages/
│   ├── components/
│   ├── contexts/
│   └── services/
└── docker-compose.yml
```

## 🐳 Démarrage avec Docker (Optionnel)

```bash
# Démarrer tous les services
docker-compose up -d

# Le frontend sera sur http://localhost:5173
# Le backend sera sur http://localhost:5000
# pgAdmin sera sur http://localhost:5050
```

## 🛠️ Fonctionnalités

### 4 Modules Mathématiques
1. **Systèmes Dynamiques** - EDO, portraits de phase, stabilité
2. **Méthodes Numériques** - Euler, Runge-Kutta, analyse d'erreur
3. **Algèbre Linéaire** - Transformations, SVD, valeurs propres
4. **Théorie des Graphes** - Dijkstra, BFS, DFS

### Système Pédagogique
- ✅ Génération procédurale d'exercices
- ✅ Correction automatique
- ✅ Progression adaptative
- ✅ Scénarios personnalisables (enseignants)

---

## 🔧 Configuration Backend

Le fichier `.env` contient la configuration:

```env
DATABASE_URL=sqlite:///mathlab.db
SECRET_KEY=dev-secret-key-mathlab-university-2026
JWT_SECRET_KEY=jwt-secret-key-mathlab-university-2026
FLASK_ENV=development
FLASK_DEBUG=1
```

---

## 📞 Support

Projet de Licence 3 - UNSTIM  
Responsable: DEDO E. Ostia  
Date: Mars 2026
