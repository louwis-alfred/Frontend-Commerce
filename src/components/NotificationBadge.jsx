import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import PropTypes from 'prop-types';

const NotificationBadge = ({ type }) => {
  const [count, setCount] = useState(0);
  const { backendUrl } = useContext(ShopContext);
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (!token) return;
    
    const fetchNotificationCount = async () => {
      try {
        // Use the correct endpoint and path
        const response = await axios.get(
          `${backendUrl}/api/notification/unread-count`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (response.data.success) {
          // If type is provided, we need to filter client-side
          // since the backend doesn't currently support filtering by type
          if (type === 'NEW_ORDER') {
            // For order notifications, we'll use the total count for now
            // since we know this badge is specifically for new orders
            setCount(response.data.count || 0);
          } else {
            // For future enhancement: If your backend starts supporting
            // notification types, you can remove this client-side filtering
            setCount(response.data.count || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };
    
    fetchNotificationCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [backendUrl, token, type]);
  
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  );
};

NotificationBadge.propTypes = {
  type: PropTypes.string.isRequired
};

export default NotificationBadge;