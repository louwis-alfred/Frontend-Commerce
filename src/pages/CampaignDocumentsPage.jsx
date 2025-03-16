import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DocumentUploader from "../components/DocumentUploader";
import DocumentList from "../components/DocumentList";
import { toast } from "react-toastify";

const CampaignDocumentsPage = () => {
  const { campaignId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    // Fetch campaign details if needed
    // This is optional if you already have the campaign data
  }, [campaignId]);

  const handleUploadSuccess = () => {
    toast.success("Documents uploaded successfully!");
    setRefreshKey((prev) => prev + 1); // Force refresh of document list
  };

  const handleDocumentDeleted = () => {
    toast.success("Document deleted successfully!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Campaign Documents</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DocumentUploader
            campaignId={campaignId}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>

        <div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Supporting Documents</h3>
            <DocumentList
              key={refreshKey}
              campaignId={campaignId}
              canDelete={true}
              onDocumentDeleted={handleDocumentDeleted}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDocumentsPage;
