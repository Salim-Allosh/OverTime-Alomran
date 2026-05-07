import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace generateMonthlyReportsPDF to be async and fetch stats
# First update function definition
content = content.replace("const generateMonthlyReportsPDF = (group, branchName) => {", "const generateMonthlyReportsPDF = async (group, branchName) => {")

# Find the button call for reports PDF
content = content.replace("generateMonthlyReportsPDF(group, branchGroup.branchName)", "await generateMonthlyReportsPDF(group, branchGroup.branchName)")

# Insert stats fetching at the beginning of the function
stats_code = """      // جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات
      let statsData = null;
      try {
        const statsUrl = `/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`;
        statsData = await apiGet(statsUrl, token);
      } catch (err) {
        console.error("Error fetching stats for Monthly Reports PDF:", err);
      }

      const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};
      
      const totalMonthlyContracts = parseInt(branchStats.total_monthly_contracts) || 0;
      const totalContractsValue = parseFloat(branchStats.total_contracts_value) || 0;
      const totalPaidAmount = parseFloat(branchStats.total_paid_amount) || 0;
      const totalRemainingAmount = parseFloat(branchStats.total_remaining_amount) || 0;
      const totalNetAmount = parseFloat(branchStats.total_net_amount) || 0;
      const totalFeeAmount = parseFloat(branchStats.total_fees) || (totalPaidAmount - totalNetAmount);
      const totalOtherColl = parseFloat(branchStats.total_other_collections) || 0;"""

# Replace the summary block in Daily Reports PDF to include contract stats
old_summary = """      // Summary
      const totalReports = group.reports.length;
      const totalDailyCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0);
      const totalHotCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0);
      const totalWalkIns = group.reports.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0);
      const totalVisits = group.reports.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0);

      docDefinition.content.push(
        {
          text: formatArabicText('ملخص التقارير'),"""

new_summary = stats_code + """
      // Summary
      const totalReports = group.reports.length;
      const totalDailyCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0);
      const totalHotCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0);
      const totalWalkIns = group.reports.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0);
      const totalVisits = group.reports.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0);

      docDefinition.content.push(
        {
          text: formatArabicText('ملخص النشاط والعقود'),"""

content = content.replace(old_summary, new_summary)

# Update the PDF columns to include contract stats in the Daily Reports PDF summary
old_columns = """      docDefinition.content.push(
        {
          text: formatArabicText('ملخص النشاط والعقود'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('عدد التقارير'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalReports), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الاتصالات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalDailyCalls), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalHotCalls), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الووك ان'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalWalkIns), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalVisits), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },"""

new_columns_extended = """      docDefinition.content.push(
        {
          text: formatArabicText('ملخص النشاط والعقود'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('التقارير'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalReports, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الاتصالات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalDailyCalls, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('هوت كول'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalHotCalls, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('ووك ان'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalWalkIns, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الزيارات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalVisits, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('العقود الشهرية'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalMonthlyContracts, 0), style: 'statValue', alignment: 'center', color: '#5A7ACD' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي المبيعات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalContractsValue), style: 'statValue', alignment: 'center' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المدفوع'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalPaidAmount), style: 'statValue', alignment: 'center', color: '#10B981' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المتبقي'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalRemainingAmount), style: 'statValue', alignment: 'center', color: '#DC2626' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('الصافي'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalNetAmount), style: 'statValue', alignment: 'center', color: '#5A7ACD' }
              ],
              margin: [2, 0, 2, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('النسبة'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalFeeAmount), style: 'statValue', alignment: 'center', color: '#F59E0B' }
              ],
              margin: [2, 0, 2, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },"""

content = content.replace(old_columns, new_columns_extended)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Daily Reports PDF updated to match comprehensive stats")
