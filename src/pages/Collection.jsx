import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext.js";
import ProductItem from "../components/ProductItem";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFilter,
  FaSort,
  FaLeaf,
  FaCarrot,
  FaSeedling,
  FaShoppingBasket,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "../styles/custom.css";
import { toast } from "react-hot-toast"; // You may need to install this package
import React from "react"; // Added import for React.Fragment

const Collection = () => {
  const { products } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState("grid"); // 'grid' or 'list'
  const [priceRange, setPriceRange] = useState(500); // Added price range state
  const [searchQuery, setSearchQuery] = useState(""); // Added search functionality
  const [groupedProducts, setGroupedProducts] = useState({});
  const sectionRef = React.useRef(null);

  const sortOptions = [
    { value: "relevant", label: "Most Relevant" },
    { value: "low-high", label: "Price: Low to High" },
    { value: "high-low", label: "Price: High to Low" },
    { value: "name-asc", label: "Name: A to Z" },
    { value: "name-desc", label: "Name: Z to A" },
    { value: "in-stock", label: "In Stock First" },
  ];

  const categoryIcons = {
    Fruits: <FaLeaf className="text-green-500" />,
    Vegetables: <FaCarrot className="text-orange-500" />,
    Grains: <FaSeedling className="text-yellow-700" />,
    Dairy: <span className="text-blue-500">🥛</span>,
    Poultry: <span className="text-amber-700">🍗</span>,
    Other: <FaShoppingBasket className="text-gray-500" />,
  };

  // Function to check if a product is in stock
  const isInStock = (product) => {
    return product && typeof product.stock === "number" && product.stock > 0;
  };

  // Update product display based on filters and sort type
  const updateProductDisplay = (productsList = []) => {
    setIsLoading(true);

    // Ensure productsList is an array
    if (!Array.isArray(productsList) || productsList.length === 0) {
      setFilterProducts([]);
      setGroupedProducts({});
      setIsLoading(false);
      return;
    }

    let productsCopy = [...productsList];

    // Filter by categories
    if (categories.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        categories.includes(item.category)
      );
    }

    // Filter by price range
    productsCopy = productsCopy.filter((item) => item.price <= priceRange);

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      productsCopy = productsCopy.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.seller && item.seller.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query))
      );
    }

    // Sort products
    switch (sortType) {
      case "low-high":
        productsCopy.sort((a, b) => a.price - b.price);
        break;
      case "high-low":
        productsCopy.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        productsCopy.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        productsCopy.sort((a, b) => b.name.localeCompare(a.name));
        break;
      // Add stock-based sorting
      case "in-stock":
        productsCopy.sort((a, b) => {
          if (isInStock(b) === isInStock(a)) {
            return (b.stock || 0) - (a.stock || 0);
          }
          return isInStock(b) ? 1 : -1;
        });
        break;
      default:
        break;
    }

    // Group products by category for carousel display
    const grouped = {};
    productsCopy.forEach((product) => {
      if (!product.category) return;
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });

    setFilterProducts(productsCopy);
    setGroupedProducts(grouped);
    setIsLoading(false);
  };

  // Toggle category filter selection
  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategories((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  

  // Handle search input
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Fetch and update products on component mount
  useEffect(() => {
    if (products && products.length > 0) {
      updateProductDisplay(products);
    } else {
      setIsLoading(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  // Update products when filters, sort type, or search query changes
  useEffect(() => {
    if (products && products.length > 0) {
      updateProductDisplay(products);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, sortType, priceRange, searchQuery, products]);

  // Render a carousel for a given product list and section name
  // Simple horizontal scrolling container instead of Slick carousel
  const renderProductSection = (productsList, sectionName, description) => {
    if (
      !productsList ||
      !Array.isArray(productsList) ||
      productsList.length === 0
    ) {
      return null;
    }

    // Create a unique ref for each carousel section

    const sectionStyles = {
      "New Arrivals": {
        bg: "bg-gradient-to-r from-green-50 to-blue-50",
        title: "text-green-700",
        icon: "🌱",
      },
      "Budget-Friendly": {
        bg: "bg-gradient-to-r from-yellow-50 to-orange-50",
        title: "text-yellow-700",
        icon: "💰",
      },
      "Popular Choices": {
        bg: "bg-gradient-to-r from-purple-50 to-pink-50",
        title: "text-purple-700",
        icon: "⭐",
      },
    };

    const style = sectionStyles[sectionName] || {
      bg: "bg-gray-100",
      title: "text-gray-700",
      icon: categoryIcons[sectionName] || "📦",
    };

    // Calculate number of products to scroll per click - show approximately 5 at a time
    const scrollByProducts = 5;

    const scrollLeft = () => {
      if (sectionRef.current) {
        // Calculate product width + gap (typically ~200px per product including margin)
        const scrollAmount =
          sectionRef.current.querySelector(".product-item")?.offsetWidth *
          scrollByProducts;
        sectionRef.current.scrollBy({
          left: -scrollAmount || -1000,
          behavior: "smooth",
        });
      }
    };

    const scrollRight = () => {
      if (sectionRef.current) {
        // Calculate product width + gap
        const scrollAmount =
          sectionRef.current.querySelector(".product-item")?.offsetWidth *
          scrollByProducts;
        sectionRef.current.scrollBy({
          left: scrollAmount || 1000,
          behavior: "smooth",
        });
      }
    };

    return (
      <div
        className={`mb-8 ${style.bg} p-5 rounded-xl shadow-sm relative carousel-section`}
        key={`section-${sectionName.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <motion.h2
              whileHover={{ scale: 1.02 }}
              className={`text-xl font-bold ${style.title} flex items-center`}
            >
              <span className="mr-2">{style.icon}</span>
              {sectionName}
            </motion.h2>
            {description && (
              <p className="text-gray-600 mt-1 text-sm">{description}</p>
            )}
          </div>
          <button className="text-sm text-blue-600 hover:underline">
            View All
          </button>
        </div>

        {/* Navigation Buttons - positioned with enough margin to avoid content */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full border border-gray-100 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-100 transition-colors z-10"
          aria-label="Scroll left"
        >
          <FaChevronLeft className="text-gray-700" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white shadow-md rounded-full border border-gray-100 w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-green-50 hover:border-green-100 transition-colors z-10"
          aria-label="Scroll right"
        >
          <FaChevronRight className="text-gray-700" />
        </button>

        {/* Scrollable Product Container - with padding to show items behind navigation buttons */}
        <div
          ref={sectionRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent carousel-container px-8"
        >
          <div className="flex space-x-3 min-w-max">
            {productsList.map((product) => {
              if (!product || !product._id) {
                return null;
              }

              return (
                <div
                  key={product._id}
                  className="product-item w-48 sm:w-56 md:w-[190px] lg:w-[200px] flex-shrink-0"
                >
                  <motion.div
                    whileHover={{ scale: 1.03, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full"
                  >
                    <ProductItem
                      id={product._id}
                      name={product.name}
                      price={product.price}
                      image={
                        Array.isArray(product.images) &&
                        product.images.length > 0
                          ? product.images[0]
                          : product.images ||
                            "https://placehold.co/300x200?text=No+Image"
                      }
                      stock={product.stock}
                      seller={product.seller}
                      category={product.category}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional: Page indicators for longer lists */}
        {productsList.length > 5 && (
          <div className="flex justify-center mt-4">
            <div className="flex space-x-1">
              {Array.from({ length: Math.ceil(productsList.length / 5) }).map(
                (_, i) => (
                  <button
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-300 hover:bg-green-500 transition-colors"
                    onClick={() => {
                      if (sectionRef.current) {
                        const productWidth =
                          sectionRef.current.querySelector(".product-item")
                            ?.offsetWidth || 200;
                        const gap = 12; // Approximate space between items
                        sectionRef.current.scrollTo({
                          left: i * (productWidth + gap) * 5,
                          behavior: "smooth",
                        });
                      }
                    }}
                    aria-label={`Page ${i + 1}`}
                  ></button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading skeleton for placeholder
  const LoadingSkeleton = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8 bg-white p-5 rounded-xl">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="h-44 bg-gray-200 animate-pulse"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 bg-white p-5 rounded-xl">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="h-44 bg-gray-200 animate-pulse"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // Filter badge component

  // Calculate price range max value
  const maxPrice =
    products && products.length > 0
      ? Math.ceil(Math.max(...products.map((p) => p.price || 0)))
      : 500;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="w-full bg-gradient-to-r from-green-600 to-green-400 text-white py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-screen-xl text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 mx-auto">
            Fresh from the Farm
          </h1>
          <p className="text-green-100 max-w-xl mx-auto">
            Browse our collection of fresh, locally-sourced agricultural
            products straight from farmers to your table.
          </p>

          {/* Search Bar */}
          <div className="mt-6 max-w-xl relative mx-auto">
            <input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full py-2 px-4 pr-10 rounded-full border-0 focus:ring-2 focus:ring-green-300 text-gray-700"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")}>
                  <FaTimes />
                </button>
              ) : (
                <FaSearch />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-screen-xl">
        <div className="flex flex-col gap-6 transition-all duration-300">
          {/* Sticky Header with Controls */}
          <div className="sticky top-16 bg-white z-10 p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center">
                <h2 className="text-xl font-bold text-gray-800">Products</h2>
                {filterProducts.length > 0 && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {filterProducts.length} items
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <div className="relative">
                  <select
                    onChange={(e) => setSortType(e.target.value)}
                    value={sortType}
                    className="appearance-none pl-8 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white w-full"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FaSort className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilter(!showFilter)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50"
                >
                  <FaFilter
                    className={showFilter ? "text-green-600" : "text-gray-500"}
                  />
                  Filter
                </motion.button>

                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button
                    onClick={() => setActiveView("grid")}
                    className={`px-3 py-2 ${
                      activeView === "grid" ? "bg-gray-200" : "bg-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                    </svg>
                  </button>
                  <button
                    onClick={() => setActiveView("list")}
                    className={`px-3 py-2 ${
                      activeView === "list" ? "bg-gray-200" : "bg-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
                      {(categories.length > 0 ||
              searchQuery ||
              priceRange < maxPrice) && ( // Remove showInStock from this condition
              <div className="mt-3 pt-3 border-t">
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  <AnimatePresence mode="popLayout">
                    {/* ... other filter badges ... */}
                    {/* Remove this block */}
                    {/* {showInStock && (
                      <FilterBadge
                        text="In Stock Only"
                        onRemove={() => setShowInStock(false)}
                      />
                    )} */}
                  </AnimatePresence>
                  <button
                    onClick={() => {
                      setIsLoading(true);
                      setCategories([]);
                      setSearchQuery("");
                      setPriceRange(maxPrice);
                      // Remove this line
                      // setShowInStock(false);
                      setTimeout(() => setIsLoading(false), 100);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Categories Filter Panel */}
            <AnimatePresence>
              {showFilter && (
                <>
                  {/* Mobile overlay */}
                  <motion.div
                    className="filter-overlay md:hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFilter(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="filter-panel"
                  >
                    {/* Close button - visible on mobile only */}
                    <button
                      onClick={() => setShowFilter(false)}
                      className="md:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      aria-label="Close filter panel"
                    >
                      <FaTimes />
                    </button>

                    <h3 className="font-medium text-gray-800 mb-4 pb-2 border-b flex items-center">
                      <FaFilter className="mr-2 text-green-600" />
                      Filter Products
                    </h3>

                    <div className="filter-section mb-6">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Categories
                      </h4>
                      <div className="flex flex-col gap-2.5 text-sm">
                        {[
                          "Fruits",
                          "Vegetables",
                          "Grains",
                          "Dairy",
                          "Poultry",
                          "Other",
                        ].map((category) => (
                          <label
                            key={category}
                            className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                          >
                            <input
                              type="checkbox"
                              value={category}
                              onChange={toggleCategory}
                              checked={categories.includes(category)}
                              className="w-4 h-4 accent-green-600"
                            />
                            <span className="flex items-center gap-2">
                              {categoryIcons[category]}
                              {category}
                            </span>
                            <span className="ml-auto text-xs text-gray-400">
                              {products
                                ? products.filter(
                                    (p) => p && p.category === category
                                  ).length
                                : 0}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Price range slider with improved styling */}
                    <div className="filter-section mb-6">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Price Range
                      </h4>
                      <div className="flex flex-col gap-2">
                        <input
                          type="range"
                          min="0"
                          max={maxPrice}
                          value={priceRange}
                          onChange={(e) =>
                            setPriceRange(Number(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-600">
                          <span>₱0</span>
                          <span className="font-medium text-green-700">
                            ₱{priceRange}
                          </span>
                          <span>₱{maxPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability filter */}
                    <div className="filter-section">
                      <h4 className="font-medium text-gray-700 mb-3">
                        Availability
                      </h4>

                    </div>

                    {/* Apply filters button - useful on mobile */}
                    <div className="mt-8 pt-4 border-t flex justify-end">
                      <button
                        onClick={() => setShowFilter(false)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Product Display */}
            <div className="flex-1">
              {isLoading ? (
                <LoadingSkeleton />
              ) : filterProducts.length === 0 ? (
                <div className="bg-white p-8 rounded-xl shadow-sm text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-medium text-gray-700">
                    No products found
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Try adjusting your filters or browse all products
                  </p>
                  <button
                    onClick={() => {
                      setCategories([]);
                      setSearchQuery("");
                      setPriceRange(maxPrice);
                    }}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Featured products carousel */}
                  {categories.length === 0 &&
                    !searchQuery &&
                    (filterProducts.filter((_, i) => i < 15),
                    "New Arrivals",
                    "Fresh products just added to our marketplace")}

                  {/* Budget-friendly products */}
                  {categories.length === 0 &&
                    !searchQuery &&
                    renderProductSection(
                      filterProducts.filter((p) => p.price <= 20).slice(0, 15),
                      "Budget-Friendly",
                      "Great products at wallet-friendly prices"
                    )}

                  {/* Show products grouped by category */}
                  {categories.length > 0 || searchQuery ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                      <h2 className="text-xl font-bold text-gray-800 mb-6">
                        Filtered Results
                      </h2>

                      {activeView === "grid" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {filterProducts.map((item) => (
                            <motion.div
                              key={item._id}
                              whileHover={{ y: -5, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <ProductItem
                                id={item._id}
                                name={item.name}
                                price={item.price}
                                image={
                                  Array.isArray(item.images) &&
                                  item.images.length > 0
                                    ? item.images[0]
                                    : item.images ||
                                      "https://placehold.co/300x200?text=No+Image"
                                }
                                stock={item.stock}
                                seller={item.seller}
                                category={item.category}
                              />
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {filterProducts.map((item) => (
                            <motion.div
                              key={item._id}
                              whileHover={{ y: -2 }}
                              className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md border-gray-200"
                            >
                              <div className="w-32 h-32 sm:w-48 sm:h-48 flex-shrink-0 relative">
                                <img
                                  src={
                                    Array.isArray(item.images) &&
                                    item.images.length > 0
                                      ? item.images[0]
                                      : item.images ||
                                        "https://placehold.co/300x200?text=No+Image"
                                  }
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                                {typeof item.stock !== "number" ||
                                  (item.stock <= 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                      <span className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                                        OUT OF STOCK
                                      </span>
                                    </div>
                                  ))}
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-between">
                                <div>
                                  <h3 className="font-medium text-lg">
                                    {item.name}
                                  </h3>
                                  <p className="text-gray-500 text-sm">
                                    By {item.seller}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {item.category && (
                                      <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-800">
                                        {item.category}
                                      </span>
                                    )}
                                    <span
                                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                        typeof item.stock !== "number" ||
                                        item.stock <= 0
                                          ? "text-red-500"
                                          : item.stock < 5
                                          ? "text-amber-500"
                                          : "text-green-600"
                                      } bg-gray-100`}
                                    >
                                      {typeof item.stock !== "number" ||
                                      item.stock <= 0
                                        ? "Out of Stock"
                                        : item.stock < 5
                                        ? `Only ${item.stock} left`
                                        : "In Stock"}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-between items-center">
                                  <p className="font-bold text-xl">
                                    ₱{item.price.toFixed(2)}
                                  </p>
                                  <button
                                    className={`${
                                      typeof item.stock === "number" &&
                                      item.stock > 0
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-400 cursor-not-allowed"
                                    } text-white px-4 py-2 rounded-md transition-colors`}
                                    onClick={() => {
                                      if (
                                        typeof item.stock !== "number" ||
                                        item.stock <= 0
                                      ) {
                                        toast.error(
                                          "This item is currently out of stock"
                                        );
                                        return;
                                      }
                                      // Add to cart functionality
                                      toast.success(
                                        `${item.name} added to cart!`
                                      );
                                    }}
                                    disabled={
                                      typeof item.stock !== "number" ||
                                      item.stock <= 0
                                    }
                                  >
                                    {typeof item.stock === "number" &&
                                    item.stock > 0
                                      ? "Add to Cart"
                                      : "Out of Stock"}
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Render by category carousels when no filters applied
                    Object.entries(groupedProducts).map(
                      ([category, products]) => (
                        <React.Fragment key={`category-${category}`}>
                          {renderProductSection(products, category, null)}
                        </React.Fragment>
                      )
                    )
                  )}

                  {/* Popular choices */}
                  {categories.length === 0 &&
                    !searchQuery &&
                    renderProductSection(
                      filterProducts.filter((_, i) => i % 3 === 0).slice(0, 15),
                      "Popular Choices",
                      "Customer favorites you might like"
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Collection;
