import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext.js";
import { assets } from "../assets/frontend_assets/assets";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    setCartItems,
  } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    console.log("Cart items:", cartItems);
    console.log("Products:", products);
    if (products.length > 0) {
      const tempData = [];
      for (const itemId in cartItems) {
        if (cartItems[itemId].quantity > 0) {
          const productData = products.find(
            (product) => product._id === itemId
          );
          if (productData) {
            tempData.push({
              _id: itemId,
              quantity: cartItems[itemId].quantity,
              productData: productData,
            });
          }
        }
      }
      setCartData(tempData);
      console.log("Updated cart data:", tempData);
    }
  }, [cartItems, products]);

  const handleRemoveItem = (itemId) => {
    updateQuantity(itemId, 0);
  };

  const handleProceedToCheckout = () => {
    navigate("/place-order");
  };

  return (
    <div className="border-t pt-14">
      <div className="text-2xl mb-3">
        <Title text1={"YOUR"} text2={"CART"} />
      </div>

      <div>
        {cartData.map((item, index) => {
          return (
            <div
              key={index}
              className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
            >
              <div className="flex items-start gap-6">
                <img
                  className="w-16 sm:w-20"
                  src={
                    item.productData.images && item.productData.images.length
                      ? item.productData.images[0]
                      : ""
                  }
                  alt=""
                />
                <div>
                  <p className="text-xs sm:text-lg font-medium">
                    {item.productData.name}
                  </p>
                  <div className="flex items-center gap-5 mt-2">
                    <p>
                      {currency}
                      {item.productData.price}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Stock: {item.productData.stock}
                    </p>
                  </div>
                </div>
              </div>
              <input
                onChange={(e) =>
                  e.target.value === "" || e.target.value === "0"
                    ? null
                    : updateQuantity(item._id, Number(e.target.value))
                }
                className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                type="number"
                min={1}
                max={item.productData.stock} // Limit the quantity to the available stock
                defaultValue={item.quantity}
              />
              <img
                onClick={() => handleRemoveItem(item._id)}
                className="w-4 mr-4 sm:w-5 cursor-pointer"
                src={assets.bin_icon}
                alt="Remove"
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className="w-full text-end">
            <button
              onClick={handleProceedToCheckout}
              className="bg-black text-white text-sm my-8 px-8 py-3"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;