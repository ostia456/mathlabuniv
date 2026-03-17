"""
Authentication API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity,
    get_jwt
)
from app import db
from app.models.user import User
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

# Token blacklist for logout
blacklist = set()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validation
    required_fields = ['email', 'password', 'first_name', 'last_name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Create user
    user = User(
        email=data['email'].lower(),
        first_name=data['first_name'],
        last_name=data['last_name'],
        role=data.get('role', 'student')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()
    
    email = data.get('email', '').lower()
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token
    })

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (invalidate token)"""
    jti = get_jwt()['jti']
    blacklist.add(jti)
    return jsonify({'message': 'Successfully logged out'})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()})

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    })

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    """List all users (teacher/admin only)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user.is_teacher():
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify({'users': [u.to_dict() for u in users]})

# Token blacklist for logout
blacklist = set()