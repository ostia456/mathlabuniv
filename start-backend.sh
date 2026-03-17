#!/bin/bash
# MathLab University - Backend Startup Script (Linux/Mac)

echo "🎓 MathLab University - Démarrage du backend"
echo "============================================"

cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

echo "🔄 Activation de l'environnement virtuel..."
source venv/bin/activate

echo "📥 Vérification des dépendances..."
pip install -q -r requirements.txt

echo "🗄️  Initialisation de la base de données..."
python init_db.py

echo ""
echo "🚀 Démarrage du serveur Flask..."
echo "   URL: http://localhost:5000"
echo ""
echo "📧 Comptes de test:"
echo "   - ostiadedo456@gmail.com / 12345678"
echo "   - testsimplement@gmail.com / 12345678"
echo ""
echo "🛑 Pour arrêter: Ctrl+C"
echo ""

python run.py
