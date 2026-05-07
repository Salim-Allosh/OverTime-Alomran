import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the entire generateMonthlyContractsPDF function to make it async and fetch real stats
# First, let's find the function definition and replace it.

old_func_start = "  const generateMonthlyContractsPDF = (group, branchName) => {"
new_func_start = "  const generateMonthlyContractsPDF = async (group, branchName) => {"

# I need to fetch the stats inside the function
stats_fetch_code = """    // جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات
    let statsData = null;
    try {
      const statsUrl = `/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`;
      statsData = await apiGet(statsUrl, token);
    } catch (err) {
      console.error("Error fetching stats for PDF:", err);
    }

    const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};
    
    // الأرقام من الإحصائيات (نفس أرقام البطاقة)
    const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
    const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
    const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
    const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
    const totalNet = parseFloat(branchStats.total_net_amount) || 0;
    const totalOtherCollections = parseFloat(branchStats.total_other_collections) || 0;
    const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);"""

# I will use a python script to perform a more complex replacement
replacement_script = f"""
import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update function to be async
content = content.replace("const generateMonthlyContractsPDF = (group, branchName) => {{", "const generateMonthlyContractsPDF = async (group, branchName) => {{")

# Find the summary calculation block and replace it with the stats fetch
summary_pattern = re.compile(r'// Summary.*?// Summary - Uses same logic as Statistics page backend:.*?const totalOtherCollections = getDirectPayments\(oldPaymentContracts\); // تحصيلات فترات أخرى', re.DOTALL)

stats_code = \"\"\"      // جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات
      let statsData = null;
      try {{
        const statsUrl = `/statistics/comprehensive?year=${{group.year}}&month=${{group.month}}&branch_id=${{group.branchId}}`;
        statsData = await apiGet(statsUrl, token);
      }} catch (err) {{
        console.error("Error fetching stats for PDF:", err);
      }}

      const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {{}};
      
      // الأرقام من الإحصائيات (نفس أرقام البطاقة في صفحة الإحصائيات)
      const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
      const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
      const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
      const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
      const totalNet = parseFloat(branchStats.total_net_amount) || 0;
      const totalOtherCollections = parseFloat(branchStats.total_other_collections) || 0;
      const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);\"\"\"

content = re.sub(summary_pattern, stats_code, content)

# Also need to update the button click to use await
content = content.replace("generateMonthlyContractsPDF(group, branchGroup.branchName)", "await generateMonthlyContractsPDF(group, branchGroup.branchName)")

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
"""

# Let's write this python script and run it.
