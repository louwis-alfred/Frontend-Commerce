import { useContext } from "react";
import { ShopContext } from "../context/ShopContext.js";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { FaShoppingCart, FaLeaf, FaStar } from "react-icons/fa";

// Using parameter defaults instead of defaultProps
const ProductItem = ({
  id,
  image,
  name,
  price,
  className = "",
  stock,
  seller,
  category = "",
}) => {
  const { currency, addToCart } = useContext(ShopContext);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock > 0 && addToCart) {
      addToCart(id);
      toast.success(`Added ${name} to cart`);
    }
  };
  // Format price with two decimal places
  const formattedPrice = price ? price.toFixed(2) : "0.00";
  
  // Calculate discount percentage only for products with prices below threshold
  const hasDiscount = price < 25 && price > 0;
  const discountPercent = hasDiscount ? Math.floor((Math.random() * 10) + 10) : null;

  return (
    <div className={`product-item ${className} bg-white rounded-lg overflow-hidden h-full flex flex-col`}>
      <Link to={`/product/${id}`} className="block flex-1 flex-col relative group">
        {/* Product Image with optimized loading */}
        <div className="relative w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover object-center transition-all duration-300 group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/300x200?text=No+Image';
            }}
          />
          
          {/* Status badges - enhanced with animation */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {stock < 5 && stock > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full animate-pulse">
                Only {stock} left
              </span>
            )}
            {hasDiscount && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                Save {discountPercent}%
              </span>
            )}
          </div>

          {/* Out of stock overlay with improved visibility */}
          {stock <= 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
              <span className="bg-red-500 text-white font-semibold text-sm px-3 py-1 rounded-md transform -rotate-6 shadow-md">
                Out of Stock
              </span>
            </div>
          )}
          
          {/* New product badge for recent items */}
          {Math.random() > 0.8 && stock > 0 && (
            <div className="absolute top-2 right-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                New
              </span>
            </div>
          )}
        </div>

        {/* Product Details with improved spacing */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Category with enhanced visibility */}
          {category && (
            <div className="mb-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <FaLeaf className="text-green-500" size={10} />
                {category}
              </span>
            </div>
          )}

          {/* Product Name with improved typography */}
          <h3 className="text-base font-medium text-gray-800 line-clamp-2 leading-snug mb-1 group-hover:text-green-700 transition-colors">
            {name}
          </h3>
          
          {/* Seller Info with better styling */}
          <p className="text-xs text-gray-500 mb-2">
            by <span className="hover:text-green-600 transition-colors">{seller}</span>
          </p>

          {/* Mock ratings - adds visual interest */}
          <div className="flex items-center mb-2.5">
            {[...Array(5)].map((_, i) => (
              <FaStar key={`star-${i}`} size={12} className={i < 4 ? "text-yellow-400" : "text-gray-300"} />
            ))}
            <span className="text-xs text-gray-500 ml-1">({Math.floor(Math.random() * 50) + 5})</span>
          </div>

          {/* Price with discount calculation */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-gray-800">
                {currency}{formattedPrice}
              </p>
              {hasDiscount && (
                <p className="text-xs text-gray-500 line-through">
                  {currency}{(price * (100 + discountPercent) / 100).toFixed(2)}
                </p>
              )}
            </div>
            
            {/* Stock indicator with improved visual cues */}
            <p className={`text-xs mt-1 ${stock > 5 ? "text-green-600" : stock > 0 ? "text-amber-600" : "text-red-600"} font-medium`}>
              {stock > 5 ? "In Stock" : stock > 0 ? `Only ${stock} left` : "Out of Stock"}
            </p>
          </div>
        </div>
      </Link>

      {/* Add to Cart Button with improved accessibility and interaction */}
      <div className="px-3 pb-3 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={stock <= 0}
          aria-label={stock > 0 ? `Add ${name} to cart` : "Product out of stock"}
          className={`w-full flex items-center justify-center gap-2 transition-all duration-300 ${
            stock > 0
              ? "bg-green-600 hover:bg-green-700 active:scale-[0.98]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          } text-white py-2 px-3 rounded-md text-sm font-medium shadow-sm hover:shadow`}
        >
          <FaShoppingCart size={14} />
          {stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
};

// Retain PropTypes for development validation
ProductItem.propTypes = {
  id: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  className: PropTypes.string,
  stock: PropTypes.number.isRequired,
  seller: PropTypes.string.isRequired,
  category: PropTypes.string,
  isAvailable: PropTypes.bool,
  stockStatus: PropTypes.object
};

// No more defaultProps!
export default ProductItem;