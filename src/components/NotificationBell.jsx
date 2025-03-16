import { useContext, useState, useRef, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import { NotificationContext } from "../context/NotificationContext";
import { Link, useNavigate } from "react-router-dom";

const NotificationBell = ({ token, userId }) => {
  const { notifications, unreadCount, markAsRead, fetchNotifications, isLoading } =
    useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const lastFetchRef = useRef(0); // Track last fetch time
  const navigate = useNavigate(); // Add navigate hook
  
  // Debounced fetch function to prevent multiple rapid fetches
  const debouncedFetch = useCallback(() => {
    const now = Date.now();
    if (now - lastFetchRef.current > 5000) { // Only fetch if 5 seconds have passed
      lastFetchRef.current = now;
      console.log("NotificationBell: Refreshing notifications with token and userId");
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // Refresh notifications when component mounts or token/userId changes
  useEffect(() => {
    if (token && userId) {
      debouncedFetch();
    }
  }, [token, userId, debouncedFetch]); // Note: debouncedFetch is stable now with useCallback

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleNotificationClick = (notification, e) => {
    // Prevent default link behavior
    e.preventDefault();
    
    // Mark as read
    markAsRead(notification._id);
    
    // Close dropdown
    setIsOpen(false);
    
    // Handle different notification types
    if (notification.type === "ORDER_STATUS" || notification.type === "NEW_ORDER") {
      // Navigate to orders page for all order-related notifications
      navigate("/orders");
    } else if (notification.data?.actionUrl) {
      // Use the action URL for other notification types
      navigate(notification.data.actionUrl);
    }
  };

  const formatNotificationTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
    if (diffHour < 24)
      return `${diffHour} hour${diffHour !== 1 ? "s" : ""} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "ORDER_STATUS":
      case "NEW_ORDER":
        return (
          <div className="bg-blue-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        );
      case "INVESTMENT_UPDATE":
        return (
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-green-500"
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
        );
      case "NEW_QUESTION":
      case "NEW_REPLY":
        return (
          <div className="bg-purple-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={() => {
          setIsOpen(!isOpen);
          // Refresh notifications when opening the dropdown
          if (!isOpen) {
            fetchNotifications();
          }
        }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center">
                {notifications.length > 0 && (
                  <>
                    <button
                      className="text-sm text-blue-600 hover:underline mr-3"
                      onClick={() => {
                        fetchNotifications();
                      }}
                    >
                      Refresh
                    </button>
                    <button
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => setIsOpen(false)}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <p className="mt-2 text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const actionUrl = notification.data?.actionUrl || "#";
                  const actorAvatar = notification.data?.actorAvatar;
                  const actorName = notification.data?.actorName;

                  return (
                    <Link
                      to={actionUrl}
                      key={notification._id}
                      className={`flex items-start p-3 rounded-lg ${
                        notification.read
                          ? "bg-gray-50 hover:bg-gray-100"
                          : "bg-blue-50 hover:bg-blue-100"
                      } transition duration-150`}
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      {/* Icon or Avatar */}
                      {actorAvatar ? (
                        <img
                          src={actorAvatar}
                          alt={actorName || "User"}
                          className="w-10 h-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className="mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-2"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

NotificationBell.propTypes = {
  token: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default NotificationBell;