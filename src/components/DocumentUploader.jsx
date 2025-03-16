import React, { useState } from "react";
import { uploadCampaignDocuments } from "../services/documentService";
import { toast } from "react-toastify";

const DocumentUploader = ({ campaignId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.warning("Please select files to upload");
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("documents", file);
      });

      // Set up a mock progress interval (since axios doesn't easily track upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);

      const response = await uploadCampaignDocuments(campaignId, formData);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success("Documents uploaded successfully");
      setFiles([]);

      // Call the callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(response.documents);
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload documents");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Upload Supporting Documents</h3>

      <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="document-upload"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          disabled={uploading}
        />
        <label
          htmlFor="document-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-800 block mb-2"
        >
          <div className="flex flex-col items-center">
            <svg
              className="w-10 h-10 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm">
              Click to select files or drag and drop
            </span>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-4 text-left">
            <p className="text-sm font-medium text-gray-700">Selected files:</p>
            <ul className="mt-1 text-sm text-gray-500">
              {files.map((file, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 mr-1.5 text-gray-400"
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
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className={`px-4 py-2 rounded-md text-white ${
            files.length === 0 || uploading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {uploading ? "Uploading..." : "Upload Documents"}
        </button>
      </div>
    </div>
  );
};

export default DocumentUploader;
