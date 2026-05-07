import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the totalRemaining calculation to be per branch/month scope if applicable, 
# and ensure totalPaid/totalNet are robust.
# We also need to make sure the labels match the user's request exactly.

old_block = """      const totalPaid = getDirectPayments(salesContracts);
      const totalNet = getDirectNet(salesContracts);
      const totalRemaining = salesContracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0);
      const totalFee = totalPaid - totalNet; // النسبة
      const totalOtherCollections = getDirectPayments(oldPaymentContracts); // تحصيلات فترات أخرى"""

new_block = """      const totalPaid = getDirectPayments(salesContracts);
      const totalNet = getDirectNet(salesContracts);
      // المتبقي: هو مجموع المتبقي لكل العقود في هذه المجموعة (جديدة، مشتركة، وحتى التي عليها دفعات قديمة)
      const totalRemaining = group.contracts.reduce((sum, c) => sum + parseFloat(c.remaining_amount || 0), 0);
      const totalFee = totalPaid - totalNet; // النسبة (الصافي - المدفوع)
      const totalOtherCollections = getDirectPayments(oldPaymentContracts); // تحصيلات فترات أخرى"""

if old_block in content:
    content = content.replace(old_block, new_block)
    # Also update the labels in the PDF columns to match the user's exact wording if needed
    content = content.replace("formatArabicText('إجمالي المبيعات')", "formatArabicText('إجمالي المبيعات')") 
    
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: PDF calculations refined")
else:
    print("Block not found exactly as expected, please check the file.")
