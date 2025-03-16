import { useState, useEffect, createContext, useContext } from "react";
import Slider from "react-slick";

// Create a Context for the carousel items
const CarouselContext = createContext();

const Hero = () => {
  const [carouselItems, setCarouselItems] = useState([]);

  // Agriculture-themed product data
  const products = [
    {
      _id: 1,
      name: "Organic Tomatoes",
      description: "Fresh, pesticide-free tomatoes grown sustainably.",
      image: [
        "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      ],
      bestseller: true,
    },
    {
      _id: 3,
      name: "Compost Fertilizer",
      description: "Nutrient-rich compost for healthier crops.",
      image: [
        "https://images.unsplash.com/photo-1613478223719-2ab802602423?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      ],
      bestseller: true,
    },
  ];

  useEffect(() => {
    // Filter products marked as bestseller for the carousel
    const bestsellerProducts = products.filter((product) => product.bestseller);
    setCarouselItems(bestsellerProducts);
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
  };

  return (
    <CarouselContext.Provider value={carouselItems}>
      <div className="relative">
        <div className="carousel-container overflow-hidden relative">
          <Slider {...settings}>
            {carouselItems.map((item) => (
              <div key={item._id} className="carousel-item relative">
                {/* Background Image with Gradient Overlay */}
                <div className="relative w-full h-96">
                  <img
                    className="w-full h-full object-cover"
                    src={item.image[0]}
                    alt={`Image of ${item.name}`}
                    aria-label={`Bestselling product: ${item.name}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>

                {/* Card Overlay */}
                <div className="absolute bottom-8 left-8 right-8 bg-white bg-opacity-95 rounded-xl shadow-2xl p-6 flex items-center space-x-6 transform transition-transform duration-300">
                  <div>
                    <p className="text-xl md:text-3xl font-bold text-green-900 drop-shadow-md mb-2">
                      {item.name}
                    </p>
                    <p className="text-sm md:text-lg text-gray-700 mb-4">{item.description}</p>
                    <button
                      className="mt-4 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition duration-300 transform hover:scale-105 shadow-md"
                      onClick={() => window.location.href = `/product/${item._id}`}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </CarouselContext.Provider>
  );
};

// Example of using the Context in another component
const CarouselDetails = () => {
  const carouselItems = useContext(CarouselContext);

  return (
    <div className="mt-12 px-4">
      <h2 className="text-4xl font-bold text-center mb-8 text-green-900">
        Featured Agricultural Products
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {carouselItems.map((item) => (
          <div
            key={item._id}
            className="bg-white shadow-xl rounded-xl overflow-hidden transform transition-transform duration-300 hover:scale-105"
          >
            <img
              className="w-full h-56 object-cover"
              src={item.image[0]}
              alt={item.name}
            />
            <div className="p-6">
              <p className="text-2xl font-semibold text-green-900 mb-2">
                {item.name}
              </p>
              <p className="text-gray-700">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hero;
export { CarouselDetails };
