// Helper function to build comprehensive monthly report using pdfmake
// This will replace the html2canvas/jsPDF implementation

export const buildComprehensiveMonthlyReportPDF = (
  uniqueMonthSessions,
  branchGroups,
  selectedYear,
  selectedMonth,
  monthName,
  monthExpenses,
  expenses,
  calculateTeacherStats,
  calculateTotals,
  convertTo12Hour
) => {
  // Calculate overall statistics
  let totalInternal = 0;
  let totalExternal = 0;
  let totalExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  let totalSessions = 0;
  let totalHours = 0;

  uniqueMonthSessions.forEach(session => {
    const amount = parseFloat(session.calculated_amount || 0);
    totalSessions++;
    totalHours += parseFloat(session.duration_hours || 0);
    if (session.location === "external") {
      totalExternal += amount;
    } else {
      totalInternal += amount;
    }
  });

  const grandTotal = totalInternal + totalExternal + totalExpenses;

  // Helper function to format Arabic text
  // pdfmake-rtl handles RTL automatically, so we just clean the text
  const formatArabicText = (text) => {
    if (!text || typeof text !== 'string') return text;

    // Trim only leading and trailing spaces, preserve internal spaces
    let trimmedText = text.trim();

    // Normalize multiple spaces to single space
    trimmedText = trimmedText.replace(/\s+/g, ' ');

    // Remove all parentheses from the text as requested
    trimmedText = trimmedText.replace(/[()]/g, '');

    // Return text as is - pdfmake-rtl will handle RTL automatically
    return trimmedText;
  };

  // Helper function to format numbers with commas every 3 digits
  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Build PDF document definition with RTL support
  // pdfmake-rtl automatically detects and handles RTL text
  const docDefinition = {
    defaultStyle: {
      font: 'Cairo',
      fontSize: 8,
      alignment: 'right'
    },
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 50, 30, 50],
    content: [],
    info: {
      title: 'تقرير شامل شهري'
    },
    footer: function (currentPage, pageCount) {
      return {
        text: formatArabicText(`صفحة ${currentPage} من ${pageCount}`),
        alignment: 'center',
        fontSize: 8,
        color: '#6B7280',
        margin: [0, 10, 0, 0],
        direction: 'rtl'
      };
    }
  };

  // Page 1: Overall Statistics
  const firstPageContent = [
    // Title
    {
      text: formatArabicText('تقرير شامل شهري'),
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    },
    {
      text: formatArabicText('مركز العمران للتدريب والتطوير'),
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 3]
    },
    {
      text: formatArabicText(`${monthName} ${selectedYear}`),
      style: 'subtitle2',
      alignment: 'center',
      margin: [0, 0, 0, 15]
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
      margin: [0, 0, 0, 15]
    },
    // Overall Statistics
    {
      text: formatArabicText('الإحصائيات الإجمالية'),
      style: 'sectionTitle',
      alignment: 'center',
      margin: [0, 0, 0, 10]
    },
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الكامل'), style: 'statLabel', alignment: 'center' },
            {
              text: `${formatNumber(grandTotal)} ${formatArabicText('درهم')}`,
              style: 'statValue',
              color: '#DC2626',
              alignment: 'center',
              bold: true,
              decoration: 'underline'
            }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي المصاريف'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalExpenses)} درهم`), style: 'statValue', color: '#10B981', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الخارجي'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalExternal)} درهم`), style: 'statValue', color: '#FEB05D', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الداخلي'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalInternal)} درهم`), style: 'statValue', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي الساعات'), style: 'statLabel', alignment: 'center' },
            { text: formatNumber(totalHours), style: 'statValue', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('عدد الجلسات'), style: 'statLabel', alignment: 'center' },
            { text: formatNumber(totalSessions, 0), style: 'statValue', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        }
      ],
      margin: [0, 0, 0, 15]
    },
    // Branch Summary Table
    {
      text: formatArabicText('ملخص الفروع'),
      style: 'sectionTitle',
      margin: [0, 0, 0, 8],
    },
    {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('عدد الجلسات'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('إجمالي الداخلي'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('إجمالي الخارجي'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('المصاريف'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الإجمالي'), style: 'tableHeader', alignment: 'center' }
          ],
          ...branchGroups.map(branchGroup => {
            const targetMonth = branchGroup.months.find(month =>
              month.year === selectedYear && month.month === selectedMonth
            );
            const branchSessions = targetMonth?.sessions || [];
            const branchMonthKey = `${selectedYear}-${selectedMonth}`;
            const branchExpenses = expenses[branchMonthKey]?.filter(exp => exp.branch_id === branchGroup.branchId) || [];
            const branchInternal = branchSessions.filter(s => s.location === "internal").reduce((sum, s) => sum + parseFloat(s.calculated_amount || 0), 0);
            const branchExternal = branchSessions.filter(s => s.location === "external").reduce((sum, s) => sum + parseFloat(s.calculated_amount || 0), 0);
            const branchExpensesTotal = branchExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
            const branchTotal = branchInternal + branchExternal + branchExpensesTotal;
            return [
              { text: formatArabicText(branchGroup.branchName), style: 'tableCell', bold: true, alignment: 'center' },
              { text: formatNumber(branchSessions.length, 0), style: 'tableCell' },
              { text: formatArabicText(`${formatNumber(branchInternal)} درهم`), style: 'tableCell', color: '#5A7ACD' },
              { text: formatArabicText(`${formatNumber(branchExternal)} درهم`), style: 'tableCell', color: '#FEB05D' },
              { text: formatArabicText(`${formatNumber(branchExpensesTotal)} درهم`), style: 'tableCell', color: '#DC2626' },
              { text: formatArabicText(`${formatNumber(branchTotal)} درهم`), style: 'tableCell', bold: true, color: '#10B981' }
            ];
          })
        ]
      },
      layout: {
        hLineWidth: function (i, node) {
          if (i === 0 || i === node.table.body.length) {
            return 0.8;
          }
          return 0.3;
        },
        vLineWidth: function (i, node) {
          return 0.3;
        },
        hLineColor: function (i, node) {
          if (i === 0 || i === node.table.body.length) {
            return '#5A7ACD';
          }
          return '#E5E7EB';
        },
        vLineColor: function (i, node) {
          return '#E5E7EB';
        },
        paddingLeft: function (i, node) {
          return 5;
        },
        paddingRight: function (i, node) {
          return 5;
        },
        paddingTop: function (i, node) {
          return 4;
        },
        paddingBottom: function (i, node) {
          return 4;
        }
      },
      margin: [0, 0, 0, 20]
    },
    // Signatures Section
    {
      text: formatArabicText('التوقيعات والتوثيق'),
      style: 'sectionTitle',
      alignment: 'center',
      margin: [0, 50, 0, 80],
    },
    {
      stack: [
        // First row: العمليات, ادارة الفرع
        {
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] },
                { text: formatArabicText('العمليات'), style: 'signatureLabel', alignment: 'center' }
              ],
            },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] },
                { text: formatArabicText('ادارة الفرع'), style: 'signatureLabel', alignment: 'center' }
              ],
            }
          ],
          columnGap: 40,
          margin: [40, 0, 40, 80]
        },
        // Second row: المحاسبة, الادارة العامة
        {
          columns: [
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] },
                { text: formatArabicText('المحاسبة'), style: 'signatureLabel', alignment: 'center' }
              ],
            },
            {
              width: '*',
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1.5, lineColor: '#6B7280' }], alignment: 'center', margin: [0, 0, 0, 15] },
                { text: formatArabicText('الادارة العامة'), style: 'signatureLabel', alignment: 'center' }
              ],
            }
          ],
          columnGap: 40,
          margin: [40, 0, 40, 0]
        }
      ]
    }
  ];

  docDefinition.content.push(...firstPageContent);

  // Add branch pages
  branchGroups.forEach((branchGroup) => {
    const targetMonth = branchGroup.months.find(month =>
      month.year === selectedYear && month.month === selectedMonth
    );

    const branchSessions = [];
    const seenSessionIds = new Set();

    if (targetMonth && targetMonth.sessions) {
      targetMonth.sessions.forEach(session => {
        if (session.id && !seenSessionIds.has(session.id)) {
          seenSessionIds.add(session.id);
          branchSessions.push(session);
        }
      });
    }

    if (branchSessions.length === 0) {
      return; // Skip this branch if no sessions
    }

    const branchMonthKey = `${selectedYear}-${selectedMonth}`;
    const branchExpenses = expenses[branchMonthKey]?.filter(exp => exp.branch_id === branchGroup.branchId) || [];
    const teacherStats = calculateTeacherStats(branchSessions);
    const branchTotals = calculateTotals(branchSessions, branchExpenses);

    // Branch page content
    const branchPageContent = [
      { text: formatArabicText(branchGroup.branchName), style: 'branchTitle', alignment: 'center', pageBreak: 'before' },
      { text: formatArabicText(`${monthName} ${selectedYear}`), style: 'branchSubtitle', alignment: 'center', margin: [0, 0, 0, 12] },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
        margin: [0, 0, 0, 12]
      },
      // Branch Statistics
      {
        text: formatArabicText('الإحصائيات'),
        style: 'sectionTitle',
        margin: [0, 0, 0, 8],
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: formatArabicText('الإجمالي الكامل'), style: 'statLabel', alignment: 'center' },
              {
                text: `${formatNumber(branchTotals.grandTotal)} ${formatArabicText('درهم')}`,
                style: 'statValue',
                color: '#DC2626',
                alignment: 'center',
                bold: true,
                decoration: 'underline'
              }
            ],
            margin: [3, 0, 3, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي المصاريف'), style: 'statLabel', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(branchTotals.expensesTotal)} درهم`), style: 'statValue', color: '#10B981', alignment: 'center' }
            ],
            margin: [3, 0, 3, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('الإجمالي الخارجي'), style: 'statLabel', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(branchTotals.externalTotal)} درهم`), style: 'statValue', color: '#FEB05D', alignment: 'center' }
            ],
            margin: [3, 0, 3, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('الإجمالي الداخلي'), style: 'statLabel', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(branchTotals.internalTotal)} درهم`), style: 'statValue', color: '#5A7ACD', alignment: 'center' }
            ],
            margin: [3, 0, 3, 5]
          }
        ],
        margin: [0, 0, 0, 15]
      }
    ];

    // Teacher Statistics Table
    if (teacherStats.length > 0) {
      branchPageContent.push(
        {
          text: formatArabicText('إحصائيات المدرسين'),
          style: 'sectionTitle',
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: formatArabicText('اسم المدرس'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('عدد الساعات'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('الإجمالي'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('النوع'), style: 'tableHeader', alignment: 'center' }
              ],
              ...teacherStats.map(stat => [
                { text: formatArabicText(stat.teacher_name), style: 'tableCell', alignment: 'center' },
                { text: formatNumber(stat.total_hours), style: 'tableCell' },
                { text: formatArabicText(`${formatNumber(stat.total_amount)} درهم`), style: 'tableCell', bold: true, color: '#10B981' },
                { text: formatArabicText(stat.location === "external" ? "خارجي" : "داخلي"), style: 'tableCell', color: stat.location === "external" ? "#FEB05D" : "#5A7ACD", bold: true }
              ])
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return 0.8;
              }
              return 0.3;
            },
            vLineWidth: function (i, node) {
              return 0.3;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return '#5A7ACD';
              }
              return '#E5E7EB';
            },
            vLineColor: function (i, node) {
              return '#E5E7EB';
            },
            paddingLeft: function (i, node) {
              return 5;
            },
            paddingRight: function (i, node) {
              return 5;
            },
            paddingTop: function (i, node) {
              return 4;
            },
            paddingBottom: function (i, node) {
              return 4;
            }
          },
          margin: [0, 0, 0, 15]
        }
      );
    }

    // Expenses Table
    if (branchExpenses.length > 0) {
      branchPageContent.push(
        {
          text: formatArabicText('المصاريف الإضافية'),
          style: 'sectionTitle',
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto'],
            body: [
              [
                { text: formatArabicText('اسم المدرس'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('المبلغ'), style: 'tableHeader', alignment: 'center' }
              ],
              ...branchExpenses.map(expense => [
                { text: formatArabicText(expense.teacher_name || "-"), style: 'tableCell', alignment: 'center' },
                { text: formatArabicText(expense.title), style: 'tableCell', alignment: 'center' },
                { text: formatArabicText(`${formatNumber(parseFloat(expense.amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#DC2626' }
              ])
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return 0.8;
              }
              return 0.3;
            },
            vLineWidth: function (i, node) {
              return 0.3;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return '#5A7ACD';
              }
              return '#E5E7EB';
            },
            vLineColor: function (i, node) {
              return '#E5E7EB';
            },
            paddingLeft: function (i, node) {
              return 5;
            },
            paddingRight: function (i, node) {
              return 5;
            },
            paddingTop: function (i, node) {
              return 4;
            },
            paddingBottom: function (i, node) {
              return 4;
            }
          },
          margin: [0, 0, 0, 15]
        }
      );
    }

    // Sessions grouped by teacher
    if (branchSessions.length > 0) {
      const sessionsByTeacher = {};
      const seenSessionIdsInGrouping = new Set();

      branchSessions.forEach(session => {
        if (session.id && seenSessionIdsInGrouping.has(session.id)) {
          return;
        }
        seenSessionIdsInGrouping.add(session.id);

        const teacherName = session.teacher_name || 'غير محدد';
        if (!sessionsByTeacher[teacherName]) {
          sessionsByTeacher[teacherName] = [];
        }
        sessionsByTeacher[teacherName].push(session);
      });

      const sortedTeachers = Object.keys(sessionsByTeacher).sort((a, b) => {
        return a.localeCompare(b, 'ar');
      });

      branchPageContent.push({
        text: formatArabicText(`الجلسات ${branchSessions.length}`),
        style: 'sectionTitle',
        margin: [0, 0, 0, 8],
      });

      sortedTeachers.forEach((teacherName, teacherIndex) => {
        const teacherSessions = sessionsByTeacher[teacherName];

        branchPageContent.push(
          {
            text: formatArabicText(`${teacherName} ${teacherSessions.length} جلسة`),
            style: 'teacherHeader',
            margin: [0, teacherIndex > 0 ? 12 : 0, 0, 8],
            pageBreak: 'avoid',
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: formatArabicText('الطالب'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('تاريخ الجلسة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('من الساعة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إلى الساعة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المدة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('سعر الساعة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('الإجمالي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('النوع'), style: 'tableHeader', alignment: 'center' }
                ],
                ...teacherSessions.map(session => [
                  { text: formatArabicText(session.student_name), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(session.session_date), style: 'tableCell' },
                  { text: formatArabicText(convertTo12Hour(session.start_time)), style: 'tableCell' },
                  { text: formatArabicText(convertTo12Hour(session.end_time)), style: 'tableCell' },
                  { text: formatArabicText(session.duration_text), style: 'tableCell' },
                  { text: formatArabicText(session.contract_number), style: 'tableCell', bold: true, color: '#5A7ACD' },
                  { text: formatNumber(parseFloat(session.hourly_rate || 0)), style: 'tableCell' },
                  { text: formatArabicText(`${formatNumber(parseFloat(session.calculated_amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#10B981' },
                  { text: formatArabicText(session.location === "external" ? "خارجي" : "داخلي"), style: 'tableCell', color: session.location === "external" ? "#FEB05D" : "#5A7ACD", bold: true }
                ])
              ]
            },
            layout: {
              hLineWidth: function (i, node) {
                if (i === 0 || i === node.table.body.length) {
                  return 0.8;
                }
                return 0.3;
              },
              vLineWidth: function (i, node) {
                return 0.3;
              },
              hLineColor: function (i, node) {
                if (i === 0 || i === node.table.body.length) {
                  return '#5A7ACD';
                }
                return '#E5E7EB';
              },
              vLineColor: function (i, node) {
                return '#E5E7EB';
              },
              paddingLeft: function (i, node) {
                return 4;
              },
              paddingRight: function (i, node) {
                return 4;
              },
              paddingTop: function (i, node) {
                return 3;
              },
              paddingBottom: function (i, node) {
                return 3;
              }
            },
            margin: [0, 0, 0, teacherIndex < sortedTeachers.length - 1 ? 12 : 0],
            pageBreak: 'avoid'
          }
        );
      });
    }

    docDefinition.content.push(...branchPageContent);
  });

  // Define styles
  docDefinition.styles = {
    title: {
      fontSize: 18,
      bold: true,
      color: '#5A7ACD',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle: {
      fontSize: 14,
      bold: true,
      color: '#2B2A2A',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle2: {
      fontSize: 12,
      bold: true,
      color: '#6B7280',
      alignment: 'center',
      direction: 'rtl'
    },
    sectionTitle: {
      fontSize: 12,
      bold: true,
      color: '#2B2A2A',
      margin: [0, 0, 0, 8],
      alignment: 'right',
      direction: 'rtl'
    },
    statLabel: {
      fontSize: 8,
      color: '#6B7280',
      margin: [0, 0, 0, 3],
      alignment: 'right',
      direction: 'rtl'
    },
    statValue: {
      fontSize: 12,
      bold: true,
      alignment: 'center',
      direction: 'rtl'
    },
    tableHeader: {
      fontSize: 8,
      bold: true,
      fillColor: '#F3F4F6',
      color: '#1F2937',
      alignment: 'center',
      direction: 'rtl',
      margin: [0, 0, 0, 0]
    },
    tableCell: {
      fontSize: 7,
      alignment: 'center',
      color: '#374151',
      direction: 'rtl'
    },
    branchTitle: {
      fontSize: 16,
      bold: true,
      color: '#5A7ACD',
      alignment: 'center',
      direction: 'rtl'
    },
    branchSubtitle: {
      fontSize: 12,
      bold: true,
      color: '#6B7280',
      alignment: 'center',
      direction: 'rtl'
    },
    teacherHeader: {
      fontSize: 10,
      bold: true,
      color: '#1F2937',
      fillColor: '#EFF6FF',
      margin: [0, 0, 0, 8],
      alignment: 'right',
      padding: [5, 8, 5, 8],
      direction: 'rtl'
    },
    signatureLabel: {
      fontSize: 9,
      color: '#6B7280',
      alignment: 'center',
      direction: 'rtl'
    }
  };

  return docDefinition;
};

// Helper function to build branch monthly report using pdfmake
export const buildBranchMonthlyReportPDF = (
  branchSessions,
  branchName,
  year,
  month,
  monthName,
  monthExpenses,
  calculateTeacherStats,
  calculateTotals,
  convertTo12Hour
) => {
  // Calculate branch statistics
  const branchTotals = calculateTotals(branchSessions, monthExpenses);
  const teacherStats = calculateTeacherStats(branchSessions);

  // Helper function to format Arabic text
  const formatArabicText = (text) => {
    if (!text || typeof text !== 'string') return text;
    let trimmedText = text.trim();
    trimmedText = trimmedText.replace(/\s+/g, ' ');
    trimmedText = trimmedText.replace(/[()]/g, '');
    return trimmedText;
  };

  // Helper function to format numbers with commas every 3 digits
  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return num;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Build PDF document definition with RTL support
  const docDefinition = {
    defaultStyle: {
      font: 'Cairo',
      fontSize: 8,
      alignment: 'right'
    },
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 50, 30, 50],
    content: [],
    info: {
      title: `تقرير شهري - ${branchName}`
    },
    footer: function (currentPage, pageCount) {
      return {
        text: formatArabicText(`صفحة ${currentPage} من ${pageCount}`),
        alignment: 'center',
        fontSize: 8,
        color: '#6B7280',
        margin: [0, 10, 0, 0],
        direction: 'rtl'
      };
    }
  };

  // Title and header
  const headerContent = [
    {
      text: formatArabicText('تقرير شهري'),
      style: 'title',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    },
    {
      text: formatArabicText('مركز العمران للتدريب والتطوير'),
      style: 'subtitle',
      alignment: 'center',
      margin: [0, 0, 0, 3]
    },
    {
      text: formatArabicText(`${branchName} - ${monthName} ${year}`),
      style: 'subtitle2',
      alignment: 'center',
      margin: [0, 0, 0, 15]
    },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
      margin: [0, 0, 0, 15]
    }
  ];

  docDefinition.content.push(...headerContent);

  // Branch Statistics
  const statisticsContent = [
    {
      text: formatArabicText('الإحصائيات'),
      style: 'sectionTitle',
      margin: [0, 0, 0, 8],
    },
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الكامل'), style: 'statLabel', alignment: 'center' },
            {
              text: `${formatNumber(branchTotals.grandTotal)} ${formatArabicText('درهم')}`,
              style: 'statValue',
              color: '#DC2626',
              alignment: 'center',
              bold: true,
              decoration: 'underline'
            }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي المصاريف'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(branchTotals.expensesTotal)} درهم`), style: 'statValue', color: '#10B981', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الخارجي'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(branchTotals.externalTotal)} درهم`), style: 'statValue', color: '#FEB05D', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('الإجمالي الداخلي'), style: 'statLabel', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(branchTotals.internalTotal)} درهم`), style: 'statValue', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [3, 0, 3, 5]
        }
      ],
      margin: [0, 0, 0, 15]
    }
  ];

  docDefinition.content.push(...statisticsContent);

  // Teacher Statistics Table
  if (teacherStats.length > 0) {
    docDefinition.content.push(
      {
        text: formatArabicText('إحصائيات المدرسين'),
        style: 'sectionTitle',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: formatArabicText('اسم المدرس'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد الساعات'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('الإجمالي'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('النوع'), style: 'tableHeader', alignment: 'center' }
            ],
            ...teacherStats.map(stat => [
              { text: formatArabicText(stat.teacher_name), style: 'tableCell', alignment: 'center' },
              { text: formatNumber(stat.total_hours), style: 'tableCell' },
              { text: formatArabicText(`${formatNumber(stat.total_amount)} درهم`), style: 'tableCell', bold: true, color: '#10B981' },
              { text: formatArabicText(stat.location === "external" ? "خارجي" : "داخلي"), style: 'tableCell', color: stat.location === "external" ? "#FEB05D" : "#5A7ACD", bold: true }
            ])
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return 0.8;
            }
            return 0.3;
          },
          vLineWidth: function (i, node) {
            return 0.3;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return '#5A7ACD';
            }
            return '#E5E7EB';
          },
          vLineColor: function (i, node) {
            return '#E5E7EB';
          },
          paddingLeft: function (i, node) {
            return 5;
          },
          paddingRight: function (i, node) {
            return 5;
          },
          paddingTop: function (i, node) {
            return 4;
          },
          paddingBottom: function (i, node) {
            return 4;
          }
        },
        margin: [0, 0, 0, 15]
      }
    );
  }

  // Expenses Table
  if (monthExpenses.length > 0) {
    docDefinition.content.push(
      {
        text: formatArabicText('المصاريف الإضافية'),
        style: 'sectionTitle',
        margin: [0, 0, 0, 8],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', 'auto'],
          body: [
            [
              { text: formatArabicText('اسم المدرس'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('السبب'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المبلغ'), style: 'tableHeader', alignment: 'center' }
            ],
            ...monthExpenses.map(expense => [
              { text: formatArabicText(expense.teacher_name || "-"), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(expense.title), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(expense.amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#DC2626' }
            ])
          ]
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return 0.8;
            }
            return 0.3;
          },
          vLineWidth: function (i, node) {
            return 0.3;
          },
          hLineColor: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return '#5A7ACD';
            }
            return '#E5E7EB';
          },
          vLineColor: function (i, node) {
            return '#E5E7EB';
          },
          paddingLeft: function (i, node) {
            return 5;
          },
          paddingRight: function (i, node) {
            return 5;
          },
          paddingTop: function (i, node) {
            return 4;
          },
          paddingBottom: function (i, node) {
            return 4;
          }
        },
        margin: [0, 0, 0, 15]
      }
    );
  }

  // Sessions grouped by teacher
  if (branchSessions.length > 0) {
    const sessionsByTeacher = {};
    const seenSessionIds = new Set();

    branchSessions.forEach(session => {
      if (session.id && seenSessionIds.has(session.id)) {
        return;
      }
      seenSessionIds.add(session.id);

      const teacherName = session.teacher_name || 'غير محدد';
      if (!sessionsByTeacher[teacherName]) {
        sessionsByTeacher[teacherName] = [];
      }
      sessionsByTeacher[teacherName].push(session);
    });

    const sortedTeachers = Object.keys(sessionsByTeacher).sort((a, b) => {
      return a.localeCompare(b, 'ar');
    });

    docDefinition.content.push({
      text: formatArabicText(`الجلسات ${branchSessions.length}`),
      style: 'sectionTitle',
      margin: [0, 0, 0, 8],
    });

    sortedTeachers.forEach((teacherName, teacherIndex) => {
      const teacherSessions = sessionsByTeacher[teacherName];

      docDefinition.content.push(
        {
          text: formatArabicText(`${teacherName} ${teacherSessions.length} جلسة`),
          style: 'teacherHeader',
          margin: [0, teacherIndex > 0 ? 12 : 0, 0, 8],
          pageBreak: 'avoid',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: formatArabicText('الطالب'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('تاريخ الجلسة'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('من الساعة'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('إلى الساعة'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('المدة'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('رقم العقد'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('سعر الساعة'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('الإجمالي'), style: 'tableHeader', alignment: 'center' },
                { text: formatArabicText('النوع'), style: 'tableHeader', alignment: 'center' }
              ],
              ...teacherSessions.map(session => [
                { text: formatArabicText(session.student_name), style: 'tableCell', alignment: 'center' },
                { text: formatArabicText(session.session_date), style: 'tableCell' },
                { text: formatArabicText(convertTo12Hour(session.start_time)), style: 'tableCell' },
                { text: formatArabicText(convertTo12Hour(session.end_time)), style: 'tableCell' },
                { text: formatArabicText(session.duration_text), style: 'tableCell' },
                { text: formatArabicText(session.contract_number), style: 'tableCell', bold: true, color: '#5A7ACD' },
                { text: formatNumber(parseFloat(session.hourly_rate || 0)), style: 'tableCell' },
                { text: formatArabicText(`${formatNumber(parseFloat(session.calculated_amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#10B981' },
                { text: formatArabicText(session.location === "external" ? "خارجي" : "داخلي"), style: 'tableCell', color: session.location === "external" ? "#FEB05D" : "#5A7ACD", bold: true }
              ])
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return 0.8;
              }
              return 0.3;
            },
            vLineWidth: function (i, node) {
              return 0.3;
            },
            hLineColor: function (i, node) {
              if (i === 0 || i === node.table.body.length) {
                return '#5A7ACD';
              }
              return '#E5E7EB';
            },
            vLineColor: function (i, node) {
              return '#E5E7EB';
            },
            paddingLeft: function (i, node) {
              return 4;
            },
            paddingRight: function (i, node) {
              return 4;
            },
            paddingTop: function (i, node) {
              return 3;
            },
            paddingBottom: function (i, node) {
              return 3;
            }
          },
          margin: [0, 0, 0, teacherIndex < sortedTeachers.length - 1 ? 12 : 0],
          pageBreak: 'avoid'
        }
      );
    });
  }

  // Signatures Section
  docDefinition.content.push(
    {
      text: formatArabicText('التوقيعات والتوثيق'),
      style: 'sectionTitle',
      alignment: 'center',
      margin: [0, 25, 0, 30],
    },
    {
      columns: [
        { text: '', width: 80 },
        {
          width: '*',
          stack: [
            // First row: العمليات, ادارة الفرع
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], margin: [0, 0, 0, 10] },
                    { text: formatArabicText('العمليات'), style: 'signatureLabel', alignment: 'center' }
                  ],
                  margin: [25, 0, 25, 0]
                },
                {
                  width: '*',
                  stack: [
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], margin: [0, 0, 0, 10] },
                    { text: formatArabicText('ادارة الفرع'), style: 'signatureLabel', alignment: 'center' }
                  ],
                  margin: [25, 0, 25, 0]
                }
              ],
              margin: [0, 0, 0, 50]
            },
            // Second row: المحاسبة, الادارة العامة
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], margin: [0, 0, 0, 10] },
                    { text: formatArabicText('المحاسبة'), style: 'signatureLabel', alignment: 'center' }
                  ],
                  margin: [25, 0, 25, 0]
                },
                {
                  width: '*',
                  stack: [
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 1, lineColor: '#9CA3AF' }], margin: [0, 0, 0, 10] },
                    { text: formatArabicText('الادارة العامة'), style: 'signatureLabel', alignment: 'center' }
                  ],
                  margin: [25, 0, 25, 0]
                }
              ],
              margin: [0, 0, 0, 0]
            }
          ],
          alignment: 'center'
        },
        { text: '', width: 80 }
      ],
      margin: [0, 0, 0, 0]
    }
  );

  // Define styles (same as comprehensive report)
  docDefinition.styles = {
    title: {
      fontSize: 18,
      bold: true,
      color: '#5A7ACD',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle: {
      fontSize: 14,
      bold: true,
      color: '#2B2A2A',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle2: {
      fontSize: 12,
      bold: true,
      color: '#6B7280',
      alignment: 'center',
      direction: 'rtl'
    },
    sectionTitle: {
      fontSize: 12,
      bold: true,
      color: '#2B2A2A',
      margin: [0, 0, 0, 8],
      alignment: 'right',
      direction: 'rtl'
    },
    statLabel: {
      fontSize: 8,
      color: '#6B7280',
      margin: [0, 0, 0, 3],
      alignment: 'right',
      direction: 'rtl'
    },
    statValue: {
      fontSize: 12,
      bold: true,
      alignment: 'center',
      direction: 'rtl'
    },
    tableHeader: {
      fontSize: 8,
      bold: true,
      fillColor: '#F3F4F6',
      color: '#1F2937',
      alignment: 'center',
      direction: 'rtl',
      margin: [0, 0, 0, 0]
    },
    tableCell: {
      fontSize: 7,
      alignment: 'center',
      color: '#374151',
      direction: 'rtl'
    },
    teacherHeader: {
      fontSize: 10,
      bold: true,
      color: '#1F2937',
      fillColor: '#EFF6FF',
      margin: [0, 0, 0, 8],
      alignment: 'right',
      padding: [5, 8, 5, 8],
      direction: 'rtl'
    },
    signatureLabel: {
      fontSize: 9,
      color: '#6B7280',
      alignment: 'center',
      direction: 'rtl'
    }
  };

  return docDefinition;
};
