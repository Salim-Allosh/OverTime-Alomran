import React from "react";

/**
 * مكون جدول موحد حسب Design System
 * يستخدم HTML Table فقط - بدون Cards
 */
export default function DataTable({ 
  columns = [], 
  data = [], 
  onRowClick = null,
  actions = null,
  className = ""
}) {
  return (
    <div className={`table-container ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx}
                style={{ 
                  textAlign: col.align || (col.type === "number" ? "left" : "right"),
                  width: col.width || "auto"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ width: "100px" }}>الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                لا توجد بيانات للعرض
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx}
                    data-type={col.type || "text"}
                    className={col.type === "number" ? "number" : "text"}
                    style={{ textAlign: col.align || (col.type === "number" ? "left" : "right") }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}




/**
 * مكون جدول موحد حسب Design System
 * يستخدم HTML Table فقط - بدون Cards
 */
export default function DataTable({ 
  columns = [], 
  data = [], 
  onRowClick = null,
  actions = null,
  className = ""
}) {
  return (
    <div className={`table-container ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx}
                style={{ 
                  textAlign: col.align || (col.type === "number" ? "left" : "right"),
                  width: col.width || "auto"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ width: "100px" }}>الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                لا توجد بيانات للعرض
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx}
                    data-type={col.type || "text"}
                    className={col.type === "number" ? "number" : "text"}
                    style={{ textAlign: col.align || (col.type === "number" ? "left" : "right") }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}




/**
 * مكون جدول موحد حسب Design System
 * يستخدم HTML Table فقط - بدون Cards
 */
export default function DataTable({ 
  columns = [], 
  data = [], 
  onRowClick = null,
  actions = null,
  className = ""
}) {
  return (
    <div className={`table-container ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx}
                style={{ 
                  textAlign: col.align || (col.type === "number" ? "left" : "right"),
                  width: col.width || "auto"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ width: "100px" }}>الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                لا توجد بيانات للعرض
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx}
                    data-type={col.type || "text"}
                    className={col.type === "number" ? "number" : "text"}
                    style={{ textAlign: col.align || (col.type === "number" ? "left" : "right") }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}




/**
 * مكون جدول موحد حسب Design System
 * يستخدم HTML Table فقط - بدون Cards
 */
export default function DataTable({ 
  columns = [], 
  data = [], 
  onRowClick = null,
  actions = null,
  className = ""
}) {
  return (
    <div className={`table-container ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx}
                style={{ 
                  textAlign: col.align || (col.type === "number" ? "left" : "right"),
                  width: col.width || "auto"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ width: "100px" }}>الإجراءات</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: "center", padding: "2rem", color: "#9CA3AF" }}>
                لا توجد بيانات للعرض
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr 
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx}
                    data-type={col.type || "text"}
                    className={col.type === "number" ? "number" : "text"}
                    style={{ textAlign: col.align || (col.type === "number" ? "left" : "right") }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}






