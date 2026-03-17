@echo off
REM MathLab University - Backend Startup Script (Windows)

echo 🎓 MathLab University - Demarrage du backend
echo ============================================

cd backend

REM Check if venv exists
if not exist "venv" (
    echo 📦 Creation de l'environnement virtuel...
    python -m venv venv
)

echo 🔄 Activation de l'environnement virtuel...
call venv\Scripts\activate

echo 📥 Verification des dependances...
pip install -q -r requirements.txt

echo 🗄️  Initialisation de la base de donnees...
python init_db.py

echo.
echo 🚀 Demarrage du serveur Flask...
echo    URL: http://localhost:5000
echo.
echo 📧 Comptes de test:
echo    - ostiadedo456@gmail.com / 12345678
echo    - testsimplement@gmail.com / 12345678
echo.
echo 🛑 Pour arreter: Ctrl+C
echo.

python run.py
