import { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "./ShopContext";
import { toast } from "react-toastify";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      // Fixed endpoint - matches your notificationRoutes.js
      const response = await axios.get(`${backendUrl}/api/notification/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(
          (response.data.notifications || []).filter((n) => !n.read).length
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Only show error toast for non-auth errors (to avoid spamming user)
      if (error.response && error.response.status !== 401 && error.response.status !== 403) {
        toast.error("Failed to load notifications");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, backendUrl]);
  
  // Reduce polling frequency - this is very important!
  useEffect(() => {
    if (!token) {
      // Reset notifications when logged out
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
  
    // Initial fetch
    fetchNotifications();
    
    // Set up much less frequent polling
    const countInterval = setInterval(fetchUnreadCount, 60000); // Every 60 seconds (was 15)
    const fullInterval = setInterval(fetchNotifications, 180000); // Every 3 minutes (was 60 secs)
    
    return () => {
      clearInterval(countInterval);
      clearInterval(fullInterval);
    };
  }, [token, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token) return;
    
    try {
      // Fixed endpoint - uses PATCH instead of PUT to match your backend
      const response = await axios.patch(
        `${backendUrl}/api/notification/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update the read status locally
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Get the notification object
        const notification = notifications.find(
          (n) => n._id === notificationId
        );

        // Handle navigation if there's an action URL
        if (notification?.data?.actionUrl) {
          navigate(notification.data.actionUrl);
        }
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!token) return;
    
    try {
      // Fixed endpoint - uses PATCH instead of PUT to match your routes
      const response = await axios.patch(
        `${backendUrl}/api/notification/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch unread count separately (optimization)
  const fetchUnreadCount = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/notification/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      // Silent fail for count-only requests
      console.error("Error fetching unread count:", error);
    }
  };

  // Poll for new notifications when token changes
  useEffect(() => {
    if (!token) {
      // Reset notifications when logged out
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchNotifications();
    
    // Set up efficient polling - fetch full notifications less frequently,
    // but check unread count more frequently
    const countInterval = setInterval(fetchUnreadCount, 15000); // Every 15 seconds
    const fullInterval = setInterval(fetchNotifications, 60000); // Every minute
    
    return () => {
      clearInterval(countInterval);
      clearInterval(fullInterval);
    };
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};