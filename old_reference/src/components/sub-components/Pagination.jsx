const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const generatePageNumbers = () => {
    const pages = [];
    const pageRange = 2;

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1); // First page

      if (currentPage > pageRange + 2) {
        pages.push("...");
      }

      for (let i = Math.max(2, currentPage - pageRange); i <= Math.min(totalPages - 1, currentPage + pageRange); i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - pageRange - 1) {
        pages.push("...");
      }

      pages.push(totalPages); // Last page
    }
    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <div className="flex flex-wrap md:flex-nowrap justify-between md:justify-center mt-4 w-full my-4">
      {currentPage > 1 && (
        <div className="">
          <button className="px-3 py-1 mx-1 border rounded" onClick={() => onPageChange(1)}>
            First
          </button>
          <button className="px-3 py-1 mx-1 border rounded" onClick={() => onPageChange(currentPage - 1)}>
            Previous
          </button>
        </div>
      )}
      <div className="hidden lg:flex">
        {pages.map((page, index) => (
          <button key={index} className={`px-3 py-1 mx-1 border rounded ${page === currentPage ? "bg-blue-500 text-white" : ""}`} onClick={() => page !== "..." && onPageChange(page)} disabled={page === "..."}>
            {page}
          </button>
        ))}
      </div>
      {currentPage < totalPages && (
        <div className="">
          <button className="px-3 py-1 mx-1 border rounded" onClick={() => onPageChange(currentPage + 1)}>
            Next
          </button>
          <button className="px-3 py-1 mx-1 border rounded" onClick={() => onPageChange(totalPages)}>
            Last
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
