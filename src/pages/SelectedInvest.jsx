/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef, useContext } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useInvestor } from "../context/InvestorContext";
import { ShopContext } from "../context/ShopContext";
import RecentInvestorsDisplay from "../components/RecentInvestorsDisplay";
import axios from "axios";
import { toast } from "react-toastify";
// Import the new components
import InvestorListModal from "../components/InvestorListModal";
import InvestmentCheckoutModal from "../components/InvestmentCheckoutModal";
// Import the new SellerDocumentsModal component
import SellerDocumentsModal from "../components/SellerDocumentsModal";
import SellerInfoCard from "../components/SellerInfoCard";

const SelectedInvest = () => {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState(null); // Tracks which question we're replying to
  const [replyText, setReplyText] = useState(""); // Stores the reply text input
  const [isSubmittingReply, setIsSubmittingReply] = useState(false); // Tracks reply submission state

  const { selectedInvestment, selectInvestment } = useInvestor();
  const { backendUrl } = useContext(ShopContext);
  const [campaigns, setCampaigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState({});
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const videoRefs = useRef([]);
  // New state variables
  const [showInvestorListModal, setShowInvestorListModal] = useState(false);
  const [showInvestmentCheckout, setShowInvestmentCheckout] = useState(false);
  // Add new state for seller documents modal
  const [showSellerDocumentsModal, setShowSellerDocumentsModal] =
    useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default videos to muted state
  const [isPaused, setIsPaused] = useState(false);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const sellerInfoRefs = useRef({}); // Create refs object indexed by campaign ID
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsInitializing(true);

        // Get auth token
        const token = localStorage.getItem("token");
        const config = token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {};

        let initialCampaigns = [];

        if (selectedInvestment?._id) {
          try {
            // Get auth token
            const token = localStorage.getItem("token");
            const config = token
              ? {
                  headers: { Authorization: `Bearer ${token}` },
                }
              : {};
        
            // Use the correct URL path with id/ prefix as defined in backend route
            const selectedResponse = await axios.get(
              `${backendUrl}/api/campaign/id/${selectedInvestment._id}`,
              config // Make sure to pass the auth token
            );
        
            if (
              selectedResponse.data.success &&
              selectedResponse.data.campaign
            ) {
              initialCampaigns.push(selectedResponse.data.campaign);
            } else {
              toast.warning("Could not retrieve the selected campaign details");
            }
          } catch (error) {
            console.error("Error fetching selected campaign:", error);
            // Update this to match the actual URL being used:
            console.error("Request URL:", `${backendUrl}/api/campaign/id/${selectedInvestment._id}`);
            console.error("Status:", error.response?.status);
            console.error("Error message:", error.response?.data?.message || error.message);
        
            // If it's a 401 Unauthorized error, show a specific message
            if (error.response?.status === 401) {
              toast.error("You need to be logged in to view campaign details");
            }
          }
        }

        // Fetch all campaigns
        const response = await axios.get(
          `${backendUrl}/api/campaign/all`,
          config
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch campaigns");
        }

        // Process and normalize campaign data
        const processedCampaigns = response.data.campaigns.map((campaign) => ({
          ...campaign,
          videoUrl: campaign.videoUrl || campaign.videos?.[0]?.url || null,
          thumbnail:
            campaign.thumbnail ||
            `https://source.unsplash.com/random/1080x1920/?agriculture,${campaign.category}`,
          currentFunding: Number(campaign.currentFunding || 0),
          fundingGoal: Number(campaign.fundingGoal || 0),
          expectedReturn: Number(campaign.expectedReturn || 0),
          duration: Number(campaign.duration || 12),
          raisedAmount: Number(campaign.raisedAmount || 0),
          targetAmount: Number(campaign.targetAmount || 0),
        }));

        // Filter campaigns with videos
        const campaignsWithVideos = processedCampaigns.filter(
          (campaign) =>
            campaign.videoUrl || (campaign.videos && campaign.videos.length > 0)
        );

        // Remove duplicates and selected investment
        const filteredCampaigns = selectedInvestment
          ? campaignsWithVideos.filter((c) => c._id !== selectedInvestment._id)
          : campaignsWithVideos;

        // Set final campaign list
        setCampaigns([...initialCampaigns, ...filteredCampaigns]);

        console.log(
          "Campaigns loaded successfully:",
          [...initialCampaigns, ...filteredCampaigns].length
        );
      } catch (error) {
        console.error("Error in fetchCampaigns:", error);
        toast.error(
          error.response?.data?.message || "Failed to load campaigns"
        );
      } finally {
        setIsInitializing(false);
      }
    };

    fetchCampaigns();
  }, [backendUrl, selectedInvestment]);

  useEffect(() => {
    if (!campaigns.length) return;

    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.8,
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const videoElement = entry.target;
          videoElement
            .play()
            .catch((err) => console.log("AutoPlay prevented:", err));

          // Find the index of this video
          const index = videoRefs.current.findIndex(
            (ref) => ref && ref === videoElement
          );
          if (index !== -1) {
            setCurrentIndex(index);
          }
        } else {
          entry.target.pause();
        }
      });
    };

    const observer = new IntersectionObserver(
      handleIntersection,
      observerOptions
    );
    videoRefs.current.forEach((videoRef) => {
      if (videoRef) observer.observe(videoRef);
    });

    return () => {
      videoRefs.current.forEach((videoRef) => {
        if (videoRef) observer.unobserve(videoRef);
      });
    };
  }, [campaigns, videoRefs]);

  // Initialize refs when campaigns change
  useEffect(() => {
    videoRefs.current = videoRefs.current.slice(0, campaigns.length);
  }, [campaigns]);

  // Add new effect to fetch comments when current index changes
  useEffect(() => {
    const fetchComments = async () => {
      if (currentIndex >= 0 && campaigns[currentIndex]) {
        try {
          setIsCommentLoading(true);
          const campaignId = campaigns[currentIndex]._id;

          console.log("Fetching comments for campaign:", campaignId);

          // Correct URL - matches your backend route
          const response = await axios.get(
            `${backendUrl}/api/campaign-questions/public/questions/${campaignId}`
          );

          console.log("Comments API response:", response.data);

          if (response.data.success) {
            setComments((prev) => ({
              ...prev,
              [campaignId]: response.data.questions,
            }));
          }
        } catch (error) {
          console.error("Error fetching campaign questions:", error);
          console.error(
            "Error details:",
            error.response?.data || error.message
          );

          // Handle error gracefully - set empty array for this campaign
          if (campaigns[currentIndex]) {
            setComments((prev) => ({
              ...prev,
              [campaigns[currentIndex]._id]: [],
            }));
          }
        } finally {
          setIsCommentLoading(false);
        }
      }
    };

    fetchComments();
  }, [currentIndex, campaigns, backendUrl]);

  const toggleComments = () => {
    setShowComments(!showComments);
  };
  const handleAddReply = async (questionId) => {
    if (!replyText.trim()) return;

    try {
      setIsSubmittingReply(true);

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to reply to questions");
        return;
      }

      console.log("Posting reply to question:", questionId);

      // Call the reply API endpoint
      const response = await axios.post(
        `${backendUrl}/api/campaign-questions/questions/reply`,
        {
          questionId,
          text: replyText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Reply API response:", response.data);

      if (response.data.success) {
        // Find which campaign this question belongs to
        let campaignId = null;
        for (const [cId, questions] of Object.entries(comments)) {
          if (questions.some((q) => q._id === questionId)) {
            campaignId = cId;
            break;
          }
        }

        if (campaignId) {
          // Update the comment in our local state with the new reply
          setComments((prev) => ({
            ...prev,
            [campaignId]: prev[campaignId].map((q) =>
              q._id === questionId
                ? {
                    ...q,
                    replies: [...(q.replies || []), response.data.reply],
                  }
                : q
            ),
          }));
        }

        // Reset form
        setReplyText("");
        setReplyingTo(null);
        toast.success("Reply posted successfully");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };
  const handleAddComment = async (campaignId) => {
    if (!comment.trim()) return;

    try {
      setIsSubmittingComment(true);

      // Check if user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to ask questions");
        return;
      }

      console.log("Posting comment for campaign:", campaignId);

      // Correct URL - matches your backend route
      const response = await axios.post(
        `${backendUrl}/api/campaign-questions/questions/add`,
        {
          campaignId,
          text: comment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Post comment response:", response.data);

      if (response.data.success) {
        // Update local state with the new question including user details
        setComments((prev) => ({
          ...prev,
          [campaignId]: [...(prev[campaignId] || []), response.data.question],
        }));
        setComment("");
        toast.success("Question posted successfully");
      }
    } catch (error) {
      console.error("Error posting question:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to post question");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleInvest = (campaign) => {
    selectInvestment(campaign);
    // Replace the old modal with the new checkout flow
    setShowInvestmentCheckout(true);
  };

  const handleViewDocument = (campaign) => {
    // Update to use the new SellerDocumentsModal for comprehensive document display
    selectInvestment(campaign);
    setShowSellerDocumentsModal(true);
  };

  // Handle video play/pause toggle
  const handleVideoToggle = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (video.paused) {
      video.play().catch((err) => console.log("Play prevented:", err));
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  // Handle mute/unmute toggle
  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    videoRefs.current.forEach((video) => {
      if (video) video.muted = newMutedState;
    });
    setIsMuted(newMutedState);
  };

  // Handle touch events for swipe navigation
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    touchEndY.current = e.changedTouches[0].clientY;
    handleSwipe();
  };

  const handleSwipe = () => {
    const distance = touchStartY.current - touchEndY.current;
    const threshold = 100; // Minimum swipe distance

    if (distance > threshold && currentIndex < campaigns.length - 1) {
      // Swipe up - go to next video
      const nextVideo = videoRefs.current[currentIndex + 1];
      if (nextVideo) {
        nextVideo.scrollIntoView({ behavior: "smooth" });
      }
    } else if (distance < -threshold && currentIndex > 0) {
      // Swipe down - go to previous video
      const prevVideo = videoRefs.current[currentIndex - 1];
      if (prevVideo) {
        prevVideo.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Function to open the seller info drawer
  const openSellerInfo = (campaign) => {
    if (sellerInfoRefs.current[campaign._id]) {
      sellerInfoRefs.current[campaign._id].openDrawer();
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
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
        <h2 className="text-2xl font-semibold text-gray-700">
          No Videos Available
        </h2>
        <p className="text-gray-500 mt-2 text-center">
          There are no investment campaign videos available at the moment.
        </p>
        <button
          onClick={() => navigate("/invest")}
          className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Browse Investments
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div
        className="h-screen snap-y snap-mandatory overflow-y-scroll"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {campaigns.map((campaign, index) => {
          // Get the main video or first video in the array
          const mainVideo =
            campaign.videoUrl ||
            (campaign.videos &&
              campaign.videos.length > 0 &&
              (campaign.videos[0].url || campaign.videos[0]));
          if (!mainVideo) return null;

          // Calculate campaign progress
          const targetAmount = campaign.targetAmount || 10000;
          const raisedAmount = campaign.raisedAmount || 0;
          const progressPercent = Math.min(
            Math.round((raisedAmount / targetAmount) * 100),
            100
          );

          return (
            <div
              key={`${campaign._id}-${index}`}
              className="h-screen w-full snap-start relative"
            >
              {/* Video element */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={mainVideo}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted={isMuted}
                playsInline
                poster={
                  campaign.thumbnail ||
                  `https://source.unsplash.com/random/1080x1920/?agriculture,${campaign.category}`
                }
              />

              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-70"></div>

              {/* Video controls */}
              <div className="absolute top-10 right-4 flex items-center space-x-4">
                <button
                  onClick={handleMuteToggle}
                  className="bg-black bg-opacity-50 rounded-full p-2 text-white"
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                        clipRule="evenodd"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => handleVideoToggle(index)}
                  className="bg-black bg-opacity-50 rounded-full p-2 text-white"
                  aria-label={isPaused ? "Play video" : "Pause video"}
                >
                  {isPaused ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Progress indicator for multiple videos */}
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="flex space-x-1 px-3 py-1 bg-black bg-opacity-50 rounded-full">
                  {campaigns.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === currentIndex ? "bg-white" : "bg-gray-500"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Campaign action buttons */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6">
                <button
                  onClick={() => handleInvest(campaign)}
                  className="text-white flex flex-col items-center"
                  aria-label="Invest in this campaign"
                >
                  <div className="bg-green-600 rounded-full p-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs mt-1 font-bold">Invest Now</span>
                </button>

                {/* View Seller Info Button - Opens the Seller Info Card */}
                <button
                  onClick={() => openSellerInfo(campaign)}
                  className="text-white flex flex-col items-center"
                  aria-label="View seller information"
                >
                  <div className="bg-blue-600 rounded-full p-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Seller Info</span>
                </button>

                <button
                  onClick={toggleComments}
                  className="text-white flex flex-col items-center"
                  aria-label="View questions about this campaign"
                >
                  <div className="bg-purple-600 rounded-full p-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">
                    Q&A ({comments[campaign._id]?.length || 0})
                  </span>
                </button>

                <button
                  onClick={() => handleViewDocument(campaign)}
                  className="text-white flex flex-col items-center"
                  aria-label="View campaign documents"
                >
                  <div className="bg-amber-600 rounded-full p-2">
                    <svg
                      className="w-6 h-6"
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
                  </div>
                  <span className="text-xs mt-1">Documents</span>
                </button>
              </div>

              {/* Campaign information */}
              <div className="absolute left-4 right-24 bottom-24 text-white">
                <h3 className="text-xl font-bold">{campaign.title}</h3>
                <p className="text-sm opacity-90 mt-1">{campaign.sellerName}</p>

                {/* Add Seller Info Card with ref */}
                <SellerInfoCard
                  campaign={campaign}
                  ref={(el) => (sellerInfoRefs.current[campaign._id] = el)}
                />

                {/* Investment metrics */}
                <div className="mt-3 bg-black bg-opacity-40 p-2 rounded-lg">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress:</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span>
                      Raised: ₱{campaign.currentFunding.toLocaleString()}
                    </span>
                    <span>Goal: ₱{campaign.fundingGoal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span>Returns: {campaign.expectedReturn}%</span>
                    <span>Duration: {campaign.duration} months</span>
                  </div>
                </div>

                {/* Recent Investors Display */}
                <div className="mt-3 bg-black bg-opacity-40 p-2 rounded-lg">
                  <h4 className="text-xs font-semibold mb-2">
                    Recent Investors:
                  </h4>
                  <RecentInvestorsDisplay campaignId={campaign._id} />
                </div>

                <div className="flex items-center mt-3 space-x-2">
                  <div className="bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
                    {campaign.category}
                  </div>
                  {campaign.verified && (
                    <div className="bg-green-600 bg-opacity-80 px-2 py-1 rounded text-xs flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>
              </div>

              {/* Swipe indicator */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center text-xs text-white opacity-70">
                <svg
                  className="w-5 h-5 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span className="ml-1">Swipe for more</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments section (slide-up panel) - renamed to Questions */}
      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-2xl transform ${
          showComments ? "translate-y-0" : "translate-y-full"
        } transition-transform duration-300 z-30 h-3/4`}
      >
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Questions about this Campaign</h3>
            <button onClick={toggleComments} className="text-gray-500">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
        </div>

        <div className="h-[calc(100%-120px)] overflow-y-auto p-4">
          {isCommentLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            currentIndex >= 0 &&
            campaigns[currentIndex] && (
              <>
                {comments[campaigns[currentIndex]._id]?.length ? (
                  comments[campaigns[currentIndex]._id].map((comment) => (
                    <div key={comment._id} className="mb-6 border-b pb-4">
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                          {comment.user?.avatar ? (
                            <img
                              src={comment.user.avatar}
                              alt={comment.user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-green-500 text-white font-bold text-lg">
                              {comment.user?.name?.charAt(0).toUpperCase() ||
                                "?"}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">
                              {comment.user?.name || "Anonymous"}
                              {comment.user?.isSeller && (
                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                  Seller
                                </span>
                              )}
                              {comment.user?.isInvestor && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                  Investor
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-gray-700 mt-1">{comment.text}</p>

                          {/* Show replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 ml-4 space-y-3">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply._id}
                                  className="flex items-start"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                                    {reply.user?.avatar ? (
                                      <img
                                        src={reply.user.avatar}
                                        alt={reply.user.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-sm">
                                        {reply.user?.name
                                          ?.charAt(0)
                                          .toUpperCase() || "?"}
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-2 flex-1">
                                    <div className="flex justify-between items-center">
                                      <p className="font-medium text-sm">
                                        {reply.user?.name || "Anonymous"}
                                        {reply.user?.isSeller && (
                                          <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                            Seller
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(
                                          reply.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="text-gray-700 text-sm mt-1">
                                      {reply.text}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add reply button */}
                          {replyingTo === comment._id ? (
                            <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <div className="mb-2 text-xs text-gray-500">
                                Replying to {comment.user?.name || "Anonymous"}
                              </div>
                              <div className="flex flex-col">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write your reply..."
                                  className="border rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  disabled={isSubmittingReply}
                                />
                                <div className="flex justify-end mt-2 space-x-2">
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    }}
                                    className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100"
                                    disabled={isSubmittingReply}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleAddReply(comment._id)}
                                    className={`text-xs px-3 py-1.5 rounded-md ${
                                      isSubmittingReply || !replyText.trim()
                                        ? "bg-green-300 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                    }`}
                                    disabled={
                                      isSubmittingReply || !replyText.trim()
                                    }
                                  >
                                    {isSubmittingReply ? (
                                      <div className="flex items-center">
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                        Posting...
                                      </div>
                                    ) : (
                                      "Post Reply"
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(comment._id)}
                              className="mt-2 text-sm text-blue-600 hover:underline flex items-center"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-gray-500 mt-2">
                      No questions yet. Ask about this campaign
                    </p>
                  </div>
                )}
              </>
            )
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex items-center">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ask a question about this campaign..."
              className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isSubmittingComment}
            />
            <button
              onClick={() =>
                currentIndex >= 0 &&
                campaigns[currentIndex] &&
                handleAddComment(campaigns[currentIndex]._id)
              }
              className={`${
                isSubmittingComment
                  ? "bg-green-400"
                  : "bg-green-600 hover:bg-green-700"
              } 
                text-white rounded-full p-2 transition-colors`}
              disabled={!comment.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Replace the old investment modal with the new checkout modal */}
      {selectedInvestment && (
        <InvestmentCheckoutModal
          campaign={selectedInvestment}
          isOpen={showInvestmentCheckout}
          onClose={() => setShowInvestmentCheckout(false)}
        />
      )}

      {/* New Investor List Modal */}
      {selectedInvestment && (
        <InvestorListModal
          campaignId={selectedInvestment._id}
          isOpen={showInvestorListModal}
          onClose={() => setShowInvestorListModal(false)}
        />
      )}

      {/* Replace the DocumentViewerModal with SellerDocumentsModal */}
      {selectedInvestment && (
        <SellerDocumentsModal
          campaign={selectedInvestment}
          isOpen={showSellerDocumentsModal}
          onClose={() => setShowSellerDocumentsModal(false)}
        />
      )}
    </div>
  );
};

// Since you're also using these components, make sure they also have PropTypes
// Add these imports to appropriate component files

// For InvestorListModal.jsx
export const InvestorListModalPropTypes = {
  campaignId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// For DocumentViewerModal.jsx
export const DocumentViewerModalPropTypes = {
  documentUrl: PropTypes.string,
  title: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// For InvestmentCheckoutModal.jsx
export const InvestmentCheckoutModalPropTypes = {
  campaign: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SelectedInvest;
