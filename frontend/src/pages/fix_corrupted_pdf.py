import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The generateMonthlyReportsPDF function is corrupted with contract stats.
# I will rewrite it to be clean and focus ONLY on daily reports activity.

clean_reports_pdf = """  const generateMonthlyReportsPDF = (group, branchName) => {
    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = {
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
      };

      const formatArabicText = (text) => {
        if (!text || typeof text !== 'string') return text;
        return text.trim().replace(/\\\\s+/g, ' ').replace(/[()]/g, '');
      };

      const formatNumber = (num, decimals = 2) => {
        if (typeof num !== 'number' || isNaN(num)) return num;
        return num.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      };

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 9, alignment: 'right' },
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 50, 30, 50],
        content: [],
        info: { title: `تقرير التقارير اليومية - ${group.monthName} ${group.year}` },
        footer: function (currentPage, pageCount) {
          return { text: formatArabicText(`صفحة ${currentPage} من ${pageCount}`), alignment: 'center', fontSize: 8, color: '#6B7280', margin: [0, 10, 0, 0] };
        }
      };

      docDefinition.content.push(
        { text: formatArabicText('تقرير التقارير اليومية'), style: 'title', alignment: 'center', margin: [0, 0, 0, 5] },
        { text: formatArabicText('مركز العمران للتدريب والتطوير'), style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 3] },
        { text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`), style: 'subtitle2', alignment: 'center', margin: [0, 0, 0, 15] },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] }
      );

      const totalReports = group.reports.length;
      const totalDailyCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.daily_calls) || 0), 0);
      const totalHotCalls = group.reports.reduce((sum, r) => sum + (parseInt(r.hot_calls) || 0), 0);
      const totalWalkIns = group.reports.reduce((sum, r) => sum + (parseInt(r.walk_ins) || 0), 0);
      const totalVisits = group.reports.reduce((sum, r) => sum + (parseInt(r.number_of_visits) || 0), 0);

      docDefinition.content.push(
        { text: formatArabicText('ملخص التقارير'), style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 10] },
        {
          columns: [
            { width: '*', stack: [{ text: formatArabicText('عدد التقارير'), style: 'statLabel', alignment: 'center' }, { text: formatNumber(totalReports, 0), style: 'statValue', alignment: 'center' }], margin: [3, 0, 3, 5] },
            { width: '*', stack: [{ text: formatArabicText('إجمالي الاتصالات'), style: 'statLabel', alignment: 'center' }, { text: formatNumber(totalDailyCalls, 0), style: 'statValue', alignment: 'center' }], margin: [3, 0, 3, 5] },
            { width: '*', stack: [{ text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' }, { text: formatNumber(totalHotCalls, 0), style: 'statValue', alignment: 'center' }], margin: [3, 0, 3, 5] },
            { width: '*', stack: [{ text: formatArabicText('إجمالي الووك ان'), style: 'statLabel', alignment: 'center' }, { text: formatNumber(totalWalkIns, 0), style: 'statValue', alignment: 'center' }], margin: [3, 0, 3, 5] },
            { width: '*', stack: [{ text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' }, { text: formatNumber(totalVisits, 0), style: 'statValue', alignment: 'center' }], margin: [3, 0, 3, 5] }
          ],
          margin: [0, 0, 0, 15]
        },
        { text: formatArabicText('تفاصيل التقارير'), style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 10] }
      );

      const tableBody = [[
        { text: formatArabicText('التاريخ'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الموظف'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('اتصالات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('هوت كول'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('ووك ان'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('زيارات'), style: 'tableHeader', alignment: 'center' }
      ]];

      group.reports.forEach(report => {
        tableBody.push([
          { text: report.report_date, alignment: 'center', fontSize: 8 },
          { text: formatArabicText(report.sales_staff?.name || '-'), alignment: 'center', fontSize: 8 },
          { text: String(report.daily_calls || 0), alignment: 'center', fontSize: 8 },
          { text: String(report.hot_calls || 0), alignment: 'center', fontSize: 8 },
          { text: String(report.walk_ins || 0), alignment: 'center', fontSize: 8 },
          { text: String(report.number_of_visits || 0), alignment: 'center', fontSize: 8 }
        ]);
      });

      docDefinition.content.push({
        table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: tableBody },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20]
      });

      docDefinition.styles = {
        title: { fontSize: 16, bold: true, color: '#1F2937' },
        subtitle: { fontSize: 12, color: '#4B5563' },
        subtitle2: { fontSize: 11, color: '#6B7280' },
        sectionTitle: { fontSize: 13, bold: true, color: '#374151', borderBottom: '1px solid #E5E7EB', paddingBottom: 5 },
        statLabel: { fontSize: 9, color: '#6B7280' },
        statValue: { fontSize: 12, bold: true },
        tableHeader: { bold: true, fontSize: 9, color: '#FFFFFF', fillColor: '#5A7ACD' }
      };

      pdfMake.createPdf(docDefinition).download(`Reports_${branchName}_${group.monthName}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };"""

# I will replace the block starting from generateMonthlyReportsPDF until its end.
# I will use a very specific pattern to avoid matching other things.

import re
pattern = re.compile(r'const generateMonthlyReportsPDF = \(group, branchName\) => \{.*?pdfMake\.createPdf\(docDefinition\)\.download\(.*?\);\\s+\}\\s+catch \(err\) \{.*?\}\\s+\};', re.DOTALL)

if re.search(pattern, content):
    content = re.sub(pattern, clean_reports_pdf, content)
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Cleaned up generateMonthlyReportsPDF")
else:
    print("Regex failed. I will use a line-based replacement.")
    # I know it starts at 1515 and seems to go quite long.
    # I'll just write the whole middle section of the file if needed, but let's try a simpler replacement first.
