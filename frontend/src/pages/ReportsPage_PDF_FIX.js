// This is the new generatePDF function using pdfMake
// Replace the entire generatePDF function in ReportsPage.jsx with this code

const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
  try {
    // Build PDF content using pdfMake
    const content = [];
    
    // Title
    content.push({
      text: 'تقرير شهري - مركز العمران للتدريب والتطوير',
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
    
    content.push({
      text: `${branchName} - ${group.monthName} ${group.year}`,
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
    
    // Statistics Cards
    content.push({
      text: 'الإحصائيات الإجمالية',
      style: 'sectionHeader',
      margin: [0, 0, 0, 5]
    });
    
    const statsCards = [
      {
        text: [
          { text: 'الإجمالي الداخلي\n', fontSize: 7 },
          { text: `${totals.internalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الخارجي\n', fontSize: 7 },
          { text: `${totals.externalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#FEB05D' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'إجمالي المصاريف\n', fontSize: 7 },
          { text: `${totals.expensesTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#C62828' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الكامل\n', fontSize: 7 },
          { text: `${totals.grandTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 0, 0]
      }
    ];
    
    content.push({
      columns: statsCards,
      columnGap: 2,
      margin: [0, 0, 0, 10]
    });
    
    // Teacher Statistics Table
    if (teacherStats.length > 0) {
      content.push({
        text: 'إحصائيات المدرسين',
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const teacherTableBody = [
        [
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'عدد الساعات', style: 'tableHeader', alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', alignment: 'center' },
          { text: 'داخلي/خارجي', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      teacherStats.forEach(stat => {
        teacherTableBody.push([
          { text: stat.teacher_name, fontSize: 7, alignment: 'right' },
          { text: stat.total_hours.toFixed(2), fontSize: 7, alignment: 'center' },
          { text: `${stat.total_amount.toFixed(2)} درهم`, fontSize: 7, alignment: 'center' },
          { text: stat.location === 'external' ? 'خارجي' : 'داخلي', fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: teacherTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Expenses Table
    if (monthExpenses.length > 0) {
      content.push({
        text: `المصاريف الإضافية (${monthExpenses.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const expensesTableBody = [
        [
          { text: 'اسم الفرع', style: 'tableHeader', alignment: 'right' },
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'السبب', style: 'tableHeader', alignment: 'right' },
          { text: 'المبلغ', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      monthExpenses.forEach(expense => {
        expensesTableBody.push([
          { text: getBranchName(expense.branch_id), fontSize: 7, alignment: 'right' },
          { text: expense.teacher_name || '-', fontSize: 7, alignment: 'right' },
          { text: expense.title, fontSize: 7, alignment: 'right' },
          { text: `${parseFloat(expense.amount || 0).toFixed(2)} درهم`, fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 'auto'],
          body: expensesTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Sessions Table
    if (group.sessions.length > 0) {
      content.push({
        text: `تفاصيل الجلسات (${group.sessions.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const sessionsTableBody = [
        [
          { text: 'الفرع', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'المدرس', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'الطالب', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'التاريخ', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'من', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'إلى', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الساعات', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'العقد', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'السعر', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', fontSize: 6, alignment: 'center' }
        ]
      ];
      
      group.sessions.forEach(session => {
        sessionsTableBody.push([
          { text: getBranchName(session.branch_id), fontSize: 6, alignment: 'right' },
          { text: session.teacher_name, fontSize: 6, alignment: 'right' },
          { text: session.student_name, fontSize: 6, alignment: 'right' },
          { text: session.session_date, fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.start_time), fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.end_time), fontSize: 6, alignment: 'center' },
          { text: parseFloat(session.duration_hours || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: session.contract_number, fontSize: 6, alignment: 'center', bold: true },
          { text: parseFloat(session.hourly_rate || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: `${parseFloat(session.calculated_amount || 0).toFixed(2)} درهم`, fontSize: 6, alignment: 'center', bold: true, color: '#5A7ACD' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: sessionsTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // PDF Document Definition
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#2B2A2A'
      },
      styles: {
        title: {
          fontSize: 12,
          bold: true,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        sectionHeader: {
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 3]
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#2B2A2A'
        }
      },
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      direction: 'rtl'
    };
    
    // Generate and download PDF
    const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    
    success('تم إنشاء ملف PDF بنجاح');
  } catch (err) {
    console.error('Error generating PDF:', err);
    showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
  }
};



// Replace the entire generatePDF function in ReportsPage.jsx with this code

const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
  try {
    // Build PDF content using pdfMake
    const content = [];
    
    // Title
    content.push({
      text: 'تقرير شهري - مركز العمران للتدريب والتطوير',
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
    
    content.push({
      text: `${branchName} - ${group.monthName} ${group.year}`,
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
    
    // Statistics Cards
    content.push({
      text: 'الإحصائيات الإجمالية',
      style: 'sectionHeader',
      margin: [0, 0, 0, 5]
    });
    
    const statsCards = [
      {
        text: [
          { text: 'الإجمالي الداخلي\n', fontSize: 7 },
          { text: `${totals.internalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الخارجي\n', fontSize: 7 },
          { text: `${totals.externalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#FEB05D' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'إجمالي المصاريف\n', fontSize: 7 },
          { text: `${totals.expensesTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#C62828' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الكامل\n', fontSize: 7 },
          { text: `${totals.grandTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 0, 0]
      }
    ];
    
    content.push({
      columns: statsCards,
      columnGap: 2,
      margin: [0, 0, 0, 10]
    });
    
    // Teacher Statistics Table
    if (teacherStats.length > 0) {
      content.push({
        text: 'إحصائيات المدرسين',
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const teacherTableBody = [
        [
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'عدد الساعات', style: 'tableHeader', alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', alignment: 'center' },
          { text: 'داخلي/خارجي', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      teacherStats.forEach(stat => {
        teacherTableBody.push([
          { text: stat.teacher_name, fontSize: 7, alignment: 'right' },
          { text: stat.total_hours.toFixed(2), fontSize: 7, alignment: 'center' },
          { text: `${stat.total_amount.toFixed(2)} درهم`, fontSize: 7, alignment: 'center' },
          { text: stat.location === 'external' ? 'خارجي' : 'داخلي', fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: teacherTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Expenses Table
    if (monthExpenses.length > 0) {
      content.push({
        text: `المصاريف الإضافية (${monthExpenses.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const expensesTableBody = [
        [
          { text: 'اسم الفرع', style: 'tableHeader', alignment: 'right' },
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'السبب', style: 'tableHeader', alignment: 'right' },
          { text: 'المبلغ', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      monthExpenses.forEach(expense => {
        expensesTableBody.push([
          { text: getBranchName(expense.branch_id), fontSize: 7, alignment: 'right' },
          { text: expense.teacher_name || '-', fontSize: 7, alignment: 'right' },
          { text: expense.title, fontSize: 7, alignment: 'right' },
          { text: `${parseFloat(expense.amount || 0).toFixed(2)} درهم`, fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 'auto'],
          body: expensesTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Sessions Table
    if (group.sessions.length > 0) {
      content.push({
        text: `تفاصيل الجلسات (${group.sessions.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const sessionsTableBody = [
        [
          { text: 'الفرع', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'المدرس', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'الطالب', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'التاريخ', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'من', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'إلى', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الساعات', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'العقد', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'السعر', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', fontSize: 6, alignment: 'center' }
        ]
      ];
      
      group.sessions.forEach(session => {
        sessionsTableBody.push([
          { text: getBranchName(session.branch_id), fontSize: 6, alignment: 'right' },
          { text: session.teacher_name, fontSize: 6, alignment: 'right' },
          { text: session.student_name, fontSize: 6, alignment: 'right' },
          { text: session.session_date, fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.start_time), fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.end_time), fontSize: 6, alignment: 'center' },
          { text: parseFloat(session.duration_hours || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: session.contract_number, fontSize: 6, alignment: 'center', bold: true },
          { text: parseFloat(session.hourly_rate || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: `${parseFloat(session.calculated_amount || 0).toFixed(2)} درهم`, fontSize: 6, alignment: 'center', bold: true, color: '#5A7ACD' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: sessionsTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // PDF Document Definition
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#2B2A2A'
      },
      styles: {
        title: {
          fontSize: 12,
          bold: true,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        sectionHeader: {
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 3]
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#2B2A2A'
        }
      },
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      direction: 'rtl'
    };
    
    // Generate and download PDF
    const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    
    success('تم إنشاء ملف PDF بنجاح');
  } catch (err) {
    console.error('Error generating PDF:', err);
    showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
  }
};



// Replace the entire generatePDF function in ReportsPage.jsx with this code

const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
  try {
    // Build PDF content using pdfMake
    const content = [];
    
    // Title
    content.push({
      text: 'تقرير شهري - مركز العمران للتدريب والتطوير',
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
    
    content.push({
      text: `${branchName} - ${group.monthName} ${group.year}`,
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
    
    // Statistics Cards
    content.push({
      text: 'الإحصائيات الإجمالية',
      style: 'sectionHeader',
      margin: [0, 0, 0, 5]
    });
    
    const statsCards = [
      {
        text: [
          { text: 'الإجمالي الداخلي\n', fontSize: 7 },
          { text: `${totals.internalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الخارجي\n', fontSize: 7 },
          { text: `${totals.externalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#FEB05D' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'إجمالي المصاريف\n', fontSize: 7 },
          { text: `${totals.expensesTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#C62828' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الكامل\n', fontSize: 7 },
          { text: `${totals.grandTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 0, 0]
      }
    ];
    
    content.push({
      columns: statsCards,
      columnGap: 2,
      margin: [0, 0, 0, 10]
    });
    
    // Teacher Statistics Table
    if (teacherStats.length > 0) {
      content.push({
        text: 'إحصائيات المدرسين',
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const teacherTableBody = [
        [
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'عدد الساعات', style: 'tableHeader', alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', alignment: 'center' },
          { text: 'داخلي/خارجي', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      teacherStats.forEach(stat => {
        teacherTableBody.push([
          { text: stat.teacher_name, fontSize: 7, alignment: 'right' },
          { text: stat.total_hours.toFixed(2), fontSize: 7, alignment: 'center' },
          { text: `${stat.total_amount.toFixed(2)} درهم`, fontSize: 7, alignment: 'center' },
          { text: stat.location === 'external' ? 'خارجي' : 'داخلي', fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: teacherTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Expenses Table
    if (monthExpenses.length > 0) {
      content.push({
        text: `المصاريف الإضافية (${monthExpenses.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const expensesTableBody = [
        [
          { text: 'اسم الفرع', style: 'tableHeader', alignment: 'right' },
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'السبب', style: 'tableHeader', alignment: 'right' },
          { text: 'المبلغ', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      monthExpenses.forEach(expense => {
        expensesTableBody.push([
          { text: getBranchName(expense.branch_id), fontSize: 7, alignment: 'right' },
          { text: expense.teacher_name || '-', fontSize: 7, alignment: 'right' },
          { text: expense.title, fontSize: 7, alignment: 'right' },
          { text: `${parseFloat(expense.amount || 0).toFixed(2)} درهم`, fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 'auto'],
          body: expensesTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Sessions Table
    if (group.sessions.length > 0) {
      content.push({
        text: `تفاصيل الجلسات (${group.sessions.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const sessionsTableBody = [
        [
          { text: 'الفرع', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'المدرس', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'الطالب', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'التاريخ', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'من', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'إلى', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الساعات', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'العقد', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'السعر', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', fontSize: 6, alignment: 'center' }
        ]
      ];
      
      group.sessions.forEach(session => {
        sessionsTableBody.push([
          { text: getBranchName(session.branch_id), fontSize: 6, alignment: 'right' },
          { text: session.teacher_name, fontSize: 6, alignment: 'right' },
          { text: session.student_name, fontSize: 6, alignment: 'right' },
          { text: session.session_date, fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.start_time), fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.end_time), fontSize: 6, alignment: 'center' },
          { text: parseFloat(session.duration_hours || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: session.contract_number, fontSize: 6, alignment: 'center', bold: true },
          { text: parseFloat(session.hourly_rate || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: `${parseFloat(session.calculated_amount || 0).toFixed(2)} درهم`, fontSize: 6, alignment: 'center', bold: true, color: '#5A7ACD' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: sessionsTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // PDF Document Definition
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#2B2A2A'
      },
      styles: {
        title: {
          fontSize: 12,
          bold: true,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        sectionHeader: {
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 3]
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#2B2A2A'
        }
      },
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      direction: 'rtl'
    };
    
    // Generate and download PDF
    const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    
    success('تم إنشاء ملف PDF بنجاح');
  } catch (err) {
    console.error('Error generating PDF:', err);
    showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
  }
};



// Replace the entire generatePDF function in ReportsPage.jsx with this code

const generatePDF = async (group, monthExpenses, teacherStats, totals, branchName) => {
  try {
    // Build PDF content using pdfMake
    const content = [];
    
    // Title
    content.push({
      text: 'تقرير شهري - مركز العمران للتدريب والتطوير',
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
    
    content.push({
      text: `${branchName} - ${group.monthName} ${group.year}`,
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    });
    
    // Statistics Cards
    content.push({
      text: 'الإحصائيات الإجمالية',
      style: 'sectionHeader',
      margin: [0, 0, 0, 5]
    });
    
    const statsCards = [
      {
        text: [
          { text: 'الإجمالي الداخلي\n', fontSize: 7 },
          { text: `${totals.internalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الخارجي\n', fontSize: 7 },
          { text: `${totals.externalTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#FEB05D' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'إجمالي المصاريف\n', fontSize: 7 },
          { text: `${totals.expensesTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#C62828' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 2, 0]
      },
      {
        text: [
          { text: 'الإجمالي الكامل\n', fontSize: 7 },
          { text: `${totals.grandTotal.toFixed(2)} درهم`, fontSize: 8, bold: true, color: '#5A7ACD' }
        ],
        fillColor: '#F5F2F2',
        border: [true, true, true, true],
        borderColor: '#D1D1D1',
        margin: [0, 0, 0, 0]
      }
    ];
    
    content.push({
      columns: statsCards,
      columnGap: 2,
      margin: [0, 0, 0, 10]
    });
    
    // Teacher Statistics Table
    if (teacherStats.length > 0) {
      content.push({
        text: 'إحصائيات المدرسين',
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const teacherTableBody = [
        [
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'عدد الساعات', style: 'tableHeader', alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', alignment: 'center' },
          { text: 'داخلي/خارجي', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      teacherStats.forEach(stat => {
        teacherTableBody.push([
          { text: stat.teacher_name, fontSize: 7, alignment: 'right' },
          { text: stat.total_hours.toFixed(2), fontSize: 7, alignment: 'center' },
          { text: `${stat.total_amount.toFixed(2)} درهم`, fontSize: 7, alignment: 'center' },
          { text: stat.location === 'external' ? 'خارجي' : 'داخلي', fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: teacherTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Expenses Table
    if (monthExpenses.length > 0) {
      content.push({
        text: `المصاريف الإضافية (${monthExpenses.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const expensesTableBody = [
        [
          { text: 'اسم الفرع', style: 'tableHeader', alignment: 'right' },
          { text: 'اسم المدرس', style: 'tableHeader', alignment: 'right' },
          { text: 'السبب', style: 'tableHeader', alignment: 'right' },
          { text: 'المبلغ', style: 'tableHeader', alignment: 'center' }
        ]
      ];
      
      monthExpenses.forEach(expense => {
        expensesTableBody.push([
          { text: getBranchName(expense.branch_id), fontSize: 7, alignment: 'right' },
          { text: expense.teacher_name || '-', fontSize: 7, alignment: 'right' },
          { text: expense.title, fontSize: 7, alignment: 'right' },
          { text: `${parseFloat(expense.amount || 0).toFixed(2)} درهم`, fontSize: 7, alignment: 'center' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', 'auto'],
          body: expensesTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 3,
          paddingBottom: () => 3
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // Sessions Table
    if (group.sessions.length > 0) {
      content.push({
        text: `تفاصيل الجلسات (${group.sessions.length})`,
        style: 'sectionHeader',
        margin: [0, 10, 0, 5]
      });
      
      const sessionsTableBody = [
        [
          { text: 'الفرع', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'المدرس', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'الطالب', style: 'tableHeader', fontSize: 6, alignment: 'right' },
          { text: 'التاريخ', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'من', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'إلى', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الساعات', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'العقد', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'السعر', style: 'tableHeader', fontSize: 6, alignment: 'center' },
          { text: 'الإجمالي', style: 'tableHeader', fontSize: 6, alignment: 'center' }
        ]
      ];
      
      group.sessions.forEach(session => {
        sessionsTableBody.push([
          { text: getBranchName(session.branch_id), fontSize: 6, alignment: 'right' },
          { text: session.teacher_name, fontSize: 6, alignment: 'right' },
          { text: session.student_name, fontSize: 6, alignment: 'right' },
          { text: session.session_date, fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.start_time), fontSize: 6, alignment: 'center' },
          { text: convertTo12Hour(session.end_time), fontSize: 6, alignment: 'center' },
          { text: parseFloat(session.duration_hours || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: session.contract_number, fontSize: 6, alignment: 'center', bold: true },
          { text: parseFloat(session.hourly_rate || 0).toFixed(2), fontSize: 6, alignment: 'center' },
          { text: `${parseFloat(session.calculated_amount || 0).toFixed(2)} درهم`, fontSize: 6, alignment: 'center', bold: true, color: '#5A7ACD' }
        ]);
      });
      
      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
          body: sessionsTableBody
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return '#F5F2F2';
            return null;
          },
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => '#D1D1D1',
          paddingLeft: () => 2,
          paddingRight: () => 2,
          paddingTop: () => 2,
          paddingBottom: () => 2
        },
        margin: [0, 0, 0, 10]
      });
    }
    
    // PDF Document Definition
    const docDefinition = {
      content: content,
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        color: '#2B2A2A'
      },
      styles: {
        title: {
          fontSize: 12,
          bold: true,
          color: '#5A7ACD',
          margin: [0, 0, 0, 3]
        },
        subtitle: {
          fontSize: 10,
          bold: true,
          margin: [0, 0, 0, 5]
        },
        sectionHeader: {
          fontSize: 9,
          bold: true,
          margin: [0, 0, 0, 3]
        },
        tableHeader: {
          fontSize: 8,
          bold: true,
          color: '#2B2A2A'
        }
      },
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      direction: 'rtl'
    };
    
    // Generate and download PDF
    const fileName = `تقرير_${group.monthName}_${group.year}_${branchName.replace(/\s/g, "_")}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    
    success('تم إنشاء ملف PDF بنجاح');
  } catch (err) {
    console.error('Error generating PDF:', err);
    showError('حدث خطأ أثناء إنشاء ملف PDF: ' + (err.message || err));
  }
};





