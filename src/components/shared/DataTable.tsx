"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  Download,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  searchColumn?: string;
  pageSize?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  exportFileName?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  searchPlaceholder = "Search records...",
  searchField,
  searchColumn,
  pageSize: initialPageSize = 15,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "There are no entries matching your current filters.",
  onRowClick,
  exportFileName = "export",
  className = "",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = initialPageSize;

  const effectiveSearchField = searchField || (searchColumn ? (row: T) => String(row[searchColumn] ?? "") : undefined);

  // 1. Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (effectiveSearchField) {
        return effectiveSearchField(row).toLowerCase().includes(term);
      }
      return Object.values(row).some(
        (val) => val != null && String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, effectiveSearchField]);

  // 2. Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      const cmp = String(valA).localeCompare(String(valB));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDirection]);

  // 3. Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handle Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = sortedData.map((row) =>
      columns
        .map((col) => {
          const val = row[(col.key || col.accessorKey || "") as string];
          return `"${String(val ?? "").replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`card-surface overflow-hidden flex flex-col ${className}`}>
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--surface-card)]">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full h-10 pl-9 pr-3 text-body-sm bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-md focus:outline-none focus:border-[var(--accent-base)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-caption text-[var(--text-muted)] hidden sm:inline mr-2 tabular-nums">
            {sortedData.length} total
          </span>
          <button
            onClick={handleExportCSV}
            className="h-10 px-3 inline-flex items-center gap-1.5 text-body-sm font-medium border border-[var(--border-strong)] rounded-md bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-subtle)] text-label">
              {columns.map((col, idx) => {
                const cKey = col.key || col.accessorKey || `col_${idx}`;
                return (
                  <th
                    key={cKey}
                    onClick={() => col.sortable && handleSort(cKey)}
                    className={`py-3 px-4 text-label select-none ${
                      col.sortable ? "cursor-pointer hover:text-[var(--text-primary)]" : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${col.className || ""}`}
                    style={{ width: col.width }}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
                      <span>{col.header}</span>
                      {col.sortable && (
                        <ArrowUpDown
                          className={`w-3.5 h-3.5 transition-colors ${
                            sortKey === cKey ? "text-[var(--accent-base)]" : "text-[var(--border-strong)]"
                          }`}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] text-body-sm">
            {isLoading ? (
              // Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="h-12 animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3 px-4">
                      <div className="h-4 bg-[var(--surface-subtle)] rounded-xs w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => {
                const rowKey = String(row[keyField] ?? rIdx);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={`h-12 transition-colors hover:bg-[var(--surface-hover)] ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col, cIdx) => {
                      const cKey = col.key || col.accessorKey || `col_${cIdx}`;
                      const cellContent = col.render ? col.render(row) : col.cell ? col.cell(row) : (row[cKey] ?? "—");
                      return (
                        <td
                          key={cKey}
                          className={`py-3.5 px-4 text-body-sm text-[var(--text-primary)] ${
                            col.align === "right"
                              ? "text-right tabular-nums"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left"
                          } ${col.className || ""}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Scannable Card List (Screen < 768px) */}
      <div className="md:hidden divide-y divide-[var(--border-subtle)]">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-5 bg-[var(--surface-subtle)] rounded-xs w-1/2" />
              <div className="h-4 bg-[var(--surface-subtle)] rounded-xs w-3/4" />
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="py-8">
            <EmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          paginatedData.map((row, rIdx) => {
            const rowKey = String(row[keyField] ?? rIdx);
            return (
              <div
                key={rowKey}
                onClick={() => onRowClick?.(row)}
                className={`p-4 space-y-2.5 transition-colors active:bg-[var(--surface-hover)] ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col, idx) => {
                  const cKey = col.key || col.accessorKey || `col_${idx}`;
                  return (
                    <div key={cKey} className="flex items-center justify-between text-body-sm">
                      <span className="text-label text-[var(--text-muted)]">{col.header}</span>
                      <span className="text-[var(--text-primary)] font-medium text-right">
                        {col.render ? col.render(row) : col.cell ? col.cell(row) : (row[cKey] ?? "—")}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <div className="p-3.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-body-sm text-[var(--text-secondary)] bg-[var(--surface-card)]">
          <span className="text-caption">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-[var(--border-subtle)] rounded-md disabled:opacity-30 hover:bg-[var(--surface-hover)] cursor-pointer disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-[var(--border-subtle)] rounded-md disabled:opacity-30 hover:bg-[var(--surface-hover)] cursor-pointer disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
