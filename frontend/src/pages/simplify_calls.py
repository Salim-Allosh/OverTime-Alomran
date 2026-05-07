import re

# I will try to restore a semi-stable state by removing any async from generateMonthlyContractsPDF 
# and making sure it is defined simply.

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's fix the generateMonthlyContractsPDF call in the UI first.
# I will search for the download button.
button_pattern = r'<button[^>]*?onClick=\{\(e\) => \{\\s+e\.stopPropagation\(\);\\s+(?:await\\s+)?generateMonthlyContractsPDF\(group, branchGroup\.branchName\);\\s+\}\}'
replacement_button = '<button className="btn-small" onClick={(e) => { e.stopPropagation(); generateMonthlyContractsPDF(group, branchGroup.branchName); }}'

content = re.sub(button_pattern, replacement_button, content)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Simplified button calls")
