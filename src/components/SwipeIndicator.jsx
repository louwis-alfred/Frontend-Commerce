import { useEffect, useState } from "react";

const SwipeIndicator = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Handle click anywhere on the screen
  useEffect(() => {
    const handleClick = () => {
      setIsVisible(false); // Hide the indicator when the user clicks anywhere
    };

    // Add click event listener
    document.addEventListener("click", handleClick);

    // Cleanup: Remove the event listener when the component unmounts
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  // Hide the indicator after 5 seconds (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="w-64 bg-black bg-opacity-50 p-4 rounded-lg flex flex-col items-center justify-center">
        <div className="animate-bounce">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
        <p className="text-green-500 text-lg mt-2 text-center">
          Swipe right to see more
        </p>
      </div>
    </div>
  );
};

export default SwipeIndicator;