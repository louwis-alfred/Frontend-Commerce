import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const CampaignVideoPlayer = ({ videoUrl, poster }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('--:--');
  const [error, setError] = useState(false);
  const videoRef = useRef(null);

  // Try to optimize the Cloudinary URL if needed
  const getOptimizedUrl = (url) => {
    if (!url) return '';
    
    // Handle Cloudinary URLs for better video delivery
    if (url.includes('cloudinary.com') && !url.includes('q_auto')) {
      // Add quality and format parameters for better streaming
      return url.replace(/\/upload\//, '/upload/q_auto,f_auto/');
    }
    
    return url;
  };

  useEffect(() => {
    // Reset error state when URL changes
    setError(false);
  }, [videoUrl]);

  const handleLoadMetadata = () => {
    const video = videoRef.current;
    if (video && video.duration && !isNaN(video.duration)) {
      const minutes = Math.floor(video.duration / 60);
      const seconds = Math.floor(video.duration % 60).toString().padStart(2, '0');
      setDuration(`${minutes}:${seconds}`);
    }
  };

  const handleError = (e) => {
    console.error('Video playback error:', e);
    setError(true);
    
    // Try to load with a modified URL if there was an error
    const video = videoRef.current;
    if (video && videoUrl) {
      try {
        // Try another URL format
        if (videoUrl.endsWith('.mp4')) {
          video.src = videoUrl.replace(/\.mp4$/, '');
        } else {
          video.src = `${videoUrl}.mp4`;
        }
        video.load();
      } catch (retryError) {
        console.error('Failed to reload video with modified URL:', retryError);
      }
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Failed to play video:', err);
        setError(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-100">
      <video
        ref={videoRef}
        src={getOptimizedUrl(videoUrl)}
        poster={poster || `https://source.unsplash.com/random/640x360/?agriculture`}
        preload="metadata"
        className="w-full h-full object-cover"
        onLoadedMetadata={handleLoadMetadata}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-30"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-purple-600 rounded-full bg-opacity-80 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <button 
            onClick={togglePlay}
            className="text-white hover:text-purple-300 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          <div className="text-white text-xs">
            <span>{duration}</span>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-center p-4">
          <div>
            <svg className="w-12 h-12 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2">Video cannot be played</p>
            <a 
              href={videoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-2 inline-block px-4 py-2 bg-purple-600 rounded text-white text-sm hover:bg-purple-700"
            >
              Open in new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

CampaignVideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  poster: PropTypes.string,
};

export default CampaignVideoPlayer;