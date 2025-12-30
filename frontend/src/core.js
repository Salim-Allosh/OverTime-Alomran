/**
 * Core Design System - نظام التصميم الأساسي
 * يحتوي على جميع الإعدادات الأساسية للتصميم: الخطوط، الألوان، المقاسات، الأبعاد، البوردرات، وأشكال العناصر
 */

// ============================================
// Typography - الخطوط
// ============================================
export const typography = {
  // نوع الخط الأساسي
  fontFamily: "'Cairo', sans-serif",
  
  // مقاسات الخطوط
  fontSize: {
    h1: "20px",
    h2: "16px",
    h3: "14px",
    h4: "13px",
    h5: "12px",
    h6: "11px",
    body: "13px",
    small: "12px",
    xs: "11px",
    xxs: "10px"
  },
  
  // أوزان الخطوط
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  
  // ألوان النصوص
  textColor: {
    primary: "#2B2A2A",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    white: "#FFFFFF",
    link: "#5A7ACD",
    linkHover: "#4A6AB8"
  },
  
  // ارتفاع السطر
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2
  }
};

// ============================================
// Colors - الألوان
// ============================================
export const colors = {
  // الألوان الأساسية
  primary: {
    main: "#5A7ACD",
    hover: "#4A6AB8",
    light: "#E8ECF5",
    dark: "#3A5A9D"
  },
  
  // الألوان الثانوية
  accent: {
    main: "#FEB05D",
    hover: "#E8A04D",
    light: "#FFF4E6",
    dark: "#D8903D"
  },
  
  // ألوان الخلفية
  background: {
    primary: "#F5F2F2",
    white: "#FFFFFF",
    gray: "#F9FAFB",
    lightGray: "#F3F4F6",
    dark: "#1e3a5f"
  },
  
  // ألوان الحدود
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF"
  },
  
  // ألوان الحالة
  status: {
    success: "#10B981",
    error: "#EF4444",
    warning: "#F59E0B",
    info: "#3B82F6",
    active: "#10B981",
    pending: "#F59E0B",
    inactive: "#9CA3AF"
  },
  
  // ألوان النصوص
  text: {
    primary: "#2B2A2A",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    white: "#FFFFFF",
    link: "#5A7ACD"
  }
};

// ============================================
// Spacing - المسافات
// ============================================
export const spacing = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "0.75rem",    // 12px
  lg: "1rem",       // 16px
  xl: "1.5rem",     // 24px
  xxl: "2rem",     // 32px
  xxxl: "3rem"     // 48px
};

// ============================================
// Dimensions - الأبعاد الأساسية
// ============================================
export const dimensions = {
  // أبعاد الحاويات
  container: {
    maxWidth: "1200px",
    padding: "1rem"
  },
  
  // أبعاد الأزرار
  button: {
    height: {
      small: "32px",
      medium: "40px",
      large: "48px"
    },
    padding: {
      small: "0.4rem 0.8rem",
      medium: "0.5rem 1rem",
      large: "0.75rem 1.5rem"
    }
  },
  
  // أبعاد الحقول
  input: {
    height: {
      small: "32px",
      medium: "40px",
      large: "48px"
    },
    padding: {
      small: "0.4rem 0.6rem",
      medium: "0.5rem 0.75rem",
      large: "0.75rem 1rem"
    }
  },
  
  // أبعاد الجداول
  table: {
    cellPadding: "10px 8px",
    headerPadding: "12px 8px",
    minWidth: "1200px"
  }
};

// ============================================
// Border Radius - كسر البوردرات
// ============================================
export const borderRadius = {
  none: "0",
  sm: "3px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "9999px"
};

// ============================================
// Shadows - الظلال
// ============================================
export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
};

// ============================================
// Element Styles - أشكال العناصر
// ============================================
export const elementStyles = {
  // أسلوب البطاقة
  card: {
    background: colors.background.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.border.light}`
  },
  
  // أسلوب الزر الأساسي
  button: {
    primary: {
      background: colors.primary.main,
      color: colors.text.white,
      borderRadius: borderRadius.md,
      padding: dimensions.button.padding.medium,
      fontWeight: typography.fontWeight.semibold,
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        background: colors.primary.hover
      }
    },
    secondary: {
      background: colors.background.white,
      color: colors.text.primary,
      borderRadius: borderRadius.md,
      padding: dimensions.button.padding.medium,
      fontWeight: typography.fontWeight.normal,
      border: `1px solid ${colors.border.medium}`,
      cursor: "pointer",
      transition: "all 0.2s ease",
      "&:hover": {
        background: colors.background.gray
      }
    }
  },
  
  // أسلوب الحقل
  input: {
    background: colors.background.white,
    color: colors.text.primary,
    borderRadius: borderRadius.sm,
    padding: dimensions.input.padding.medium,
    border: `1px solid ${colors.border.medium}`,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.xs,
    "&:focus": {
      outline: "none",
      borderColor: colors.primary.main,
      boxShadow: `0 0 0 3px ${colors.primary.light}`
    }
  },
  
  // أسلوب الجدول
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.xs,
    header: {
      background: colors.background.dark,
      color: colors.text.white,
      fontWeight: typography.fontWeight.bold,
      padding: dimensions.table.headerPadding,
      textAlign: "center",
      border: `1px solid ${colors.border.dark}`,
      fontFamily: typography.fontFamily,
      unicodeBidi: "embed",
      direction: "rtl"
    },
    cell: {
      padding: dimensions.table.cellPadding,
      textAlign: "center",
      border: `1px solid ${colors.border.light}`,
      fontFamily: typography.fontFamily,
      "&:nth-child(even)": {
        background: colors.background.lightGray
      }
    }
  },
  
  // أسلوب العنوان
  heading: {
    h1: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.h1,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      margin: `0 0 ${spacing.md} 0`
    },
    h2: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.h2,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      margin: `0 0 ${spacing.md} 0`
    },
    h3: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text.primary,
      margin: `0 0 ${spacing.sm} 0`
    }
  }
};

// ============================================
// Helper Functions - دوال مساعدة
// ============================================
export const getTableHeaderStyle = () => ({
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.bold,
  background: colors.background.dark,
  color: colors.text.white,
  padding: dimensions.table.headerPadding,
  textAlign: "center",
  border: `1px solid ${colors.border.dark}`,
  unicodeBidi: "embed",
  direction: "rtl"
});

export const getTableCellStyle = () => ({
  fontFamily: typography.fontFamily,
  fontSize: typography.fontSize.xs,
  padding: dimensions.table.cellPadding,
  textAlign: "center",
  border: `1px solid ${colors.border.light}`
});

// ============================================
// Default Export - التصدير الافتراضي
// ============================================
export default {
  typography,
  colors,
  spacing,
  dimensions,
  borderRadius,
  shadows,
  elementStyles,
  getTableHeaderStyle,
  getTableCellStyle
};



