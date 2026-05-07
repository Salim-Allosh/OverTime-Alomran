with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove 'await ' before generateMonthlyContractsPDF calls
content = content.replace('await generateMonthlyContractsPDF', 'generateMonthlyContractsPDF')

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Removed await from function calls")
