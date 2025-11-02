from datetime import datetime, timedelta
import os
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
from pymongo import MongoClient
from bson import ObjectId
import json
import uuid
import threading
from pathlib import Path


load_dotenv()

MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('MONGODB_DB', 'budgetbuddy')
JWT_SECRET = os.getenv('JWT_SECRET', 'dev-secret')
JWT_ALGORITHM = 'HS256'

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
# Try to ping the server. If it fails, fall back to file-backed storage.
USE_MONGO = True
try:
    client.admin.command('ping')
    db = client[DB_NAME]
except Exception:
    USE_MONGO = False
    db = None

# File-backed store (fallback)
DATA_FILE = Path(__file__).resolve().parent / 'data.json'
_file_lock = threading.Lock()
if not USE_MONGO:
    try:
        with DATA_FILE.open('r', encoding='utf-8') as f:
            FILE_STORE = json.load(f)
    except Exception:
        FILE_STORE = {'users': [], 'transactions': [], 'user': {'name': 'Guest User', 'image': 'https://i.pravatar.cc/100'}, 'categories': []}


def mongo_ok():
    """Return True if MongoDB is reachable right now."""
    try:
        client.admin.command('ping')
        return True
    except Exception:
        return False

app = Flask(__name__)
CORS(app)


def hash_password(password: str) -> str:
    # WARNING: storing plaintext passwords (no hashing) per user request.
    # This returns the raw password so it is stored/compared as plaintext.
    return password


def verify_password(password: str, hashed: str) -> bool:
    # Plaintext comparison only — no hashing verification.
    try:
        return (password == hashed)
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            token = auth.split(' ', 1)[1]
            data = decode_token(token)
            if data and 'user_id' in data:
                uid = data['user_id']
                # load user depending on backend
                if mongo_ok():
                    try:
                        user = db.users.find_one({'_id': ObjectId(uid)})
                    except Exception:
                        user = None
                else:
                    user = next((u for u in FILE_STORE.get('users', []) if u.get('id') == uid), None)
                if user:
                    request.current_user = user
                    return f(*args, **kwargs)
        return jsonify({'error': 'Unauthorized'}), 401

    return decorated


def user_safe(user_doc):
    if not user_doc:
        return None
    # support both mongo (with _id) and file-backed (with id)
    uid = None
    if '_id' in user_doc:
        uid = str(user_doc.get('_id'))
    elif 'id' in user_doc:
        uid = str(user_doc.get('id'))
    return {
        'id': uid,
        'name': user_doc.get('name'),
        'email': user_doc.get('email'),
        'image': user_doc.get('image')
    }


@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    name = data.get('name')
    email = (data.get('email') or '').lower()
    password = data.get('password')

    if not email or not password or not name:
        return jsonify({'error': 'name, email and password are required'}), 400

    # check existing
    if mongo_ok():
        if db.users.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 400
        hashed = hash_password(password)
        user = {'name': name, 'email': email, 'password': hashed, 'image': None, 'created_at': datetime.utcnow()}
        res = db.users.insert_one(user)
        user['_id'] = res.inserted_id
        token = create_token(str(user['_id']))
        return jsonify({'token': token, 'user': user_safe(user)})
    else:
        if any(u for u in FILE_STORE.get('users', []) if u.get('email') == email):
            return jsonify({'error': 'Email already registered'}), 400
        hashed = hash_password(password)
        new_id = str(uuid.uuid4())
        user = {'id': new_id, 'name': name, 'email': email, 'password': hashed, 'image': None, 'created_at': datetime.utcnow().isoformat()}
        with _file_lock:
            FILE_STORE.setdefault('users', []).append(user)
            with DATA_FILE.open('w', encoding='utf-8') as f:
                json.dump(FILE_STORE, f, default=str, indent=2)
        token = create_token(new_id)
        return jsonify({'token': token, 'user': user_safe(user)})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    # Accept either an email or a username/name field. Client may send 'identifier', 'email' or 'username'.
    identifier = (data.get('identifier') or data.get('email') or data.get('username') or '').strip()
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'error': 'identifier (email or username) and password required'}), 400

    # Determine whether identifier looks like an email
    is_email = '@' in identifier

    if mongo_ok():
        # search by email or name
        query = {'email': identifier.lower()} if is_email else {'name': identifier}
        user = db.users.find_one(query)
        # Only accept plaintext stored in the 'password' field.
        stored_pw = user.get('password') if user else None
        ok = bool(user and stored_pw is not None and verify_password(password, stored_pw))
        if not ok:
            return jsonify({'error': 'Invalid credentials'}), 401
        token = create_token(str(user['_id']))
        return jsonify({'token': token, 'user': user_safe(user)})
    else:
        # file-backed store: user records store 'email' and 'name'
        if is_email:
            user = next((u for u in FILE_STORE.get('users', []) if u.get('email') == identifier.lower()), None)
        else:
            user = next((u for u in FILE_STORE.get('users', []) if u.get('name') == identifier), None)
        # Only accept plaintext stored in the 'password' field for file-backed store.
        stored_pw = user.get('password') if user else None
        ok = bool(user and stored_pw is not None and verify_password(password, stored_pw))
        if not ok:
            return jsonify({'error': 'Invalid credentials'}), 401
        token = create_token(user.get('id'))
        return jsonify({'token': token, 'user': user_safe(user)})


@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    user = request.current_user
    return jsonify(user_safe(user))


