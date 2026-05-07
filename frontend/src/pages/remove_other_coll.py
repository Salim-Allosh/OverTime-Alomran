import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the totalOtherCollections variable calculation if it exists
content = content.replace("const totalOtherCollections = parseFloat(branchStats.total_other_collections) || 0;", "")

# 2. Find and remove the "Other Collections" stack from the PDF content
# It should be in the docDefinition.content.push section for Monthly Contracts PDF

other_coll_pattern = re.compile(r'\{\s+width: \'\*\',.*?stack: \[.*?formatArabicText\(\'تحصيلات فترات أخرى\'\).*?margin: \[3, 0, 3, 5\].*?\},', re.DOTALL)

if re.search(other_coll_pattern, content):
    content = re.sub(other_coll_pattern, "", content)
    print("SUCCESS: Removed 'Other Collections' stack from PDF")
else:
    print("Pattern not found, trying simplified removal...")
    # Alternative: if labels vary
    content = content.replace("{ text: formatArabicText('تحصيلات فترات أخرى'), style: 'statLabel', alignment: 'center' },", "")

# 3. Clean up the columns layout to ensure it looks good with 6 items instead of 7
# The current layout has 2 rows of columns. I will check the structure.

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
