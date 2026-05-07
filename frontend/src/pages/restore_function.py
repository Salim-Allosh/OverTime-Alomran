import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Restore the missing generateMonthlyContractsPDF function
# I will insert it after generateMonthlyReportsPDF

new_function = """
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

      // جلب الإحصائيات من نفس مصدر البطاقة لضمان التطابق التام
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
        const paymentMethods = contract.payments?.map(p => {
          const method = paymentMethodsList.find(m => m.id === p.payment_method_id);
          return method ? method.name : 'نقدي';
        }) || [];
        const uniqueMethods = [...new Set(paymentMethods)];
        const paymentMethodsText = uniqueMethods.length > 0 ? uniqueMethods.join(' + ') : (contract.payment_method?.name || 'نقدي');

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
          { text: formatArabicText(contract.contract_type || 'جديد'), alignment: 'center', fontSize: 7 }
        ]);
      });

      docDefinition.content.push({
        table: {
          headerRows: 1,
          widths: [15, 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: tableBody
        },
        layout: {
          fillColor: (i) => i === 0 ? null : (i % 2 === 0 ? '#F9FAFB' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#E5E7EB',
          vLineColor: () => '#E5E7EB'
        }
      });

      pdfMake.createPdf(docDefinition).download(`Contracts_${branchName}_${group.monthName}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
    }
  };
"""

# Find the end of generateMonthlyReportsPDF to insert after it
insert_point = content.find("pdfDoc.download(`تقرير_التقارير_اليومية_${branchName}_${group.monthName}_${group.year}.pdf`);")
if insert_point != -1:
    # Find the next closing brace
    next_brace = content.find("}", insert_point)
    next_brace = content.find("}", next_brace + 1)
    
    # We will just insert it after generateMonthlyReportsPDF closing
    # Looking for a unique marker after the function
    content = content.replace("const generateMonthlyReportsPDF = (group, branchName) => {", new_function + "\\n\\n  const generateMonthlyReportsPDF = (group, branchName) => {")
    
    # Also fix the call to use await
    content = content.replace("generateMonthlyContractsPDF(group, branchGroup.branchName)", "await generateMonthlyContractsPDF(group, branchGroup.branchName)")

    with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: Restored generateMonthlyContractsPDF function and updated calls")
else:
    print("Insertion point not found")