@app.route('/api/user', methods=['PUT'])
@login_required
def update_user():
    data = request.get_json() or {}
    name = data.get('name')
    image = data.get('image')
    user = request.current_user
    update = {}
    if name is not None:
        update['name'] = name
    if image is not None:
        update['image'] = image
    if mongo_ok():
        if update:
            db.users.update_one({'_id': user['_id']}, {'$set': update})
            user = db.users.find_one({'_id': user['_id']})
        return jsonify(user_safe(user))
    else:
        if update:
            with _file_lock:
                for u in FILE_STORE.get('users', []):
                    if u.get('id') == user.get('id'):
                        u.update(update)
                        user = u
                        break
                with DATA_FILE.open('w', encoding='utf-8') as f:
                    json.dump(FILE_STORE, f, default=str, indent=2)
        return jsonify(user_safe(user))


@app.route('/api/transactions', methods=['GET'])
@login_required
def list_transactions():
    user = request.current_user
    out = []
    if mongo_ok():
        docs = list(db.transactions.find({'user_id': user['_id']}).sort('created_at', -1))
        for d in docs:
            out.append({
                'id': str(d.get('_id')),
                'type': d.get('type'),
                'amount': float(d.get('amount') or 0),
                'category': d.get('category'),
                'note': d.get('note'),
                'created_at': d.get('created_at').isoformat() if d.get('created_at') else None,
            })
    else:
        # file-backed: transactions store user_id as string id
        for d in sorted(FILE_STORE.get('transactions', []), key=lambda x: x.get('created_at', ''), reverse=True):
            if d.get('user_id') == user.get('id'):
                out.append({
                    'id': d.get('id'),
                    'type': d.get('type'),
                    'amount': float(d.get('amount') or 0),
                    'category': d.get('category'),
                    'note': d.get('note'),
                    'created_at': d.get('created_at'),
                })
    return jsonify(out)


@app.route('/api/transactions', methods=['POST'])
@login_required
def create_transaction():
    # Keep backward-compatible generic transaction creation, delegate to helper
    data = request.get_json() or {}
    ttype = data.get('type')
    amount = data.get('amount')
    category = data.get('category')
    note = data.get('note')
    return _add_transaction_for_user(request.current_user, ttype, amount, category, note)


def _add_transaction_for_user(user, ttype, amount, category, note):
    """Shared helper to create an income or expense for the given user."""
    if ttype not in ('income', 'expense') or amount is None:
        return jsonify({'error': 'type (income|expense) and amount required'}), 400
    try:
        amount = float(amount)
    except Exception:
        return jsonify({'error': 'invalid amount'}), 400

    if mongo_ok():
        doc = {
            'user_id': user['_id'],
            'type': ttype,
            'amount': amount,
            'category': category,
            'note': note,
            'created_at': datetime.utcnow(),
        }
        res = db.transactions.insert_one(doc)
        doc['_id'] = res.inserted_id
        return jsonify({'id': str(doc['_id'])}), 201
    else:
        new_id = str(uuid.uuid4())
        doc = {
            'id': new_id,
            'user_id': user.get('id'),
            'type': ttype,
            'amount': amount,
            'category': category,
            'note': note,
            'created_at': datetime.utcnow().isoformat(),
        }
        with _file_lock:
            FILE_STORE.setdefault('transactions', []).append(doc)
            with DATA_FILE.open('w', encoding='utf-8') as f:
                json.dump(FILE_STORE, f, default=str, indent=2)
        return jsonify({'id': new_id}), 201


@app.route('/api/expense', methods=['POST'])
@login_required
def add_expense():
    data = request.get_json() or {}
    amount = data.get('amount')
    category = data.get('category')
    note = data.get('note')
    return _add_transaction_for_user(request.current_user, 'expense', amount, category, note)


@app.route('/api/income', methods=['POST'])
@login_required
def add_income():
    data = request.get_json() or {}
    amount = data.get('amount')
    category = data.get('category')
    note = data.get('note')
    return _add_transaction_for_user(request.current_user, 'income', amount, category, note)


@app.route('/api/transactions/<tid>', methods=['DELETE'])
@login_required
def delete_transaction(tid):
    user = request.current_user
    if mongo_ok():
        try:
            oid = ObjectId(tid)
        except Exception:
            return jsonify({'error': 'invalid id'}), 400
        res = db.transactions.delete_one({'_id': oid, 'user_id': user['_id']})
        if res.deleted_count:
            return jsonify({'ok': True})
        return jsonify({'error': 'not found'}), 404
    else:
        with _file_lock:
            txs = FILE_STORE.get('transactions', [])
            for i, t in enumerate(txs):
                if t.get('id') == tid and t.get('user_id') == user.get('id'):
                    del txs[i]
                    with DATA_FILE.open('w', encoding='utf-8') as f:
                        json.dump(FILE_STORE, f, default=str, indent=2)
                    return jsonify({'ok': True})
        return jsonify({'error': 'not found'}), 404


@app.route('/api/summary', methods=['GET'])
@login_required
def summary():
    user = request.current_user
    totals = {'income': 0.0, 'expense': 0.0}
    if USE_MONGO:
        pipeline = [
            {'$match': {'user_id': user['_id']}},
            {'$group': {'_id': '$type', 'total': {'$sum': '$amount'}}}
        ]
        agg = list(db.transactions.aggregate(pipeline))
        for a in agg:
            k = a.get('_id')
            totals[k] = float(a.get('total') or 0)
    else:
        for t in FILE_STORE.get('transactions', []):
            if t.get('user_id') == user.get('id'):
                totals[t.get('type', 'expense')] += float(t.get('amount') or 0)
    balance = totals['income'] - totals['expense']
    return jsonify({'income': totals['income'], 'expense': totals['expense'], 'balance': balance})


@app.route('/', methods=['GET'])
def index():
    """Root endpoint to make the API discoverable in a browser."""
    return jsonify({
        'message': 'Budget Buddy API',
        'info': 'See /api/* endpoints',
        'endpoints': [
            '/api/signup',
            '/api/login',
            '/api/user',
            '/api/transactions',
            '/api/summary',
        ],
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
