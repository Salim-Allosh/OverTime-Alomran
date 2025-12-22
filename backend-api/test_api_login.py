"""اختبار تسجيل الدخول عبر API"""
import requests
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# اختبار تسجيل الدخول
url = "http://localhost:8000/auth/login"
data = {
    "username": "admin",
    "password": "admin123"
}

print("="*60)
print("اختبار تسجيل الدخول عبر API")
print("="*60)
print(f"\nالمحاولة: {url}")
print(f"البيانات: {data}\n")

try:
    # إرسال الطلب كـ form-data
    response = requests.post(url, data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"\n✓ نجح تسجيل الدخول!")
        print(f"Token: {result.get('access_token', 'N/A')}")
    else:
        print(f"\n✗ فشل تسجيل الدخول")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("\n✗ لا يمكن الاتصال بالخادم")
    print("تأكد من أن الخادم يعمل على http://localhost:8000")
except Exception as e:
    print(f"\n✗ خطأ: {e}")


