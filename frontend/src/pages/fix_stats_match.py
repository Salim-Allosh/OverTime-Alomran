import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the branch comparison logic to use parseInt and ensure it matches the stats data
old_find = "const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};"
new_find = "const branchStats = statsData?.branches_comprehensive?.find(b => parseInt(b.branch_id) === parseInt(group.branchId)) || {};"

content = content.replace(old_find, new_find)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Fixed branch comparison logic in PDF stats")
