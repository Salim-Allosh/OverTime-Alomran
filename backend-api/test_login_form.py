"""اختبار تسجيل الدخول بتنسيق form-data"""
import requests
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# اختبار تسجيل الدخول بتنسيق form-data (كما يرسله المتصفح)
url = "http://localhost:8000/auth/login"

# إرسال كـ form-data (application/x-www-form-urlencoded)
data = {
    "username": "admin",
    "password": "admin123"
}

print("="*60)
print("اختبار تسجيل الدخول بتنسيق form-data")
print("="*60)
print(f"\nالمحاولة: {url}")
print(f"البيانات: {data}")
print(f"Content-Type: application/x-www-form-urlencoded\n")

try:
    response = requests.post(url, data=data)  # data= يرسل كـ form-data
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ نجح تسجيل الدخول!")
        print(f"Token: {result.get('access_token', 'N/A')}")
    else:
        print(f"\n✗ فشل تسجيل الدخول")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"\n✗ خطأ: {e}")


