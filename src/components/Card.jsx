import { useState, useRef } from 'react';
import { FaPhoneAlt, FaMoneyBillWave, FaFileAlt } from 'react-icons/fa';
import { useInvestor } from '../context/InvestorContext';

const Card = ({ option }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  return (
    <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="flex flex-col md:flex-row"> 
        {/* Video Section */}
        <section className="w-full md:w-1/2 relative">
          <video
            ref={videoRef}
            src={option.videoUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-64 md:h-full object-cover"
          />
          <button
            className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-all duration-200"
            onClick={toggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </section>

        {/* Details Section */}
        <section className="w-full md:w-1/2 p-6 space-y-4">
          {/* Title */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-800">{option.name}</h3>

          {/* Description */}
          <p className="text-gray-600 text-sm">{option.description}</p>

          {/* Investment Details */}
          <div className="space-y-2">
            <p className="text-base text-gray-700">
              <strong>Minimum Investment:</strong> {option.minInvestment}
            </p>
            <p className="text-base text-gray-700">
              <strong>Location:</strong> {option.location}
            </p>
            <p className="text-base text-gray-700">
              <strong>Project Duration:</strong> {option.projectDuration}
            </p>
            <p className="text-base text-gray-700">
              <strong>Expected Yield:</strong> {option.expectedYield}
            </p>
            <p className="text-base text-gray-700">
              <strong>Investment Risk:</strong> {option.investmentRisk}
            </p>
          </div>

          {/* Farmer Details */}
          <div className="mt-4 space-y-2">
            <h5 className="text-lg font-semibold text-gray-800">Farmer Details</h5>
            <p className="text-sm text-gray-700">
              <strong>Name:</strong> {option.farmerDetails.name}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Contact:</strong> {option.farmerDetails.contact}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Email:</strong> {option.farmerDetails.email}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <button
              className="flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-all duration-200"
            >
              <FaPhoneAlt /> Contact
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition-all duration-200"
            >
              <FaFileAlt /> View Documents
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-all duration-200"
            >
              <FaMoneyBillWave /> Invest Now
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Card;
