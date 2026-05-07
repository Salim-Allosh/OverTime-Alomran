import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the boundaries of the corrupted section
# It starts around the first occurrence of // Generate PDF for monthly reports
# And ends before const generateDailyReportPDF

start_marker = "// Generate PDF for monthly reports"
end_marker = "  // Generate PDF for a specific daily report"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    clean_section = """// Generate PDF for monthly reports
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

  const generateMonthlyContractsPDF = async (group, branchName) => {
    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = {
        Cairo: {
          normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf',
          italics: 'Cairo-Regular.ttf', bolditalics: 'Cairo-Bold.ttf'
        }
      };

      let statsData = null;
      try {
        const statsUrl = `/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`;
        statsData = await apiGet(statsUrl, token);
      } catch (err) { console.error("Error fetching stats:", err); }

      const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};
      const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
      const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
      const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
      const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
      const totalNet = parseFloat(branchStats.total_net_amount) || 0;
      const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
        pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [20, 40, 20, 40],
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
            ], margin: [0, 0, 0, 20]
          },
          { text: formatArabicText('تفاصيل العقود'), style: 'sectionTitle', margin: [0, 10, 0, 10] }
        ],
        styles: {
          title: { fontSize: 18, bold: true }, subtitle: { fontSize: 14 },
          sectionTitle: { fontSize: 12, bold: true }, statLabel: { fontSize: 9, color: '#6B7280' },
          statValue: { fontSize: 13, bold: true }, tableHeader: { bold: true, fontSize: 8, color: '#FFFFFF', fillColor: '#5A7ACD' }
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
    } catch (err) { console.error("Error generating PDF:", err); }
  };

  const generateMonthlyReportsPDF = (group, branchName) => {
    try {
      pdfMake.vfs = vfs;
      pdfMake.fonts = { Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf' } };

      const docDefinition = {
        defaultStyle: { font: 'Cairo', fontSize: 9, alignment: 'right' },
        pageSize: 'A4', pageOrientation: 'portrait', pageMargins: [30, 50, 30, 50],
        content: [
          { text: formatArabicText('تقرير التقارير اليومية'), style: 'title', alignment: 'center', margin: [0, 0, 0, 5] },
          { text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`), alignment: 'center', margin: [0, 0, 0, 15] },
          {
            columns: [
              { stack: [{ text: formatArabicText('عدد التقارير'), style: 'statLabel' }, { text: String(group.reports.length), style: 'statValue' }] },
              { stack: [{ text: formatArabicText('إجمالي الاتصالات'), style: 'statLabel' }, { text: String(group.reports.reduce((s, r) => s + (parseInt(r.daily_calls) || 0), 0)), style: 'statValue' }] },
              { stack: [{ text: formatArabicText('إجمالي الزيارات'), style: 'statLabel' }, { text: String(group.reports.reduce((s, r) => s + (parseInt(r.number_of_visits) || 0), 0)), style: 'statValue' }] }
            ], margin: [0, 0, 0, 20]
          }
        ],
        styles: { title: { fontSize: 16, bold: true }, statLabel: { fontSize: 9, color: '#6B7280' }, statValue: { fontSize: 12, bold: true }, tableHeader: { bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' } }
      };

      const tableBody = [[
        { text: formatArabicText('التاريخ'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('الموظف'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('اتصالات'), style: 'tableHeader', alignment: 'center' },
        { text: formatArabicText('زيارات'), style: 'tableHeader', alignment: 'center' }
      ]];

      group.reports.forEach(report => {
        tableBody.push([
          { text: report.report_date, alignment: 'center' },
          { text: formatArabicText(report.sales_staff?.name || '-'), alignment: 'center' },
          { text: String(report.daily_calls || 0), alignment: 'center' },
          { text: String(report.number_of_visits || 0), alignment: 'center' }
        ]);
      });

      docDefinition.content.push({ table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto'], body: tableBody }, layout: 'lightHorizontalLines' });
      pdfMake.createPdf(docDefinition).download(`Reports_${branchName}_${group.monthName}.pdf`);
    } catch (err) { console.error("Error generating PDF:", err); }
  };

"""
    # Replacing the whole section
    new_content = content[:start_idx] + clean_section + content[end_idx:]
    
    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: Full surgical replacement of PDF section completed")
else:
    print("Markers not found")
