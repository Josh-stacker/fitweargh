import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  totalItems: number;
  showingStart: number;
  showingEnd: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 100];

function ProductPagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  totalItems,
  showingStart,
  showingEnd,
  onPageChange,
  onPageSizeChange,
}: ProductPaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="hidden md:flex bg-white border border-[#DEDEDE] px-4 py-3 mt-8 flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="raleway-regular text-sm text-[#533113]/60">
          Showing {showingStart}-{showingEnd} of {totalItems} products
        </p>
        {onPageSizeChange && (
          <label className="flex items-center gap-2 raleway-regular text-sm text-[#533113]/60">
            View
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border border-[#DEDEDE] bg-white px-2 py-1.5 text-[#533113] outline-none focus:border-[#533113]"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-9 px-3 flex items-center gap-1.5 border border-[#DEDEDE] text-[#533113] hover:border-[#533113] hover:bg-[#533113]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed raleway-bold text-xs uppercase tracking-widest"
        >
          <CaretLeftIcon size={14} weight="bold" />
          Previous
        </button>

        {Array.from({ length: totalPages }).map((_, index) => {
          const page = index + 1;
          const isNearCurrent = Math.abs(page - currentPage) <= 1;
          const isEdge = page === 1 || page === totalPages;
          const showPage = isNearCurrent || isEdge;
          const showGap =
            (page === currentPage - 2 && page > 1) ||
            (page === currentPage + 2 && page < totalPages);

          if (!showPage) {
            return showGap ? (
              <span key={page} className="px-1 raleway-regular text-sm text-[#533113]/40">
                ...
              </span>
            ) : null;
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-9 min-w-9 px-3 border raleway-bold text-sm transition-colors ${
                currentPage === page
                  ? "bg-[#533113] text-white border-[#533113]"
                  : "bg-white text-[#533113] border-[#DEDEDE] hover:border-[#533113] hover:bg-[#533113]/5"
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-9 px-3 flex items-center gap-1.5 border border-[#DEDEDE] text-[#533113] hover:border-[#533113] hover:bg-[#533113]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed raleway-bold text-xs uppercase tracking-widest"
        >
          Next
          <CaretRightIcon size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export default ProductPagination;
