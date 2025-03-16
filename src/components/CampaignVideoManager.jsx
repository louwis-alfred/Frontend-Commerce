import axios from "axios";
import { toast } from "react-toastify";
import { FaTrash, FaStar, FaUpload } from "react-icons/fa";
import PropTypes from "prop-types";
import { Tooltip } from "react-tooltip";

const CampaignVideoManager = ({
  campaignId,
  videos = [],
  onUpdateVideos,
  authToken,
}) => {
  const backendUrl = "http://localhost:4000"; // Default backend URL
  
  // Ensure videos is always a valid array for safety
  const safeVideos = Array.isArray(videos) ? videos : [];

  const handleRemoveVideo = async (videoIndex) => {
    try {
      const loadingToast = toast.loading("Removing video...");
      const response = await axios.delete(
        `${backendUrl}/api/campaign/${campaignId}/videos/${videoIndex}`,
        {
          headers: {
            Authorization: `Bearer ${authToken || localStorage.getItem("token")}`,
          },
        }
      );

      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success("Video removed successfully");
        if (onUpdateVideos && response.data.videos) {
          onUpdateVideos(response.data.videos);
        }
      }
    } catch (error) {
      console.error("Error removing video:", error);
      toast.error(error.response?.data?.message || "Error removing video");
    }
  };

  const handleSetMainVideo = async (videoIndex) => {
    try {
      const loadingToast = toast.loading("Setting as main video...");
      const response = await axios.put(
        `${backendUrl}/api/campaign/${campaignId}/videos/${videoIndex}/main`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken || localStorage.getItem("token")}`,
          },
        }
      );

      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success("Main video updated successfully");
        if (onUpdateVideos && response.data.videos) {
          onUpdateVideos(response.data.videos);
        }
      }
    } catch (error) {
      console.error("Error updating main video:", error);
      toast.error(error.response?.data?.message || "Error updating main video");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {safeVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {safeVideos.map((video, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="relative">
                <img
                  src={
                    video?.thumbnail ||
                    "https://via.placeholder.com/640x360?text=No+Thumbnail"
                  }
                  alt={video?.title || `Video ${index + 1}`}
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/640x360?text=Error+Loading+Thumbnail";
                  }}
                />
                {video?.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-xs text-white px-2 py-1 rounded-full">
                    Main Video
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm mb-1 truncate">
                  {video?.title || `Video ${index + 1}`}
                </h4>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => handleSetMainVideo(index)}
                    disabled={video?.isMain}
                    className={`text-xs px-2 py-1 rounded ${
                      video?.isMain
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                    data-tooltip-id="set-main-tooltip"
                    data-tooltip-content="Set as main video"
                  >
                    <FaStar className="inline-block mr-1" />
                    {video?.isMain ? "Main" : "Set as Main"}
                  </button>
                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                    data-tooltip-id="remove-tooltip"
                    data-tooltip-content="Remove video"
                  >
                    <FaTrash className="inline-block mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-md">
          <FaUpload className="mx-auto text-gray-400 text-4xl" />
          <p className="text-gray-500 mt-2">
            No videos added to this campaign yet
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Click &quot;Add Video&quot; to upload campaign videos
          </p>
        </div>
      )}
      <Tooltip id="set-main-tooltip" />
      <Tooltip id="remove-tooltip" />
    </div>
  );
};

// Updated PropTypes validation
CampaignVideoManager.propTypes = {
  campaignId: PropTypes.string.isRequired,
  videos: PropTypes.array,
  onUpdateVideos: PropTypes.func,
  authToken: PropTypes.string,
};

// Add default props for extra safety
CampaignVideoManager.defaultProps = {
  videos: [],
  onUpdateVideos: () => {},
  authToken: "",
};

export default CampaignVideoManager;