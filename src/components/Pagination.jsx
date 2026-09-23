import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 5,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems === 0) return null;

  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (effectivePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, effectivePage * itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-3 pt-3.5 border-t border-slate-100 mt-3.5 text-xs w-full">
      {/* Range Info & Items Per Page Selector */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-slate-500 font-medium w-full">
        <span className="whitespace-nowrap">
          Showing <strong className="text-slate-900 font-bold">{startItem}</strong> -{" "}
          <strong className="text-slate-900 font-bold">{endItem}</strong> of{" "}
          <strong className="text-slate-900 font-bold">{totalItems}</strong>
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2.5">
            <span className="text-[11px] text-slate-400 whitespace-nowrap">Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700 outline-none focus:border-[#4B5D3C] focus:bg-white transition cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls - Center aligned inside container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 shrink-0 w-full pt-0.5">
          {/* Previous Button */}
          <button
            type="button"
            disabled={effectivePage <= 1}
            onClick={() => onPageChange && onPageChange(effectivePage - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white shrink-0"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => {
              if (page === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 font-bold">
                    ...
                  </span>
                );
              }

              const isActive = page === effectivePage;

              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => onPageChange && onPageChange(page)}
                  className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-[#4B5D3C] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={effectivePage >= totalPages}
            onClick={() => onPageChange && onPageChange(effectivePage + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
