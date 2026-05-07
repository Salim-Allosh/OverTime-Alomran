import re

with open('DailySalesReportsPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the tableHeader and table rows to be centered and reversed
# I will define the new structure for generateMonthlyContractsPDF

new_table_logic = """        const tableHeader = [
          { text: formatArabicText('النوع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('الصافي'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('المتبقي'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('طريقة الدفع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('المدفوع'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('القيمة'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('موظف المبيعات'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('الهاتف'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('اسم العميل'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('رقم العقد'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' },
          { text: formatArabicText('#'), bold: true, color: '#FFFFFF', fillColor: '#5A7ACD', alignment: 'center' }
        ];

        const tableBody = [tableHeader];

        group.contracts.forEach((contract, index) => {
          const pmText = contract.payments?.map(p => {
            const m = paymentMethods?.find(meth => meth.id === p.payment_method_id);
            return m ? m.name : 'نقدي';
          }).join(' + ') || (contract.payment_method?.name || 'نقدي');

          tableBody.push([
            { text: formatArabicText(contract.contract_type === 'new' ? 'جديد' : 'مشترك/قديم'), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.net_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.remaining_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatArabicText(pmText), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.payment_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatNumber(parseFloat(contract.total_amount || 0)), alignment: 'center', fontSize: 7 },
            { text: formatArabicText(contract.sales_staff?.name || '-'), alignment: 'center', fontSize: 7 },
            { text: contract.client_phone || '-', alignment: 'center', fontSize: 7 },
            { text: formatArabicText(contract.student_name || '-'), alignment: 'center', fontSize: 7 },
            { text: formatArabicText(contract.contract_number || '-'), alignment: 'center', fontSize: 7 },
            { text: String(index + 1), alignment: 'center', fontSize: 7 }
          ]);
        });

        docDefinition.content.push({
          table: { headerRows: 1, widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*', 'auto', 15], body: tableBody },
          layout: 'lightHorizontalLines'
        });"""

# I will replace the old tableBody logic with this reversed one
old_table_pattern = re.compile(r'const tableBody = \[\[.*?widths: \[15,.*?\], body: tableBody \},.*?layout: \'lightHorizontalLines\' \}\);', re.DOTALL)

content = re.sub(old_table_pattern, new_table_logic, content)

with open('DailySalesReportsPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: Reversed table columns and centered all cells")
