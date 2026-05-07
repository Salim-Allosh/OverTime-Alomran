with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

open_braces = content.count('{')
close_braces = content.count('}')
open_parens = content.count('(')
close_parens = content.count(')')

print(f"Braces: {{ = {open_braces}, }} = {close_braces}")
print(f"Parens: ( = {open_parens}, ) = {close_parens}")

if open_braces != close_braces:
    print("WARNING: Braces are UNBALANCED")
if open_parens != close_parens:
    print("WARNING: Parentheses are UNBALANCED")
