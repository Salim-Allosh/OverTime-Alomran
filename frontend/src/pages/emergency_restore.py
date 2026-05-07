import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

functions_code = """
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

  const generateMonthlyContractsPDF = (group, branchName) => {
    apiGet(`/statistics/comprehensive?year=${group.year}&month=${group.month}&branch_id=${group.branchId}`, token)
      .then(statsData => {
        const branchStats = statsData?.branches_comprehensive?.find(b => b.branch_id === group.branchId) || {};
        const totalContracts = parseInt(branchStats.total_monthly_contracts) || 0;
        const totalAmount = parseFloat(branchStats.total_contracts_value) || 0;
        const totalPaid = parseFloat(branchStats.total_paid_amount) || 0;
        const totalRemaining = parseFloat(branchStats.total_remaining_amount) || 0;
        const totalNet = parseFloat(branchStats.total_net_amount) || 0;
        const totalFee = parseFloat(branchStats.total_fees) || (totalPaid - totalNet);

        pdfMake.vfs = vfs;
        pdfMake.fonts = { Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf' } };

        const docDefinition = {
          defaultStyle: { font: 'Cairo', fontSize: 8, alignment: 'right' },
          pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [20, 40, 20, 40],
          content: [
            { text: formatArabicText('تقرير العقود الشهري'), fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 5] },
            { text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`), fontSize: 14, alignment: 'center', margin: [0, 0, 0, 15] },
            {
              columns: [
                { stack: [{ text: formatArabicText('العقود الشهرية'), fontSize: 9 }, { text: String(totalContracts), fontSize: 13, bold: true }] },
                { stack: [{ text: formatArabicText('إجمالي المبيعات'), fontSize: 9 }, { text: formatNumber(totalAmount), fontSize: 13, bold: true }] },
                { stack: [{ text: formatArabicText('المدفوع'), fontSize: 9 }, { text: formatNumber(totalPaid), fontSize: 13, bold: true, color: '#10B981' }] },
                { stack: [{ text: formatArabicText('المتبقي'), fontSize: 9 }, { text: formatNumber(totalRemaining), fontSize: 13, bold: true, color: '#DC2626' }] },
                { stack: [{ text: formatArabicText('الصافي'), fontSize: 9 }, { text: formatNumber(totalNet), fontSize: 13, bold: true, color: '#5A7ACD' }] },
                { stack: [{ text: formatArabicText('النسبة'), fontSize: 9 }, { text: formatNumber(totalFee), fontSize: 13, bold: true, color: '#F59E0B' }] }
              ], margin: [0, 0, 0, 20]
            }
          ]
        };

        const tableBody = [[
          { text: formatArabicText('#'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('رقم العقد'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('اسم العميل'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('الهاتف'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('موظف المبيعات'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('القيمة'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('المدفوع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('طريقة الدفع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('المتبقي'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('الصافي'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
          { text: formatArabicText('النوع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' }
        ]];

        group.contracts.forEach((contract, index) => {
          const pmText = contract.payments?.map(p => {
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
            { text: formatArabicText(pmText), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.remaining_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.net_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatArabicText(contract.contract_type === 'new' ? 'جديد' : 'مشترك/قديم'), alignment: 'center', fontSize: 7 }
          ]);
        });

        docDefinition.content.push({
          table: { headerRows: 1, widths: [15, 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: tableBody },
          layout: 'lightHorizontalLines'
        });

        pdfMake.createPdf(docDefinition).download(`Contracts_${branchName}_${group.monthName}.pdf`);
      })
      .catch(err => { console.error("PDF Error:", err); showError("خطأ في إنشاء PDF"); });
  };

  const generateMonthlyReportsPDF = (group, branchName) => {
    pdfMake.vfs = vfs;
    pdfMake.fonts = { Cairo: { normal: 'Cairo-Regular.ttf', bold: 'Cairo-Bold.ttf' } };
    const docDefinition = {
      defaultStyle: { font: 'Cairo', fontSize: 9, alignment: 'right' },
      content: [
        { text: formatArabicText('تقرير النشاط اليومي'), fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: formatArabicText(`${branchName} - ${group.monthName} ${group.year}`), alignment: 'center', margin: [0, 0, 0, 20] },
        { text: formatArabicText(`إجمالي التقارير: ${group.reports.length}`), margin: [0, 0, 0, 10] }
      ]
    };
    const tableBody = [[
      { text: formatArabicText('التاريخ'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
      { text: formatArabicText('الموظف'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
      { text: formatArabicText('اتصالات'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' },
      { text: formatArabicText('زيارات'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD' }
    ]];
    group.reports.forEach(r => {
      tableBody.push([
        { text: r.report_date, alignment: 'center' },
        { text: formatArabicText(r.sales_staff?.name || '-'), alignment: 'center' },
        { text: String(r.daily_calls || 0), alignment: 'center' },
        { text: String(r.number_of_visits || 0), alignment: 'center' }
      ]);
    });
    docDefinition.content.push({ table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto'], body: tableBody } });
    pdfMake.createPdf(docDefinition).download(`Reports_${branchName}_${group.monthName}.pdf`);
  };
"""

content = content.replace("  // Placeholder for functions", functions_code)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Cleaned and restored functions safely")
