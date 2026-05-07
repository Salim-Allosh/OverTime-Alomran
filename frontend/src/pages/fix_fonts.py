import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will ensure ALL pdfMake.fonts definitions have both normal and bold for all font names used.
# And I will simplify it to use Cairo for everything.

font_definition = """      pdfMake.fonts = {
        Cairo: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        },
        Nillima: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        },
        Roboto: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Bold.ttf'
        }
      };"""

# I will replace any existing pdfMake.fonts block with this complete one.
pattern = re.compile(r'pdfMake\.fonts = \{.*?\};', re.DOTALL)
content = re.sub(pattern, font_definition, content)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Fixed Font definitions for PDF")
