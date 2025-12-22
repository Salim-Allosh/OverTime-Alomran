#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to retrieve all super admin accounts from database using urllib
"""
import sys
import codecs
import urllib.request
import json

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

BASE_URL = "http://localhost:8000"

def get_super_admin_accounts():
    """Get all super admin accounts from database"""
    try:
        url = f"{BASE_URL}/admin/super-admin-accounts"
        req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            print("=" * 80)
            print("حسابات السوبر أدمن في قاعدة البيانات")
            print("=" * 80)
            print()
            
            accounts = data.get('accounts', [])
            
            if not accounts:
                print("⚠ لا توجد حسابات سوبر أدمن في قاعدة البيانات!")
                return
            
            for i, account in enumerate(accounts, 1):
                print(f"الحساب #{i}:")
                print(f"  - المعرف (ID): {account['id']}")
                print(f"  - اسم المستخدم: {account['username']}")
                print(f"  - الفرع: {account['branch_name']} (ID: {account['branch_id']})")
                print(f"  - سوبر أدمن: {'نعم' if account['is_super_admin'] else 'لا'}")
                print(f"  - يمكن الموافقة على المسودات: {'نعم' if account['can_approve_drafts'] else 'لا'}")
                print(f"  - نوع الحساب: {account['account_type'] or 'غير محدد'}")
                print(f"  - مخفي: {'نعم' if account.get('is_hidden') else 'لا'}")
                print()
            
            print("=" * 80)
            print(f"إجمالي عدد حسابات السوبر أدمن: {len(accounts)}")
            print("=" * 80)
            
            return accounts
    except urllib.error.HTTPError as e:
        print(f"✗ خطأ HTTP: {e.code}")
        if e.code == 404:
            print("  السيرفر لا يستجيب. تأكد من أن السيرفر يعمل على http://localhost:8000")
        return None
    except urllib.error.URLError as e:
        print(f"✗ خطأ في الاتصال: {e}")
        print("  تأكد من أن السيرفر يعمل على http://localhost:8000")
        return None
    except Exception as e:
        print(f"✗ خطأ: {e}")
        import traceback
        traceback.print_exc()
        return None

def get_all_accounts():
    """Get all accounts from database"""
    try:
        url = f"{BASE_URL}/admin/all-accounts"
        req = urllib.request.Request(url)
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            print()
            print("=" * 80)
            print("جميع الحسابات في قاعدة البيانات")
            print("=" * 80)
            print()
            
            accounts = data.get('accounts', [])
            
            for i, account in enumerate(accounts, 1):
                account_type = "سوبر أدمن" if account['is_super_admin'] else account.get('account_type', 'غير محدد')
                hidden_label = " (مخفي)" if account.get('is_hidden') else ""
                print(f"{i}. {account['username']} - {account_type}{hidden_label} - الفرع: {account['branch_name']}")
            
            print()
            print("=" * 80)
            print(f"إجمالي عدد الحسابات: {len(accounts)}")
            print("=" * 80)
            
            return accounts
    except urllib.error.HTTPError as e:
        print(f"✗ خطأ HTTP: {e.code}")
        return None
    except urllib.error.URLError as e:
        print(f"✗ خطأ في الاتصال: {e}")
        return None
    except Exception as e:
        print(f"✗ خطأ: {e}")
        return None

def main():
    print()
    print("جاري استرجاع بيانات الحسابات من قاعدة البيانات...")
    print()
    
    # Get super admin accounts
    super_admin_accounts = get_super_admin_accounts()
    
    # Get all accounts
    all_accounts = get_all_accounts()
    
    if super_admin_accounts:
        print()
        print("\nملاحظات:")
        print("- الحسابات المخفية (is_hidden = TRUE) لا تظهر في واجهة الإدارة")
        print("- جميع حسابات السوبر أدمن يمكنها تسجيل الدخول والوصول إلى النظام")
        print("- الحساب المخفي 'salim' يجب أن يكون موجوداً ويمكنه تسجيل الدخول")
        print()
        
        # Show login instructions
        print("=" * 80)
        print("تعليمات تسجيل الدخول:")
        print("=" * 80)
        for account in super_admin_accounts:
            if account.get('is_hidden'):
                print(f"\nالحساب المخفي:")
                print(f"  اسم المستخدم: {account['username']}")
                print(f"  كلمة السر: S@|!/\\/\\+971")
            else:
                print(f"\nالحساب: {account['username']}")
                print(f"  (كلمة السر غير معروفة - يجب إعادة تعيينها إذا لزم الأمر)")
        print()

if __name__ == "__main__":
    main()

