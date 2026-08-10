import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

// Get base URL for backend API from env or use standard fallback
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';


const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const VisitorTracker = () => {
  const location = useLocation();

  useEffect(() => {
    let sessionId = localStorage.getItem('visitorSessionId');
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem('visitorSessionId', sessionId);
    }

    const enterTime = Date.now();

    const sendTrack = (duration = 0) => {
      const params = new URLSearchParams(location.search);
      const searchQuery = params.get('q') || params.get('query') || params.get('search');
      
      const payload = {
        sessionId,
        pageVisited: location.pathname + location.search,
        userAgent: navigator.userAgent,
        searchQuery: searchQuery || undefined,
        duration: Math.round(duration / 1000)
      };

      if (duration > 0) {
        // fetch with keepalive is the modern, CORS-friendly alternative to sendBeacon for JSON data
        fetch(`${API_URL}/analytics/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      } else {
        axios.post(`${API_URL}/analytics/visit`, payload).catch(() => {});
      }
    };

    // Track initial page view
    sendTrack(0);

    // When component unmounts or path changes, track the duration spent
    return () => {
      const duration = Date.now() - enterTime;
      sendTrack(duration);
    };
  }, [location.pathname, location.search]);

  return null; // This component doesn't render anything
};

export default VisitorTracker;
