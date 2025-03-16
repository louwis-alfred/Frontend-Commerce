import { useContext, useEffect } from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import OurPolicy from "../components/OurPolicy";
import { ShopContext } from "../context/ShopContext";

const Home = () => {
  const { getProductsData } = useContext(ShopContext);

  useEffect(() => {
    getProductsData();
  }, []);

  return (
    <div>
      <Hero />
      <LatestCollection />
      <OurPolicy />
    </div>
  );
};

export default Home;