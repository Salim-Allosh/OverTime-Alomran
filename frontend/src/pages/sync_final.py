
import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the generateMonthlyContractsPDF function and its summary block
pattern = re.compile(r'// جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات.*?// الأرقام من الإحصائيات.*?const totalOtherCollections = parseFloat\(branchStats\.total_other_collections\) \|\| 0;.*?const totalFee = parseFloat\(branchStats\.total_fees\) \|\| \(totalPaid - totalNet\);', re.DOTALL)

# Re-defining the clean stats block
stats_block = """      // جلب الإحصائيات من نفس مصدر البطاقة لضمان التطابق التام
      let statsData = null;
      try {
        const statsUrl = `/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`;
        statsData = await apiGet(statsUrl, token);
      } catch (err) {
        console.error("Error fetching stats for PDF:", err);
      }
      const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {}; 
      // مطابقة حقول البطاقة في صفحة الإحصائيات بالضبط
      const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
      const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
      const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
      const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
      const totalNet = parseFloat(branchStats.total_net_amount) || 0;
      const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);
      const totalOtherCollections = parseFloat(branchStats.total_other_collections) || 0;"""

# Apply replacement
if re.search(pattern, content):
    content = re.sub(pattern, stats_block, content)
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: PDF Summary strictly synced with Statistics Card logic")
else:
    print("Could not find the exact pattern to replace. Checking alternative...")
    # Alternative: if previous sync didn't use exactly that wording
    alternative_pattern = re.compile(r'// جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات.*?const totalFee = totalPaid - totalNet; // النسبة.*?const totalOtherCollections = getDirectPayments\(oldPaymentContracts\); // تحصيلات فترات أخرى', re.DOTALL)
    if re.search(alternative_pattern, content):
        content = re.sub(alternative_pattern, stats_block, content)
        with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS: PDF Summary synced via alternative pattern")
