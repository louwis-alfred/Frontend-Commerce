import CartTotal from "../components/CartTotal";
import Title from "../components/Title";
import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import gcash from "../assets/frontend_assets/gcash.png";
import { showOrderNotification } from "../components/OrderNotification";
import { NotificationContext } from "../context/NotificationContext.jsx";

const PlaceOrder = () => {
  const [method, setMethod] = useState("COD");
  const {
    navigate,
    backendUrl,
    token,
    cartItems,
    setCartItems,
    getCartAmount,
    delivery_fee,
    products,
    getProductsData,
  } = useContext(ShopContext);
  const { fetchNotifications } = useContext(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (loading) return;
    setLoading(true);

    // Convert cartItems (object) to an array of order items.
    const orderItems = Object.keys(cartItems).map((itemId) => ({
      productId: itemId,
      quantity: cartItems[itemId].quantity,
    }));

    let orderData = {
      address: formData,
      items: orderItems,
      amount: getCartAmount() + delivery_fee,
      paymentMethod: method,
    };

    showOrderNotification("info", "Processing your order...");

    try {
      const response = await axios.post(
        backendUrl + "/api/order/place",
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Clear cart
        setCartItems({});

        // Refresh product data
        await getProductsData();

        // Show success notification
        showOrderNotification(
          "success",
          "Order placed successfully! You can track it in My Orders."
        );

        // Refresh notifications to show new order notification
        await fetchNotifications();

        // Navigate to orders page
        navigate("/orders");
      } else {
        showOrderNotification(
          "error",
          response.data.message || "Failed to place order"
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showOrderNotification(
        "error",
        error.message || "An error occurred while placing your order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t"
    >
      {/* Left Side - Delivery Information */}
      <div className="flex flex-col gap-4 w-full sm:max-w-[480px]">
        <div className="text-xl sm:text-2xl my-3">
          <Title text1={"DELIVER"} text2={"INFORMATION"} />
        </div>
        <div className="flex gap-3">
          <input
            required
            onChange={onChangeHandler}
            name="firstName"
            value={formData.firstName}
            placeholder="First name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
          />
          <input
            required
            onChange={onChangeHandler}
            name="lastName"
            value={formData.lastName}
            placeholder="Last name"
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
          />
        </div>
        <input
          required
          onChange={onChangeHandler}
          name="email"
          value={formData.email}
          placeholder="Email address"
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="email"
        />
        <input
          required
          placeholder="Street"
          onChange={onChangeHandler}
          name="street"
          value={formData.street}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="text"
        />
        <div className="flex gap-3">
          <input
            required
            placeholder="City"
            onChange={onChangeHandler}
            name="city"
            value={formData.city}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
          />
          <input
            required
            placeholder="State"
            onChange={onChangeHandler}
            name="state"
            value={formData.state}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
          />
        </div>
        <div className="flex gap-3">
          <input
            required
            placeholder="Zipcode"
            onChange={onChangeHandler}
            name="zipcode"
            value={formData.zipcode}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="number"
          />
          <input
            required
            placeholder="Country"
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
          />
        </div>
        <input
          required
          placeholder="Phone"
          onChange={onChangeHandler}
          name="phone"
          value={formData.phone}
          className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
          type="number"
        />
      </div>

      {/* Right Side - Payment Information */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>
        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHOD"} />
          <div className="flex gap-3 flex-col lg:flex-row">
            <div
              onClick={() => setMethod("razorpay")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "razorpay" ? "bg-green-400" : ""
                }`}
              ></p>
              <img className="h-5 mx-4" src={gcash} alt="Gcash" />
            </div>
            <div
              onClick={() => setMethod("COD")}
              className="flex items-center gap-3 border p-2 px-3 cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "COD" ? "bg-green-400" : ""
                }`}
              ></p>
              <p className="text-gray-500 text-sm font-medium mx-4">
                CASH ON DELIVERY
              </p>
            </div>
          </div>
          <div className="w-full text-end mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-500" : "bg-black"
              } text-white px-16 py-3 text-sm flex items-center justify-center`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  PROCESSING...
                </>
              ) : (
                "PLACE ORDER"
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
