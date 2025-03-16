import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const CampaignVideoUploader = ({
  campaign,
  onVideoAdded,
  backendUrl,
  authToken,
}) => {
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's a video
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    setSelectedVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file for the thumbnail");
      return;
    }

    setSelectedThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedVideo) {
      toast.error("Please select a video to upload");
      return;
    }

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append("video", selectedVideo);
    if (selectedThumbnail) {
      formData.append("thumbnail", selectedThumbnail);
    }
    formData.append("title", videoTitle || `${campaign.title} Video`);
    formData.append("description", videoDescription);

    try {
      const loadingToast = toast.loading("Uploading your video...");

      const response = await axios.post(
        `${backendUrl}/api/campaign-videos/${campaign._id}/videos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authToken}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            toast.update(loadingToast, {
              render: `Uploading video: ${percentCompleted}%`,
            });
          },
        }
      );

      toast.dismiss(loadingToast);
      toast.success("Video uploaded successfully!");

      // Reset form
      setSelectedVideo(null);
      setSelectedThumbnail(null);
      setVideoPreview(null);
      setThumbnailPreview(null);
      setVideoTitle("");
      setVideoDescription("");

      // Call the callback with the updated campaign
      if (onVideoAdded && response.data.campaign) {
        onVideoAdded(response.data.campaign);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to upload video. Please try again."
      );
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium text-gray-800 mb-3">Upload New Video</h3>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video Title (Optional)
          </label>
          <input
            type="text"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="Enter a title for your video"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={videoDescription}
            onChange={(e) => setVideoDescription(e.target.value)}
            placeholder="Add a description for your video"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-300"
            rows="2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Video selection */}
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Video File*
            </span>

            {videoPreview ? (
              <div className="relative aspect-video bg-black rounded overflow-hidden">
                <video
                  src={videoPreview}
                  className="w-full h-full object-contain"
                  controls
                />
                <button
                  onClick={() => {
                    setVideoPreview(null);
                    setSelectedVideo(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  type="button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
              >
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
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-500">
                  Click to select video (MP4, MOV, etc.)
                </p>
                <p className="text-xs text-gray-400 mt-1">Max size: 200MB</p>
              </div>
            )}

            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoChange}
              accept="video/*"
              className="hidden"
            />
          </div>

          {/* Thumbnail selection */}
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-700">
              Thumbnail (Optional)
            </span>

            {thumbnailPreview ? (
              <div className="relative aspect-video bg-gray-100 rounded overflow-hidden">
                <img
                  src={thumbnailPreview}
                  className="w-full h-full object-cover"
                  alt="Video thumbnail preview"
                />
                <button
                  onClick={() => {
                    setThumbnailPreview(null);
                    setSelectedThumbnail(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  type="button"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => thumbnailInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
              >
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-1 text-sm text-gray-500">
                  Click to select thumbnail (JPG, PNG)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 16:9 ratio
                </p>
              </div>
            )}

            <input
              type="file"
              ref={thumbnailInputRef}
              onChange={handleThumbnailChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedVideo || uploadingVideo}
            className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
              !selectedVideo || uploadingVideo
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {uploadingVideo ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
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
                Upload Video
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
CampaignVideoUploader.propTypes = {
    campaign: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
    onVideoAdded: PropTypes.func,
    backendUrl: PropTypes.string.isRequired,
    authToken: PropTypes.string.isRequired,
  };

  CampaignVideoUploader.defaultProps = {
    onVideoAdded: () => {},
  };
export default CampaignVideoUploader;
