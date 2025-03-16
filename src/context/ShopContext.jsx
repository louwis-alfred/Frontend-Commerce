import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext.js";

const ShopContextProvider = (props) => {
  const currency = "₱";
  const delivery_fee = 40;
  const backendUrl = "http://localhost:4000";
  
  // States
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    freshness: "",
    minPrice: "",
    maxPrice: "",
    sort: "-createdAt",
  });

  const navigate = useNavigate();

  // Product Constants
  const productCategories = ["Vegetables", "Fruits", "Grains", "Root Crops", "Herbs", "Others"];
  const freshnessOptions = ["Fresh", "Day-old", "Stored", "Processed"];
  const unitOptions = ["kg", "g", "pc", "bundle", "pack", "lbs", "oz"];

  const addToCart = async (itemId) => {
    // Check stock availability
    const product = products.find((p) => p._id === itemId);
    if (!product || product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    // Check if adding more would exceed stock
    if (cartItems[itemId] && cartItems[itemId].quantity >= product.stock) {
      toast.warning("Cannot add more than available stock");
      return;
    }

    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId].quantity += 1;
    } else {
      cartData[itemId] = { quantity: 1 };
    }
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          `${backendUrl}/api/cart/add`,
          { itemId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        if (!error.response) {
          toast.error("Network error. Please check your connection.");
        }
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      try {
        if (cartItems[items].quantity > 0) {
          totalCount += cartItems[items].quantity;
        }
      } catch (error) {
        console.log("Error: ", error);
      }
    }
    return totalCount;
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      try {
        if (itemInfo && cartItems[items].quantity > 0 && itemInfo.stock > 0) {
          totalAmount += itemInfo.price * cartItems[items].quantity;
        }
      } catch (error) {
        console.log(error);
      }
    }
    return totalAmount;
  };

  const updateQuantity = async (itemId, quantity) => {
    const product = products.find((p) => p._id === itemId);
    
    if (quantity > product.stock) {
      toast.warning("Cannot add more than available stock");
      return;
    }

    let cartData = structuredClone(cartItems);
    cartData[itemId].quantity = quantity;
    setCartItems(cartData);

    if (token) {
      try {
        await axios.put(
          `${backendUrl}/api/cart/update`,
          { itemId, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const response = await axios.get(`${backendUrl}/api/cart/get`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCartItems(response.data.cartData);
      } catch (error) {
        console.log("Error updating quantity:", error);
      }
    }
  };

  const getProductsData = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.freshness) params.append("freshness", filters.freshness);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.sort) params.append("sort", filters.sort);

      const response = await axios.get(`${backendUrl}/api/product/list?${params}`);
      
      if (response.data.success) {
        const filteredProducts = response.data.products.filter(
          (product) => product.stock > 0 && product.isActive
        );
        setProducts(filteredProducts || []);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch products");
    }
  };

  const getUserCart = async (token) => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${backendUrl}/api/cart/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log("User not authenticated for cart");
      } else {
        console.log("Error fetching cart:", error);
      }
    }
  };

  // Format product unit display
  const formatProductUnit = (price, unitOfMeasurement) => {
    return `${currency}${price}/${unitOfMeasurement}`;
  };

  useEffect(() => {
    getProductsData();
  }, [filters]);

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (localToken) {
      setToken(localToken);
    }
  }, []);

  useEffect(() => {
    if (token && token.length > 10) {
      getUserCart(token);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    getProductsData,
    filters,
    setFilters,
    formatProductUnit,
    productCategories,
    freshnessOptions,
    unitOptions
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

ShopContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ShopContextProvider;