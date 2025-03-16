import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import PropTypes from "prop-types";

// Configure PDF.js worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const DocumentViewerModal = ({ isOpen, onClose, documentUrl, title }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error("Document load error:", error);
    setError(
      "Failed to load document. The file may be corrupted or unsupported."
    );
    setLoading(false);
  };

  const handlePrevPage = () => {
    setPageNumber((prevPageNumber) => Math.max(prevPageNumber - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prevPageNumber) => Math.min(prevPageNumber + 1, numPages));
  };

  // Determine file type from URL or mime type
  const isPdf = documentUrl?.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(documentUrl);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            {title || "Document Viewer"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 p-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="mt-2">{error}</p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
              >
                Download Document
              </a>
            </div>
          )}

          {!loading && !error && (
            <>
              {isPdf ? (
                <div className="flex flex-col items-center">
                  <Document
                    file={documentUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      width={Math.min(600, window.innerWidth - 80)}
                    />
                  </Document>

                  {numPages > 1 && (
                    <div className="flex items-center justify-center mt-4 space-x-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={pageNumber <= 1}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <p className="text-sm">
                        Page {pageNumber} of {numPages}
                      </p>
                      <button
                        onClick={handleNextPage}
                        disabled={pageNumber >= numPages}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : isImage ? (
                <div className="flex justify-center">
                  <img
                    src={documentUrl}
                    alt={title || "Document"}
                    className="max-w-full max-h-[70vh] object-contain"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setError("Failed to load image");
                      setLoading(false);
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500">
                    This document format can&apos;t be previewed
                  </p>
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
                  >
                    Download Document
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-between">
          <div className="text-sm text-gray-600">
            {documentUrl ? (
              <>Document provided as investment verification</>
            ) : (
              <>No document available</>
            )}
          </div>
          <a
            href={documentUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

DocumentViewerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  documentUrl: PropTypes.string,
  title: PropTypes.string,
};

export default DocumentViewerModal;
