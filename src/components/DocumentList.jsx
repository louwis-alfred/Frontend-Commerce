import React, { useState, useEffect, useContext } from "react";
import {
  getCampaignDocuments,
  deleteDocument,
} from "../services/documentService";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import {
  AiOutlineFilePdf,
  AiOutlineFileImage,
  AiOutlineFileText,
  AiOutlineDelete,
  AiOutlineDownload,
} from "react-icons/ai";

const DocumentList = ({ campaignId, canDelete = false, onDocumentDeleted }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    if (campaignId) {
      fetchDocuments();
    }
  }, [campaignId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getCampaignDocuments(campaignId);
      setDocuments(response.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      await deleteDocument(campaignId, documentId);
      toast.success("Document deleted successfully");

      // Update the local state
      setDocuments(documents.filter((doc) => doc._id !== documentId));

      // Call callback if provided
      if (onDocumentDeleted) {
        onDocumentDeleted(documentId);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const getDocumentIcon = (url) => {
    if (!url) return <AiOutlineFileText className="w-6 h-6 text-gray-500" />;

    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith(".pdf")) {
      return <AiOutlineFilePdf className="w-6 h-6 text-red-500" />;
    } else if (lowercaseUrl.match(/\.(jpe?g|png|gif|bmp|webp)$/)) {
      return <AiOutlineFileImage className="w-6 h-6 text-blue-500" />;
    }

    return <AiOutlineFileText className="w-6 h-6 text-gray-500" />;
  };

  const openDocument = (url) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mt-2 text-gray-500">No documents available</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {documents.map((doc, index) => (
          <li
            key={doc._id || index}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div
              className="flex items-center cursor-pointer"
              onClick={() => openDocument(doc.url)}
            >
              {getDocumentIcon(doc.url)}
              <span className="ml-2 truncate max-w-xs">
                {doc.name || `Document ${index + 1}`}
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openDocument(doc.url)}
                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                title="View"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>

              <a
                href={doc.url}
                download
                className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded"
                title="Download"
              >
                <AiOutlineDownload className="w-5 h-5" />
              </a>

              {canDelete && (
                <button
                  onClick={() => handleDeleteDocument(doc._id)}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                  title="Delete"
                >
                  <AiOutlineDelete className="w-5 h-5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentList;
