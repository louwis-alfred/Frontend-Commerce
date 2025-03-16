import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ShopContext } from "../context/ShopContext";

const CustomPrevArrow = ({ className, onClick }) => (
  <button
    className={`${className} !bg-white !w-10 !h-10 !rounded-full !shadow-md !flex !items-center !justify-center z-10 !text-gray-600 hover:!text-green-600 before:!text-xl before:!content-['←']`}
    onClick={onClick}
    type="button"
    aria-label="Previous"
  />
);

const CustomNextArrow = ({ className, onClick }) => (
  <button
    className={`${className} !bg-white !w-10 !h-10 !rounded-full !shadow-md !flex !items-center !justify-center z-10 !text-gray-600 hover:!text-green-600 before:!text-xl before:!content-['→']`}
    onClick={onClick}
    type="button"
    aria-label="Next"
  />
);

const AvailableForTrade = ({ onOpenTradeModal, reloadTrigger }) => {
  const { backendUrl } = useContext(ShopContext);
  const [productsForTrade, setProductsForTrade] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const authToken = localStorage.getItem("token");

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/seller/dashboard`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setError("Authentication failed");
      }
    };

    if (authToken) {
      fetchCurrentUser();
    } else {
      setError("No authentication token found");
    }
  }, [backendUrl, authToken]);

  // Fetch products available for trade
  useEffect(() => {
    const fetchProductsForTrade = async () => {
      try {
        if (!currentUser?._id) {
          return;
        }

        const response = await axios.get(
          `${backendUrl}/api/trades/products-for-trade`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.data.success) {
          const filteredProducts = (response.data.products || []).filter(
            (product) =>
              product.sellerId !== currentUser._id &&
              product.availableForTrade &&
              product.stock > 0
          );
          setProductsForTrade(filteredProducts);
        } else {
          throw new Error(response.data.message || "Failed to fetch products");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message || "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    if (authToken && currentUser?._id) {
      fetchProductsForTrade();
    }
  }, [backendUrl, authToken, currentUser, reloadTrigger]);

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    dotsClass: "slick-dots !bottom-[-15px]",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading products for trade...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-6">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Products</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Products Available for Trade</h2>
        </div>
        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
          {productsForTrade.length} Available
        </span>
      </div>
      
            {productsForTrade.length ? (
        <div className="relative px-2 pb-8">
          <Slider {...sliderSettings}>
            {productsForTrade.map((product) => (
              <div key={product._id} className="px-3 pb-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                  <div className="relative">
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        For Trade
                      </span>
                    </div>
                    <div className="h-56 overflow-hidden">
                      <img
                        src={
                          Array.isArray(product.images)
                            ? product.images[0]
                            : product.images
                        }
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform hover:scale-110 duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300?text=No+Image";
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {product.description || "No description available"}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <span className="text-xl font-bold text-green-600">
                          ₱{parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </span>
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          or trade
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-600">Top Pick</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 mb-4 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm text-gray-600 truncate">
                          {product.seller?.name || "Unknown Seller"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-gray-600 truncate">
                          {product.seller?.location || "Location not specified"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          Stock: <span className="font-medium text-green-600">{product.stock} available</span>
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenTradeModal(product);
                      }}
                      className="mt-auto w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Initiate Trade
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-700">No products available for trade yet</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            When other sellers make their products available for trade, they will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

CustomPrevArrow.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

CustomNextArrow.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
};

AvailableForTrade.propTypes = {
  onOpenTradeModal: PropTypes.func.isRequired,
  reloadTrigger: PropTypes.number,
};

export default AvailableForTrade;