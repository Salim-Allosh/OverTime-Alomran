import React, { useState, useEffect, useRef } from "react";

const FilterDropdown = ({ options, selectedValues, onChange, placeholder, style, isSingle = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedValues, setTempSelectedValues] = useState(selectedValues);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedValues(selectedValues);
    }
  }, [isOpen, selectedValues]);

  const toggleOption = (val) => {
    if (isSingle) {
      setTempSelectedValues([val]);
    } else {
      if (tempSelectedValues.includes(val)) {
        setTempSelectedValues(tempSelectedValues.filter(v => v !== val));
      } else {
        setTempSelectedValues([...tempSelectedValues, val]);
      }
    }
  };

  const isAllSelected = !isSingle && options.length > 0 && tempSelectedValues.length === options.length;

  const toggleAll = () => {
    if (isSingle) return;
    if (isAllSelected) {
      setTempSelectedValues([]);
    } else {
      setTempSelectedValues(options.map(o => o.value));
    }
  };

  const handleApply = () => {
    onChange(tempSelectedValues);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="multiselect-container" style={{ position: "relative", ...style }}>
      <div
        className="multiselect-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: "0.4rem 0.5rem",
          borderRadius: "6px",
          border: "1px solid #dcdcdc",
          backgroundColor: "white",
          cursor: "pointer",
          minWidth: "150px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
          height: "36px"
        }}
      >
        <span style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "140px",
          fontFamily: "Cairo"
        }}>
          {selectedValues.length === 0
            ? placeholder
            : selectedValues.length === options.length
              ? `الكل (${options.length})`
              : selectedValues.length <= 2
                ? options.filter(o => selectedValues.includes(o.value)).map(o => o.label).join('، ')
                : `${selectedValues.length} مختار`}
        </span>
        <span style={{ fontSize: "10px", color: "#666" }}>{isOpen ? "▲" : "▼"}</span>
      </div>

      {isOpen && (
        <div
          className="multiselect-dropdown"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: "white",
            border: "1px solid #dcdcdc",
            borderRadius: "6px",
            marginTop: "4px",
            maxHeight: "300px",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "4px 0"
          }}
        >
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "200px" }}>
            {!isSingle && (
              <div
                style={{
                  padding: "0.5rem",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: "bold",
                  fontSize: "12px",
                  fontFamily: "Cairo"
                }}
                onClick={toggleAll}
              >
                <input type="checkbox" checked={isAllSelected} readOnly style={{ cursor: "pointer" }} />
                الكل
              </div>
            )}
            {options.map(opt => (
              <div
                key={opt.value}
                style={{
                  padding: "0.5rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "12px",
                  fontFamily: "Cairo",
                  backgroundColor: tempSelectedValues.includes(opt.value) ? "#f0f7ff" : "transparent"
                }}
                onClick={() => toggleOption(opt.value)}
              >
                <input
                  type={isSingle ? "radio" : "checkbox"}
                  checked={tempSelectedValues.includes(opt.value)}
                  readOnly
                  style={{ cursor: "pointer" }}
                />
                {opt.label}
              </div>
            ))}
          </div>

          <div style={{ padding: "8px", borderTop: "1px solid #eee" }}>
            <button
              onClick={handleApply}
              style={{
                width: "100%",
                padding: "6px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "Cairo",
                fontSize: "12px",
                fontWeight: "bold"
              }}
            >
              تطبيق الفلتر
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
