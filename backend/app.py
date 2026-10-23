import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import DATABASE_URL
from models import db
from routes.resumes import resumes_bp
from routes.files import files_bp
from routes.settings import settings_bp

def create_app():
    app = Flask(__name__)
    
    # Configure Database
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Enable CORS for frontend Next.js app
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)

    # Register blueprints
    app.register_blueprint(resumes_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(settings_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "healthy", "service": "Restail API"})

    with app.app_context():
        # Create database tables if they do not exist
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
