import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
found_first = False

for i, line in enumerate(lines):
    if 'const formatArabicText = (text) => {' in line:
        if not found_first:
            new_lines.append(line)
            found_first = True
        else:
            # Skip this duplicate line and its body (next 3 lines usually)
            continue 
    elif 'const formatNumber = (num, decimals = 2) => {' in line:
        # Check for formatNumber duplicates too while we are at it
        pass # Handle if needed
    else:
        new_lines.append(line)

# Let's do a cleaner way: replace all but keep the first
content = "".join(lines)

# Keep only the first occurrence of these common helpers
def remove_duplicates(text, pattern_start, pattern_end):
    parts = text.split(pattern_start)
    if len(parts) > 2:
        # Keep first part and first occurrence, then clean rest
        cleaned = parts[0] + pattern_start + parts[1]
        for p in parts[2:]:
            # Find the end of the function body and remove it
            end_idx = p.find(pattern_end)
            if end_idx != -1:
                cleaned += p[end_idx + len(pattern_end):]
            else:
                cleaned += p
        return cleaned
    return text

content = remove_duplicates(content, "const formatArabicText = (text) => {", "  };")
content = remove_duplicates(content, "const formatNumber = (num, decimals = 2) => {", "  };")

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Removed duplicate helper functions")
