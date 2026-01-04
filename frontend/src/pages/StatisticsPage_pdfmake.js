// Helper function to build statistics report using pdfmake

export const buildStatisticsPDF = (
  statistics,
  totalDailyReports,
  totalMonthlyContracts,
  totalContractsValue,
  totalPaidAmount,
  totalRemainingAmount,
  totalNetAmount,
  branchName,
  salesStaffName,
  monthName,
  selectedYear,
  isSuperAdmin = false
) => {
  // Helper function to format Arabic text
  const formatArabicText = (text) => {
    if (!text || typeof text !== 'string') return text;
    let trimmedText = text.trim();
    trimmedText = trimmedText.replace(/\s+/g, ' ');
    trimmedText = trimmedText.replace(/[()]/g, '');
    return trimmedText;
  };

  // Helper function to format numbers with commas
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
      title: 'تقرير الإحصائيات الشامل'
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

  const filterTitle = `${branchName} - ${salesStaffName} - ${monthName} ${selectedYear}`;

  // Page 1: Title and Overall Statistics
  const firstPageContent = [
    // Title
    {
      text: formatArabicText('تقرير الإحصائيات الشامل'),
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
      text: formatArabicText(filterTitle),
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
            { text: formatArabicText('إجمالي التقارير اليومية'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatNumber(totalDailyReports, 0), style: 'statValueSmall', color: '#007bff', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي العقود الشهرية'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatNumber(totalMonthlyContracts, 0), style: 'statValueSmall', color: '#007bff', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي قيمة العقود'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalContractsValue)} درهم`), style: 'statValueSmall', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي المبالغ المدفوعة'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalPaidAmount)} درهم`), style: 'statValueSmall', color: '#28a745', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي المتبقي'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalRemainingAmount)} درهم`), style: 'statValueSmall', color: '#DC3545', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        },
        {
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي الصافي'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(totalNetAmount)} درهم`), style: 'statValueSmall', color: '#5A7ACD', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        }
      ],
      margin: [0, 0, 0, 10]
    }
  ];

  docDefinition.content.push(...firstPageContent);

  // If super admin and showing all branches, add summary table for all branches (on the same page as overall statistics)
  if (isSuperAdmin && branchName === "جميع الفروع" && statistics.branches_comprehensive && statistics.branches_comprehensive.length > 0) {
    // Add summary table for all branches
    const branchesSummaryContent = [
      {
        text: formatArabicText('ملخص إحصائيات الفروع'),
        style: 'sectionTitle',
        alignment: 'center',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: formatArabicText('اسم الفرع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد التقارير'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد العقود'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('قيمة العقود'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المتبقي'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
            ],
            ...statistics.branches_comprehensive.map(branch => [
              { text: formatArabicText(branch.branch_name), style: 'tableCell', bold: true, alignment: 'center' },
              { text: formatNumber(branch.total_daily_reports, 0), style: 'tableCell', alignment: 'center' },
              { text: formatNumber(branch.total_monthly_contracts, 0), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(branch.total_contracts_value))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(branch.total_paid_amount))} درهم`), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(branch.total_remaining_amount))} درهم`), style: 'tableCell', bold: true, color: '#DC3545', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(branch.total_net_amount))} درهم`), style: 'tableCell', bold: true, color: '#28A745', alignment: 'center' }
            ]),
            [
              { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + b.total_daily_reports, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + b.total_monthly_contracts, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + parseFloat(b.total_contracts_value), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#5A7ACD', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + parseFloat(b.total_paid_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + parseFloat(b.total_remaining_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#DC3545', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.branches_comprehensive.reduce((sum, b) => sum + parseFloat(b.total_net_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#28A745', alignment: 'center' }
            ]
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
    ];
    docDefinition.content.push(...branchesSummaryContent);
  }

  // Daily Reports Details
  if (statistics.daily_reports_details) {
    const dailyReportsContent = [
      {
        text: formatArabicText('إحصائيات التقارير اليومية'),
        style: 'sectionTitle',
        alignment: 'center',
        margin: [0, 20, 0, 10]
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي المكالمات'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_calls, 0), style: 'statValue', color: '#007bff', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_hot_calls, 0), style: 'statValue', color: '#ffc107', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي الووك إن'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_walk_ins, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي ليدز الفرع'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_branch_leads, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي ليدز الأونلاين'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_online_leads, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي ليدز إضافي'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_extra_leads, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          },
          {
            width: '*',
            stack: [
              { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' },
              { text: formatNumber(statistics.daily_reports_details.total_visits, 0), style: 'statValue', color: '#28a745', alignment: 'center' }
            ],
            margin: [2, 0, 2, 5]
          }
        ],
        margin: [0, 0, 0, 15]
      }
    ];
    docDefinition.content.push(...dailyReportsContent);
  }

  // Payment Methods Details
  if (statistics.payment_methods_details && statistics.payment_methods_details.length > 0) {
    const paymentMethodsContent = [
      {
        text: formatArabicText('إحصائيات حسب طريقة الدفع'),
        style: 'sectionTitle',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: formatArabicText('طريقة الدفع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المبلغ الإجمالي'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد المعاملات'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المبلغ الصافي'), style: 'tableHeader', alignment: 'center' }
            ],
            ...statistics.payment_methods_details.map(method => [
              { text: formatArabicText(method.payment_method_name), style: 'tableCell', bold: true, alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(method.total_paid))} درهم`), style: 'tableCell', alignment: 'center' },
              { text: formatNumber(method.transactions_count, 0), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(method.total_net))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' }
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
    ];
    docDefinition.content.push(...paymentMethodsContent);
  }

  // Sales Staff Details
  if (statistics.sales_staff_details && statistics.sales_staff_details.length > 0) {
    // Activity Statistics Table
    const activityTable = {
      text: formatArabicText('إحصائيات النشاط اليومي'),
      style: 'sectionTitle',
      margin: [0, 20, 0, 10]
    };
    docDefinition.content.push(activityTable);

    const activityTableData = {
      table: {
        headerRows: 1,
        widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: formatArabicText('عدد التقارير'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('عدد الزيارات'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('ليدز إضافي'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('ليدز أونلاين'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('ليدز فرع'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('ووك إن'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('هوت كول'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('مكالمات'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الفرع'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('اسم الموظف'), style: 'tableHeader', alignment: 'center' }
          ],
          ...statistics.sales_staff_details.map(staff => [
            { text: formatNumber(staff.reports_count || 0, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_visits, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_extra_leads, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_online_leads, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_branch_leads, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_walk_ins, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_hot_calls, 0), style: 'tableCell', alignment: 'center' },
            { text: formatNumber(staff.total_calls, 0), style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(staff.branch_name), style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(staff.staff_name), style: 'tableCell', bold: true, alignment: 'center' }
          ]),
          [
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + (s.reports_count || 0), 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_visits, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_extra_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_online_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_branch_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_walk_ins, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_hot_calls, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.total_calls, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: '-', style: 'tableCell', fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' }
          ]
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
    };
    docDefinition.content.push(activityTableData);

    // Sales Statistics Table
    const salesTableTitle = {
      text: formatArabicText('إحصائيات المبيعات'),
      style: 'sectionTitle',
      margin: [0, 20, 0, 10]
    };
    docDefinition.content.push(salesTableTitle);

    const salesTableData = {
      table: {
        headerRows: 1,
        widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*'],
        body: [
          [
            { text: formatArabicText('اسم الموظف'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الفرع'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('إجمالي المبيعات'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('عدد العقود'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('قيمة العقود'), style: 'tableHeader', alignment: 'center' },
            { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
          ],
          ...statistics.sales_staff_details.map(staff => [
            { text: formatArabicText(staff.staff_name), style: 'tableCell', bold: true, alignment: 'center' },
            { text: formatArabicText(staff.branch_name), style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(parseFloat(staff.total_sales))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' },
            { text: formatNumber(staff.contracts_count, 0), style: 'tableCell', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(parseFloat(staff.contracts_value))} درهم`), style: 'tableCell', bold: true, alignment: 'center' },
            { text: formatArabicText(`${formatNumber(parseFloat(staff.total_net_amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#28A745', alignment: 'center' }
          ]),
          [
            { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: '-', style: 'tableCell', fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_sales), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#5A7ACD', alignment: 'center' },
            { text: formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + s.contracts_count, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.contracts_value), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(statistics.sales_staff_details.reduce((sum, s) => sum + parseFloat(s.total_net_amount || 0), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#28A745', alignment: 'center' }
          ]
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
    };
    docDefinition.content.push(salesTableData);
  }

  // Incomplete Payment Contracts - Summary by Branch
  if (statistics.incomplete_payment_contracts && statistics.incomplete_payment_contracts.length > 0) {
    // Group contracts by branch
    const contractsByBranch = {};
    statistics.incomplete_payment_contracts.forEach(contract => {
      const branchName = contract.branch_name || 'غير محدد';
      if (!contractsByBranch[branchName]) {
        contractsByBranch[branchName] = {
          count: 0,
          totalRemaining: 0
        };
      }
      contractsByBranch[branchName].count++;
      contractsByBranch[branchName].totalRemaining += parseFloat(contract.remaining_amount || 0);
    });

    const incompleteContractsContent = [
      {
        text: formatArabicText('ملخص العقود التي مازالت تملك دفعة غير مكتملة'),
        style: 'sectionTitle',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', '*'],
          body: [
            [
              { text: formatArabicText('الفرع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد العقود'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('إجمالي المتبقي'), style: 'tableHeader', alignment: 'center' }
            ],
            ...Object.entries(contractsByBranch).map(([branchName, data]) => [
              { text: formatArabicText(branchName), style: 'tableCell', bold: true, alignment: 'center' },
              { text: formatNumber(data.count, 0), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(data.totalRemaining)} درهم`), style: 'tableCell', bold: true, color: '#DC3545', alignment: 'center' }
            ]),
            [
              { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatNumber(Object.values(contractsByBranch).reduce((sum, data) => sum + data.count, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(Object.values(contractsByBranch).reduce((sum, data) => sum + data.totalRemaining, 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#DC3545', alignment: 'center' }
            ]
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
    ];
    docDefinition.content.push(...incompleteContractsContent);
  }

  // Course Registration Details
  if (statistics.course_registration_details && statistics.course_registration_details.length > 0) {
    const courseDetailsContent = [
      {
        text: formatArabicText('تفاصيل التسجيل في كل نوع كورس'),
        style: 'sectionTitle',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: formatArabicText('اسم الكورس'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('عدد الفروع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('إجمالي التسجيلات'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('القيمة الإجمالية'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('المتبقي'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
            ],
            ...statistics.course_registration_details.map(course => [
              { text: formatArabicText(course.course_name), style: 'tableCell', bold: true, alignment: 'center' },
              { text: formatNumber(course.branches_count, 0), style: 'tableCell', alignment: 'center' },
              { text: formatNumber(course.total_registrations, 0), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(course.total_value))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(course.paid_amount))} درهم`), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(course.remaining_amount))} درهم`), style: 'tableCell', bold: true, color: '#DC3545', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(parseFloat(course.net_amount))} درهم`), style: 'tableCell', bold: true, color: '#28A745', alignment: 'center' }
            ]),
            [
              { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: '-', style: 'tableCell', fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + c.total_registrations, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.total_value), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#5A7ACD', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.paid_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.remaining_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#DC3545', alignment: 'center' },
              { text: formatArabicText(`${formatNumber(statistics.course_registration_details.reduce((sum, c) => sum + parseFloat(c.net_amount), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#28A745', alignment: 'center' }
            ]
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
    ];
    docDefinition.content.push(...courseDetailsContent);
  }

  // Visits Details Table
  if (!isSuperAdmin && statistics.visits_details && statistics.visits_details.length > 0) {
    const visitsContent = [
      {
        text: formatArabicText('تفاصيل الزيارات'),
        style: 'sectionTitle',
        margin: [0, 20, 0, 10]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [
              { text: formatArabicText('التاريخ'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('الفرع'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('الموظف'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('رقم الزيارة'), style: 'tableHeader', alignment: 'center' },
              { text: formatArabicText('التفاصيل'), style: 'tableHeader', alignment: 'center' }
            ],
            ...statistics.visits_details.map(visit => [
              { text: visit.date, style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(visit.branch), style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(visit.sales_staff), style: 'tableCell', alignment: 'center' },
              { text: visit.visit_order, style: 'tableCell', alignment: 'center' },
              { text: formatArabicText(visit.details), style: 'tableCell', alignment: 'right' }
            ])
          ]
        },
        layout: {
          hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
          vLineWidth: function (i, node) { return 0.3; },
          hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
          vLineColor: function (i, node) { return '#E5E7EB'; },
          paddingTop: function (i) { return 4; },
          paddingBottom: function (i) { return 4; }
        }
      }
    ];
    docDefinition.content.push(...visitsContent);
  }

  // If super admin and showing all branches, add detailed pages for each branch
  if (isSuperAdmin && branchName === "جميع الفروع" && statistics.branches_comprehensive && statistics.branches_comprehensive.length > 0) {
    statistics.branches_comprehensive.forEach((branch, index) => {
      // Add page break before each branch to start on a new page
      docDefinition.content.push({ text: '', pageBreak: 'before' });

      // Branch title
      const branchPageContent = [
        {
          text: formatArabicText(`إحصائيات فرع: ${branch.branch_name}`),
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: formatArabicText(filterTitle),
          style: 'subtitle2',
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#5A7ACD' }],
          margin: [0, 0, 0, 15]
        },
        // Branch Overall Statistics
        {
          text: formatArabicText('الإحصائيات الإجمالية للفرع'),
          style: 'sectionTitle',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: formatArabicText('الصافي'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatArabicText(`${formatNumber(parseFloat(branch.total_net_amount))} درهم`), style: 'statValueSmall', color: '#5A7ACD', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المتبقي'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatArabicText(`${formatNumber(parseFloat(branch.total_remaining_amount))} درهم`), style: 'statValueSmall', color: '#DC3545', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('المبالغ المدفوعة'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatArabicText(`${formatNumber(parseFloat(branch.total_paid_amount))} درهم`), style: 'statValueSmall', color: '#28a745', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('قيمة العقود'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatArabicText(`${formatNumber(parseFloat(branch.total_contracts_value))} درهم`), style: 'statValueSmall', color: '#5A7ACD', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('عدد العقود الشهرية'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatNumber(branch.total_monthly_contracts, 0), style: 'statValueSmall', color: '#007bff', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            },
            {
              width: '*',
              stack: [
                { text: formatArabicText('عدد التقارير اليومية'), style: 'statLabelSmall', alignment: 'center' },
                { text: formatNumber(branch.total_daily_reports, 0), style: 'statValueSmall', color: '#007bff', alignment: 'center' }
              ],
              margin: [2, 0, 2, 2]
            }
          ],
          margin: [0, 0, 0, 15]
        }
      ];

      // Add Discounted to branch stats if exists
      if (branch.total_discounted > 0) {
        branchPageContent[4].columns.unshift({
          width: '*',
          stack: [
            { text: formatArabicText('إجمالي النسبة'), style: 'statLabelSmall', alignment: 'center' },
            { text: formatArabicText(`${formatNumber(parseFloat(branch.total_discounted))} درهم`), style: 'statValueSmall', color: '#DC3545', alignment: 'center' }
          ],
          margin: [2, 0, 2, 2]
        });
      }

      // Branch Daily Reports Details
      if (branch.daily_reports_stats) {
        branchPageContent.push(
          {
            text: formatArabicText('إحصائيات التقارير اليومية'),
            style: 'sectionTitle',
            alignment: 'center',
            margin: [0, 20, 0, 10]
          },
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي المكالمات'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_calls, 0), style: 'statValue', color: '#007bff', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الهوت كول'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_hot_calls, 0), style: 'statValue', color: '#ffc107', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الووك إن'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_walk_ins, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي ليدز الفرع'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_branch_leads, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي ليدز الأونلاين'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_online_leads, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي ليدز إضافي'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_extra_leads || 0, 0), style: 'statValue', color: '#17a2b8', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              },
              {
                width: '*',
                stack: [
                  { text: formatArabicText('إجمالي الزيارات'), style: 'statLabel', alignment: 'center' },
                  { text: formatNumber(branch.daily_reports_stats.total_visits, 0), style: 'statValue', color: '#28a745', alignment: 'center' }
                ],
                margin: [2, 0, 2, 5]
              }
            ],
            margin: [0, 0, 0, 15]
          }
        );
      }

      // Branch Payment Methods
      if (branch.payment_methods_stats && branch.payment_methods_stats.length > 0) {
        branchPageContent.push(
          {
            text: formatArabicText('إحصائيات حسب طريقة الدفع'),
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('طريقة الدفع'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المبلغ الإجمالي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('عدد المعاملات'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المبلغ الصافي'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branch.payment_methods_stats.map(method => [
                  { text: formatArabicText(method.payment_method_name), style: 'tableCell', bold: true, alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(method.total_paid))} درهم`), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(method.transactions_count, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(method.total_net))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' }
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

      // Branch Sales Staff
      if (branch.sales_staff_stats && branch.sales_staff_stats.length > 0) {
        // Activity Statistics Table
        branchPageContent.push(
          {
            text: formatArabicText('إحصائيات النشاط اليومي'),
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('عدد التقارير'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('عدد الزيارات'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('ليدز إضافي'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('ليدز أونلاين'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('ليدز فرع'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('ووك إن'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('هوت كول'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('مكالمات'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('اسم الموظف'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branch.sales_staff_stats.map(staff => [
                  { text: formatNumber(staff.reports_count || 0, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_visits, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_extra_leads, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_online_leads, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_branch_leads, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_walk_ins, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_hot_calls, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatNumber(staff.total_calls, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(staff.staff_name), style: 'tableCell', bold: true, alignment: 'center' }
                ]),
                [
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + (s.reports_count || 0), 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_visits, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_extra_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_online_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_branch_leads, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_walk_ins, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_hot_calls, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.total_calls, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' }
                ]
              ]
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingTop: function () { return 4; },
              paddingBottom: function () { return 4; }
            },
            margin: [0, 0, 0, 15]
          }
        );

        // Sales Statistics Table
        branchPageContent.push(
          {
            text: formatArabicText('إحصائيات المبيعات'),
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('اسم الموظف'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('إجمالي المبيعات'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('عدد العقود'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('قيمة العقود'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branch.sales_staff_stats.map(staff => [
                  { text: formatArabicText(staff.staff_name), style: 'tableCell', bold: true, alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(staff.total_sales))} درهم`), style: 'tableCell', bold: true, color: '#5A7ACD', alignment: 'center' },
                  { text: formatNumber(staff.contracts_count, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(staff.contracts_value))} درهم`), style: 'tableCell', bold: true, alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(staff.total_net_amount || 0))} درهم`), style: 'tableCell', bold: true, color: '#28A745', alignment: 'center' }
                ]),
                [
                  { text: formatArabicText('الإجمالي'), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + parseFloat(s.total_sales), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#5A7ACD', alignment: 'center' },
                  { text: formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + s.contracts_count, 0), 0), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + parseFloat(s.contracts_value), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(branch.sales_staff_stats.reduce((sum, s) => sum + parseFloat(s.total_net_amount || 0), 0))} درهم`), style: 'tableCell', bold: true, fillColor: '#F9FAFB', color: '#28A745', alignment: 'center' }
                ]
              ]
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingTop: function () { return 4; },
              paddingBottom: function () { return 4; }
            },
            margin: [0, 0, 0, 15]
          }
        );
      }

      // Branch Incomplete Contracts
      if (branch.incomplete_contracts_stats && branch.incomplete_contracts_stats.length > 0) {
        branchPageContent.push(
          {
            text: formatArabicText('ملخص العقود التي مازالت تملك دفعة غير مكتملة'),
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('اسم الطالب'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('الكورس'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المتبقي'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branch.incomplete_contracts_stats.map(c => [
                  { text: formatArabicText(c.student_name), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(c.course_name), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(c.paid_amount)} درهم`), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(c.remaining_amount)} درهم`), style: 'tableCell', bold: true, color: '#DC3545', alignment: 'center' }
                ])
              ]
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingTop: function (i) { return 4; },
              paddingBottom: function (i) { return 4; }
            },
            margin: [0, 0, 0, 15]
          }
        );
      }

      // Branch Course Registration
      if (branch.course_registration_stats && branch.course_registration_stats.length > 0) {
        branchPageContent.push(
          {
            text: formatArabicText('تفاصيل التسجيل في كل نوع كورس'),
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', 'auto', 'auto', '*'],
              body: [
                [
                  { text: formatArabicText('اسم الكورس'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('التسجيلات'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('القيمة'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('المدفوع'), style: 'tableHeader', alignment: 'center' },
                  { text: formatArabicText('الصافي'), style: 'tableHeader', alignment: 'center' }
                ],
                ...branch.course_registration_stats.map(course => [
                  { text: formatArabicText(course.course_name), style: 'tableCell', bold: true, alignment: 'center' },
                  { text: formatNumber(course.total_registrations, 0), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(course.total_value))} درهم`), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(course.paid_amount))} درهم`), style: 'tableCell', alignment: 'center' },
                  { text: formatArabicText(`${formatNumber(parseFloat(course.net_amount))} درهم`), style: 'tableCell', bold: true, color: '#28A745', alignment: 'center' }
                ])
              ]
            },
            layout: {
              hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 0.8 : 0.3; },
              vLineWidth: function (i, node) { return 0.3; },
              hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#5A7ACD' : '#E5E7EB'; },
              vLineColor: function (i, node) { return '#E5E7EB'; },
              paddingTop: function (i) { return 4; },
              paddingBottom: function (i) { return 4; }
            },
            margin: [0, 0, 0, 15]
          }
        );
      }

      docDefinition.content.push(...branchPageContent);
    });
  }

  // Add styles
  docDefinition.styles = {
    title: {
      fontSize: 20,
      bold: true,
      color: '#007bff',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle: {
      fontSize: 16,
      bold: true,
      color: '#333',
      alignment: 'center',
      direction: 'rtl'
    },
    subtitle2: {
      fontSize: 14,
      bold: true,
      color: '#666',
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
    statLabelSmall: {
      fontSize: 6,
      color: '#6B7280',
      margin: [0, 0, 0, 1],
      alignment: 'center',
      direction: 'rtl'
    },
    statValueSmall: {
      fontSize: 9,
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
    }
  };

  return docDefinition;
};

