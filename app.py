import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

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
            return jsonify({"status": "error", "message": "Product not found"}), 404
            
        return jsonify(data)

    except requests.exceptions.RequestException as e:
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
    app.run(debug=True, port=5000)
