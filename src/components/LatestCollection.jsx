import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { motion } from "framer-motion";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  const [latestProduct, setLatestProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (products.length > 0) {
      setLatestProducts(products.slice(0, 10));
      setIsLoading(false);
    }
  }, [products]);

  return (
    <div className="my-10">
      {/* Section Header */}
      <div className="text-center py-8 text-3xl">
        <Title text1={"EXPLORE OUR"} text2={"FRESH HARVEST"} />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-gray-600">
          Discover the finest selection of organic produce, sustainable farming
          tools, and eco-friendly solutions. Grow smarter, live healthier, and
          support local agriculture with our premium products.
        </p>
      </div>

      {/* Rendering Product List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
          {latestProduct.map((item) => (
            <motion.div
              key={item._id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
            >
              <ProductItem
                id={item._id}
                name={item.name}
                price={item.price}
                image={
                  Array.isArray(item.images) ? item.images[0] : item.images
                }
                stock={item.stock}
                seller={item.seller}
                className="h-[200px] sm:h-[250px] md:h-[400px]" // Responsive height
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LatestCollection;
