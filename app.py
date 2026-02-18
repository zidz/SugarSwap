import requests
from flask import Flask, jsonify, render_template, request
import logging
from logging.handlers import RotatingFileHandler
import os

app = Flask(__name__)

# --- Logging Configuration ---
log_dir = 'logs'
log_file = os.path.join(log_dir, 'app.log')
os.makedirs(log_dir, exist_ok=True) # Ensure log directory exists

# Set up rotating file handler for application logs
handler = RotatingFileHandler(log_file, maxBytes=10000, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

# Add handler to Flask's app logger
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO) # Set default logging level

# Also configure Werkzeug's logger (for HTTP access logs)
logging.getLogger('werkzeug').addHandler(handler)
logging.getLogger('werkzeug').setLevel(logging.INFO)


@app.route("/")
def index():
    """Serves the main HTML file."""
    return render_template("index.html")

@app.route("/api/proxy/product/<barcode>")
def product_proxy(barcode):
    """
    Proxies requests to the Open Food Facts API to avoid CORS issues.
    Fetches product data based on the provided barcode.
    """
    api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    try:
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        data = response.json()
        if data.get("status") == 0 or "product" not in data:
            app.logger.warning(f"Product not found for barcode: {barcode}")
            return jsonify({"status": "error", "message": "Product not found"}), 404
            
        app.logger.info(f"Successfully fetched product data for barcode: {barcode}")
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error proxying request for barcode {barcode}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/manifest.json")
def serve_manifest():
    """Serves the PWA manifest file."""
    return app.send_static_file('manifest.json')

@app.route("/test")
def test_page():
    """Serves the frontend test runner."""
    return render_template("test_runner.html")

if __name__ == "__main__":
    app.logger.info("Starting SugarSwap Flask application...")
    # Listen on all available IPv4 and IPv6 interfaces
    app.run(debug=True, host='::', port=5000)
