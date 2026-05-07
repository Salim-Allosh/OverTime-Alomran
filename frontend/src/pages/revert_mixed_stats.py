import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Revert generateMonthlyReportsPDF to show ONLY activity stats (Reports, Calls, etc.)
# Remove the async and the stats fetching I added there.

reports_pdf_old = """  const generateMonthlyReportsPDF = async (group, branchName) => {
    try {
      pdfMake.vfs = vfs;"""

reports_pdf_new = """  const generateMonthlyReportsPDF = (group, branchName) => {
    try {
      pdfMake.vfs = vfs;"""

content = content.replace(reports_pdf_old, reports_pdf_new)

# Fix the button call for reports PDF (remove await)
content = content.replace("await generateMonthlyReportsPDF(group, branchGroup.branchName)", "generateMonthlyReportsPDF(group, branchGroup.branchName)")

# Revert the summary block in Daily Reports PDF to original activity-only stats
summary_to_replace_pattern = re.compile(r'// جلب الإحصائيات الدقيقة من السيرفر لضمان مطابقة صفحة الإحصائيات.*?// Summary.*?docDefinition\.content\.push\(.*?text: formatArabicText\(\'ملخص النشاط والعقود\'\),.*?margin: \[0, 0, 0, 15\]\s+\},', re.DOTALL)

original_activity_summary = """      // Summary
      const totalReports = group.reports.length;
      const totalDailyCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0);
      const totalHotCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0);
      const totalWalkIns = group.reports.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0);
      const totalVisits = group.reports.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0);

      docDefinition.content.push(
        {
          text: formatArabicText('ملخص التقارير'),
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
                { text: formatNumber(totalReports, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الاتصالات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalDailyCalls, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalHotCalls, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الووك ان'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalWalkIns, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' },
                { text: formatNumber(totalVisits, 0), style: 'statValue', alignment: 'center' }
              ],
              margin: [3, 0, 3, 5]
            }
          ],
          margin: [0, 0, 0, 15]
        },"""

content = re.sub(summary_to_replace_pattern, original_activity_summary, content)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Reverted Daily Reports PDF to show only activity stats")
