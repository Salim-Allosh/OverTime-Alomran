import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the table header to add '#' column
old_header = """          { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },"""
new_header = """          { text: formatArabicText('#'), style: 'tableHeader', alignment: 'center' },
          { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },"""

content = content.replace(old_header, new_header)

# 2. Update the table row mapping to include the index
old_row_loop = """      group.contracts.forEach(contract => {"""
new_row_loop = """      group.contracts.forEach((contract, index) => {"""

content = content.replace(old_row_loop, new_row_loop)

old_row_start = """        tableBody.push([
          { text: formatArabicText(contract.contract_number || '-'), alignment: 'center', fontSize: 7 },"""

new_row_start = """        tableBody.push([
          { text: String(index + 1), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.contract_number || '-'), alignment: 'center', fontSize: 7 },"""

content = content.replace(old_row_start, new_row_start)

# 3. Update table widths to accommodate the new column
old_widths = "widths: ['auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],"
new_widths = "widths: [15, 'auto', '*', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],"

content = content.replace(old_widths, new_widths)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Added index column '#' to Monthly Contracts PDF")
