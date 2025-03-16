import PropTypes from "prop-types";
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";

const SellerInfoCard = forwardRef(({ campaign }, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Expose the setIsExpanded function to parent components
  useImperativeHandle(ref, () => ({
    openDrawer: () => setIsExpanded(true),
  }));

  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isExpanded]);

  if (!campaign) return null;

  // Access seller application data
  const sellerInfo = campaign.sellerApplication || {};

  return (
    <>
      {/* Overlay - shown when drawer is open */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity"
          onClick={() => setIsExpanded(false)}
        ></div>
      )}

      {/* Side Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-md bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${
          isExpanded ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto`}
      >
        {/* Drawer Header with Close Button */}
        <div className="flex justify-between items-center p-5 border-b border-gray-700">
          <h4 className="font-semibold text-lg">Seller Information</h4>
          <button
            onClick={() => setIsExpanded(false)}
            className="rounded-full p-1 hover:bg-gray-700"
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-5">
          <div className="space-y-4">
            {/* Business Name */}
            {sellerInfo.businessName && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-gray-300">Business:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.businessName}
                </span>
              </p>
            )}

            {/* Company Type */}
            {sellerInfo.companyType && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-300">Company Type:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.companyType}
                </span>
              </p>
            )}

            {/* Province */}
            {sellerInfo.province && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                  />
                </svg>
                <span className="text-gray-300">Province:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.province}
                </span>
              </p>
            )}

            {/* City */}
            {sellerInfo.city && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="text-gray-300">City:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.city}
                </span>
              </p>
            )}

            {/* Farm Location */}
            {sellerInfo.farmLocation && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                <span className="text-gray-300">Farm Location:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.farmLocation}
                </span>
              </p>
            )}

            {/* Contact Number */}
            {sellerInfo.contactNumber && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-gray-300">Contact Number:</span>
                <span className="ml-2 font-medium text-white">
                  {sellerInfo.contactNumber}
                </span>
              </p>
            )}

            {/* Email */}
            {campaign.sellerEmail && (
              <p className="text-sm flex items-center bg-gray-800 p-3 rounded-lg">
                <svg
                  className="w-5 h-5 mr-3 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-300">Email:</span>
                <span className="ml-2 font-medium text-white">
                  {campaign.sellerEmail}
                </span>
              </p>
            )}

          </div>
        </div>
      </div>
    </>
  );
});

SellerInfoCard.displayName = "SellerInfoCard";

SellerInfoCard.propTypes = {
  campaign: PropTypes.shape({
    sellerId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object  // Add this to accept populated User object
    ]),
    sellerEmail: PropTypes.string,
    sellerApplication: PropTypes.shape({
      businessName: PropTypes.string,
      companyType: PropTypes.string,
      province: PropTypes.string,
      city: PropTypes.string,
      farmLocation: PropTypes.string,
      contactNumber: PropTypes.string,
    }),
  }),
};

export default SellerInfoCard;
