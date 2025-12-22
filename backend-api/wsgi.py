"""
WSGI entry point for production deployment.
This file is used by hosting providers like GoDaddy to run the FastAPI application.
"""
import sys
import os
from pathlib import Path

# Add the backend-api directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "src"))

# Import the FastAPI app
from src.main import app

# This is the WSGI application that hosting providers will call
application = app

