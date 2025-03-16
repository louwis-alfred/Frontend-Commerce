
const Footer = () => {
  return (
    <div className="flex flex-col gap-10 my-10 mt-40 text-sm">

      {/* Top Section: COMPANY and GET IN TOUCH */}
      <div className="flex flex-col sm:flex-row justify-between w-full">
        {/* Combined COMPANY and GET IN TOUCH Section */}
        <div className="flex flex-col sm:flex-row justify-between w-full">
          {/* COMPANY Section */}
          <div className="mb-3 sm:mb-0"> {/* Reduced margin-bottom */}
            <p className="text-xl font-medium mb-3">QCU</p> {/* Reduced margin-bottom */}
            <ul className="flex flex-col gap-1 text-gray-600">
              <li>Home</li>
              <li>About us</li>
              <li>Delivery</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          {/* GET IN TOUCH Section */}
          <div className="mb-3 sm:mb-0"> {/* Added margin-bottom for consistency */}
            <p className="text-xl font-medium mb-3">GET IN TOUCH</p> {/* Reduced margin-bottom */}
            <ul className="flex flex-col gap-1 text-gray-600">
              <li>+63-9948673651</li>
              <li>louwisaflredn@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: Copyright */}
      <div className="border-t border-gray-200 pt-5">
        <p className="text-sm text-center text-gray-600">
          Copyright 2025 @ louwisalfredn - All Rights Reserved
        </p>
      </div>

    </div>
  );
};

export default Footer;