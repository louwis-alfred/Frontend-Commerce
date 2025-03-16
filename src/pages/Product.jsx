import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext.js";
import { assets } from "../assets/frontend_assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { motion } from "framer-motion";

const Product = () => {
  const { productId } = useParams();
  const { products, currency, addToCart } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.images[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  return productData ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 bg-white"
    >
      {/* Product Data */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse lg:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto gap-2 lg:w-24">
            {productData.images.map((item, index) => (
              <motion.img
                key={index}
                src={item}
                onClick={() => setImage(item)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 lg:w-full lg:h-24 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                alt={`Thumbnail ${index + 1}`}
              />
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1">
            <motion.img
              src={image}
              alt={productData.name}
              className="w-full h-auto rounded-lg shadow-md"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Product Information */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {productData.name}
          </h1>
          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(4)].map((_, i) => (
                <img
                  key={i}
                  src={assets.star_icon}
                  alt="Star"
                  className="w-5 h-5"
                />
              ))}
              <img
                src={assets.star_dull_icon}
                alt="Dull Star"
                className="w-5 h-5"
              />
            </div>
            <p className="text-sm text-gray-500">(122 Reviews)</p>
          </div>
          {/* Price */}
          <p className="text-4xl font-bold text-blue-600 mb-6">
            {currency}
            {productData.price.toFixed(2)}
          </p>
          {/* Description */}
          <p className="text-gray-600 mb-6">{productData.description}</p>
          {/* Add to Cart Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => addToCart(productData._id)}
            className="w-full lg:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-300"
          >
            ADD TO CART
          </motion.button>
          <hr className="my-6 border-gray-200" />
          {/* Additional Info */}
          <div className="text-sm text-gray-500 space-y-2">
            <p>✅ 100% Original Product</p>
            <p>✅ Cash on delivery available</p>
            <p>✅ Easy return and exchange within 7 days</p>
          </div>
        </div>
      </div>

      {/* Description & Review Section */}
      <div className="mt-12">
        <div className="flex border-b">
          <button className="px-6 py-3 text-sm font-semibold text-gray-800 border-b-2 border-blue-600">
            Description
          </button>
        </div>
        <div className="p-6 text-gray-600">
          <p className="mb-4">
            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Provident
            culpa facere laboriosam adipisci nemo explicabo ducimus iste
            doloremque voluptas magnam!
          </p>
          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Inventore,
            sit.
          </p>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Related Products
        </h2>
        <RelatedProducts
          category={productData.category}
          subCategory={productData.subCategory}
        />
      </div>
    </motion.div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;