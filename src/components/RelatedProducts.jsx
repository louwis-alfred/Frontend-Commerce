import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext.js";
import Title from "./Title";
import ProductItem from "./ProductItem";

// eslint-disable-next-line react/prop-types
const RelatedProducts = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      let productsCopy = products.slice();
      productsCopy = productsCopy.filter((item) => category === item.category);
      productsCopy = productsCopy.filter(
        (item) => subCategory === item.subCategory
      );
      setRelated(productsCopy.slice(0, 5));
    }
  }, [products, category, subCategory]); // Add category and subCategory to the dependency array

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1={"RELATED"} text2={"PRODUCTS"} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {related.map((item, index) => (
          <ProductItem
            key={index}
            id={item._id}
            name={item.name}
            price={item.price}
            image={Array.isArray(item.images) ? item.images[0] : item.images}
            stock={item.stock} // Pass the stock prop
            seller={item.seller} // Pass the seller prop
          />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;