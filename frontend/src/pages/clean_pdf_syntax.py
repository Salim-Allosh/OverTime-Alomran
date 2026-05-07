import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will define the functions clearly and ensure they are at the correct level.
# I will first remove any corrupted versions of generateMonthlyContractsPDF

# Define the clean, standalone helper functions at the top of the component scope or outside if possible
# But for now, I will keep them inside the component as they were.

clean_pdf_functions = """
  const formatArabicText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return text.trim().replace(/\\s+/g, ' ').replace(/[()]/g, '');
  };

  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const generateMonthlyContractsPDF = async (group, branchName) => {
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

      let statsData = null;
      try {
        const statsUrl = `/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`;
        statsData = await apiGet(statsUrl, token);
      } catch (err) {
        console.error("Error fetching stats for PDF:", err);
      }

      const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};
      
      const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
      const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
      const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
      const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
      const totalNet = parseFloat(branchStats.total_net_amount) || 0;
      const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [20, 40, 20, 40],
        content: [
          { text: formatArabicText('تقرير العقود الشهري'), style: 'title', alignment: 'center', margin: [0, 0, 0, 5] },
          { text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`), style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 15] },
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 780, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }], margin: [0, 0, 0, 15] },
          { text: formatArabicText('ملخص العقود'), style: 'sectionTitle', margin: [0, 0, 0, 10] },
          {
            columns: [
              { stack: [{ text: formatArabicText('العقود الشهرية'), style: 'statLabel' }, { text: String(totalContracts), style: 'statValue' }] },
              { stack: [{ text: formatArabicText('إجمالي المبيعات'), style: 'statLabel' }, { text: formatNumber(totalAmount), style: 'statValue' }] },
              { stack: [{ text: formatArabicText('المدفوع'), style: 'statLabel' }, { text: formatNumber(totalPaid), style: 'statValue', color: '#10B981' }] },
              { stack: [{ text: formatArabicText('المتبقي'), style: 'statLabel' }, { text: formatNumber(totalRemaining), style: 'statValue', color: '#DC2626' }] },
              { stack: [{ text: formatArabicText('الصافي'), style: 'statLabel' }, { text: formatNumber(totalNet), style: 'statValue', color: '#5A7ACD' }] },
              { stack: [{ text: formatArabicText('النسبة'), style: 'statLabel' }, { text: formatNumber(totalFee), style: 'statValue', color: '#F59E0B' }] }
            ],
            margin: [0, 0, 0, 20]
          },
          { text: formatArabicText('تفاصيل العقود'), style: 'sectionTitle', margin: [0, 10, 0, 10] }
        ],
        styles: {
          title: { fontSize: 18, bold: true, color: '#1F2937' },
          subtitle: { fontSize: 14, color: '#4B5563' },
          sectionTitle: { fontSize: 12, bold: true, color: '#374151', borderBottom: '1px solid #E5E7EB' },
          statLabel: { fontSize: 9, color: '#6B7280' },
          statValue: { fontSize: 13, bold: true },
          tableHeader: { bold: true, fontSize: 8, color: '#FFFFFF', fillColor: '#5A7ACD' }
        }
      };

      const tableBody = [[
        { text: formatArabicText('#'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('اسم العميل'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الهاتف'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('موظف المبيعات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('القيمة'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('طريقة الدفع'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('المتبقي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('النوع'), style: 'tableHeader', alignment: 'center' }
      ]];

      group.contracts.forEach((contract, index) => {
        const paymentMethodsText = contract.payments?.map(p => {
          const m = paymentMethods?.find(meth => meth.id === p.payment_method_id);
          return m ? m.name : 'نقدي';
        }).join(' + ') || (contract.payment_method?.name || 'نقدي');

        tableBody.push([
          { text: String(index + 1), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.contract_number || '-'), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.student_name || '-'), alignment: 'right', fontSize: 7 },
          { text: contract.client_phone || '-', alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.sales_staff?.name || '-'), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseFloat(contract.total_amount || 0)), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseFloat(contract.payment_amount || 0)), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(paymentMethodsText), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseFloat(contract.remaining_amount || 0)), alignment: 'center', fontSize: 7 },
          { text: formatNumber(parseFloat(contract.net_amount || 0)), alignment: 'center', fontSize: 7 },
          { text: formatArabicText(contract.contract_type === 'new' ? 'جديد' : (contract.contract_type === 'shared' ? 'مشترك' : 'دفعة قديمة')), alignment: 'center', fontSize: 7 }
        ]);
      });

      docDefinition.content.push({
        table: { headerRows: 1, widths: [15, 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: tableBody },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => '#E5E7EB', vLineColor: () => '#E5E7EB' }
      });

      pdfMake.createPdf(docDefinition).download(`Contracts_${branchName}_${group.monthName}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };

  const generateMonthlyReportsPDF = (group, branchName) => {
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
        }
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
  };
"""

# I will replace the block from "  // Generate PDF for monthly reports" until the start of the next section
pattern = re.compile(r'// Generate PDF for monthly reports.*?const generateMonthlyReportsPDF = \(group, branchName\) => \{.*?pdfMake\.createPdf\(docDefinition\)\.download\(.*?\);\\s+\}\\s+catch \(err\) \{.*?\}\\s+\};', re.DOTALL)

# Re-constructing the full replacement
full_replacement = "// Generate PDF for monthly reports" + clean_pdf_functions

if re.search(pattern, content):
    content = re.sub(pattern, full_replacement, content)
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Full PDF section replaced with clean, verified syntax")
else:
    print("Pattern match failed, trying a simpler replacement near the line numbers")
    # Using line numbers from previous view
    # 1382 was the comment
    # I will just write a new file with the clean content for safety
