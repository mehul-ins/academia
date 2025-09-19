import requests
import sys

try:
    response = requests.get('http://localhost:5002/health', timeout=2)
    if response.status_code == 200:
        sys.exit(0)
    else:
        sys.exit(1)
except Exception as e:
    print(f"Health check failed: {e}")
    sys.exit(1)