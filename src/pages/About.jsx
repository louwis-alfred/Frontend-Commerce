import Title from "../components/Title";
import agriculture from "../assets/frontend_assets/agriculture_logo.jpg";

const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>
      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-[450px]"
          src={agriculture}
          alt="Farm view"
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            We are a family-owned agricultural business dedicated to sustainable
            farming practices and environmentally friendly production. Our rich
            history and commitment to quality keep us rooted in the community.
          </p>
          <p>
            With generations of experience, we continuously adopt innovative techniques
            to nurture our soil, raise healthy crops, and ensure the highest standards
            in food production.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            Our mission is to cultivate high-quality, organic produce while preserving
            natural resources. We aim to serve our community with fresh, nutritious food
            and remain stewards of the land for future generations.
          </p>
        </div>
      </div>
      <div className="text-4xl py-4">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Organic & Sustainable:</b>
          <p className="text-gray-600">
            Our produce is grown using organic methods, ensuring the health of our soil
            and nature. Sustainable practices guide every step of our farming process.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Innovative Farming:</b>
          <p className="text-gray-600">
            We blend traditional farming techniques with modern technology to optimize yield
            and minimize environmental impact, ensuring quality right from the field to your table.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Community Focus:</b>
          <p className="text-gray-600">
            We are more than just a farm; we are part of the community. Our practices support local
            economies and promote food security through community involvement and education.
          </p>
        </div>
      </div>

    </div>
  );
};

export default About;