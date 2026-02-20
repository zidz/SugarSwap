import json
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import date # Import date
from flask import Flask, jsonify, render_template, request, session, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
import requests # Import requests
import requests.packages.urllib3 # Import for disabling warnings

# Disable SSL warnings for unverified requests (development only)
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)

# --- App Initialization ---
app = Flask(__name__)
# A secret key is required for session management
app.config['SECRET_KEY'] = os.urandom(24)

# --- Logging Configuration ---
log_dir = 'logs'
log_file = os.path.join(log_dir, 'app.log')
os.makedirs(log_dir, exist_ok=True)
handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
logging.getLogger('werkzeug').addHandler(handler)
logging.getLogger('werkzeug').setLevel(logging.INFO)

# --- User Data Helpers ---
USERS_FILE = 'users.json'

def load_users():
    if not os.path.exists(USERS_FILE):
        return {"users": {}}
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"users": {}}


def save_users(data):
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# --- API Endpoints ---

# --- Authentication ---
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "Invalid request"}), 400
        
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400

    users_data = load_users()
    if 'users' not in users_data: # Make it robust
        users_data['users'] = {}

    if username in users_data['users']:
        return jsonify({"status": "error", "message": "Username already exists"}), 409

    hashed_password = generate_password_hash(password)
    
    # Default user data structure
    users_data['users'][username] = {
        "password": hashed_password,
        "gamification_state": {
            "level": 1,
            "current_xp": 0,
            "lifetime_stats": {
                "total_sugar_saved_g": 0,
                "total_sugar_consumed_g": 0,
                "daily_sugar_consumed_g": 0, # New field for daily tracking
                "last_consumed_date": None # New field to track last consumption date
            },
            "streaks": {"current_streak_days": 0, "last_log_date": None},
            "badges": []
        },
        "product_cache": {}
    }
    
    save_users(users_data)
    app.logger.info(f"New user registered: {username}")
    return jsonify({"status": "success", "message": "User registered successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    users_data = load_users()
    user = users_data.get('users', {}).get(username)

    if user and check_password_hash(user.get('password', ''), password):
        session['username'] = username
        app.logger.info(f"User logged in: {username}")
        return jsonify({"status": "success", "username": username})
    
    return jsonify({"status": "error", "message": "Invalid username or password"}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    username = session.pop('username', None)
    if username:
        app.logger.info(f"User logged out: {username}")
    return jsonify({"status": "success"})

@app.route('/api/session/check', methods=['GET'])
def check_session():
    username = session.get('username')
    if username:
        return jsonify({"logged_in": True, "username": username})
    return jsonify({"logged_in": False})


# --- User Gamification Data ---
@app.route('/api/user/data', methods=['GET'])
def get_user_data():
    username = session.get('username')
    if not username:
        return jsonify({"status": "error", "message": "Not logged in"}), 401
    
    users_data = load_users()
    user_data = users_data.get('users', {}).get(username)
    
    if not user_data:
         return jsonify({"status": "error", "message": "User not found"}), 404
         
    # Check and reset daily sugar if the date has changed
    today_str = date.today().isoformat()
    last_consumed_date = user_data.get('gamification_state', {}).get('lifetime_stats', {}).get('last_consumed_date')
    
    if last_consumed_date != today_str:
        user_data['gamification_state']['lifetime_stats']['daily_sugar_consumed_g'] = 0
        user_data['gamification_state']['lifetime_stats']['last_consumed_date'] = today_str
        # No need to save here, as this is a read operation and we don't want to save on every GET
        # The data will be saved when the user performs an action (POST)

    return jsonify({
        "gamification_state": user_data.get('gamification_state'),
        "product_cache": user_data.get('product_cache')
    })

@app.route('/api/user/data', methods=['POST'])
def save_user_data():
    username = session.get('username')
    if not username:
        return jsonify({"status": "error", "message": "Not logged in"}), 401

    new_data = request.get_json()
    users_data = load_users()
    
    if username in users_data.get('users', {}):
        # Update only the specific fields to avoid overwriting password
        users_data['users'][username]['gamification_state'] = new_data.get('gamification_state')
        users_data['users'][username]['product_cache'] = new_data.get('product_cache')
        save_users(users_data)
        return jsonify({"status": "success"})
        
    return jsonify({"status": "error", "message": "User not found"}), 404

# --- OpenFoodFacts Proxy ---
@app.route("/api/proxy/product/<barcode>")
def product_proxy(barcode):
    api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    try:
        response = requests.get(api_url, verify=False)
        response.raise_for_status()
        data = response.json()
        if data.get("status") == 0 or "product" not in data:
            return jsonify({"status": "error", "message": "Product not found"}), 404

        product = data.get('product', {})
        product_quantity = product.get('product_quantity')
        
        # Fallback if product_quantity is not provided but quantity string is
        if not product_quantity:
            import re
            q_str = product.get('quantity', '')
            match = re.search(r'([\d.]+)', str(q_str))
            if match:
                product_quantity = match.group(1)

        sugars_100g = product.get('nutriments', {}).get('sugars_100g')

        total_sugar = None
        if product_quantity is not None and sugars_100g is not None:
            try:
                total_sugar = (float(product_quantity) / 100) * float(sugars_100g)
            except (ValueError, TypeError):
                total_sugar = None # Or some other default/error value

        # Pass the total calculated container sugar into `sugars_serving`
        # so the frontend calculates the intake correctly.
        # We leave `sugars_100g` alone so the frontend can accurately 
        # determine if a drink is sugar-free (< 0.5g/100ml).
        if total_sugar is not None:
            if 'nutriments' not in data['product']:
                data['product']['nutriments'] = {}
            data['product']['nutriments']['sugars_serving'] = total_sugar

        return jsonify(data)
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error proxying request for barcode {barcode}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# --- Frontend Serving ---
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/manifest.json")
def serve_manifest():
    return app.send_static_file('manifest.json')

@app.route("/test")
def test_page():
    return render_template("test_runner.html")

# --- Main Execution ---
if __name__ == "__main__":
    app.logger.info("Starting SugarSwap Flask application...")
    # Running on plain HTTP, as SSL termination is handled by a reverse proxy
    app.run(host='::', port=5000, debug=True)
