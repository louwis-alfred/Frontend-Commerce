import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import OtpVerification from "../components/OtpVerification";
import { ShopContext } from "../context/ShopContext";

// Province and City Mapping
const provinces = {
  "Quezon City": ["Novaliches"]
};

const agricultureBusinessTypes = [
  "Butcher (Selling Meat)",
  "Fishmonger (Selling Fish)",
  "Vegetable Farmer (Selling Produce)"
];

const ApplyForm = ({ onClose }) => {
  const { backendUrl } = useContext(ShopContext);
  const [businessName, setBusinessName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/otp/send`, { email });
      if (response.data.success) {
        setIsOtpSent(true);
        setAlertMessage("OTP sent to your email");
        setAlertVariant("success");
      } else {
        setAlertMessage(response.data.message);
        setAlertVariant("danger");
      }
    } catch (error) {
      setAlertMessage("Error sending OTP");
      console.log(error);
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (verifiedEmail) => {
    setIsOtpVerified(true);
    setLoading(true);

    const formData = new FormData();
    formData.append("businessName", businessName);
    formData.append("companyType", companyType);
    formData.append("farmLocation", farmLocation);
    formData.append("province", selectedProvince);
    formData.append("city", selectedCity);
    formData.append("contactNumber", contactNumber);
    formData.append("email", verifiedEmail);
    formData.append("supportingDocument", file);

    console.log("Form Data:", {
      businessName,
      companyType,
      farmLocation,
      selectedProvince,
      selectedCity,
      contactNumber,
      email: verifiedEmail,
      file,
    });

    try {
      const response = await axios.post(`${backendUrl}/api/user/apply-seller`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
      });

      console.log("Response:", response);

      if (response.data.success) {
        setShowSuccessModal(true); // Show success modal
      } else {
        setAlertMessage(response.data.message || "Failed to submit application.");
        setAlertVariant("danger");
      }
    } catch (error) {
      console.error("Error submitting application:", error.message);
      console.error("Error details:", error.response);
      setAlertMessage("An error occurred while submitting the application.");
      setAlertVariant("danger");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setIsOtpSent(false);
    setAlertMessage("");
    setAlertVariant("");
  };

  return (
    <>
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <h5 className="text-center text-2xl font-bold mb-6">Apply to Become a Seller</h5>
        {alertMessage && (
          <div className={`p-4 mb-4 rounded ${alertVariant === "danger" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {alertMessage}
          </div>
        )}
        {loading && <div className="text-center m-5">Processing your application...</div>}
        {!isOtpSent && (
          <form>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Type</label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Company Type</option>
                  {agricultureBusinessTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select City</option>
                  {Object.keys(provinces).map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedProvince}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select City</option>
                  {selectedProvince &&
                    provinces[selectedProvince].map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                type="text"
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                placeholder="Exact Address"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter contact number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Upload Supporting Document (e.g., Business Permit, DTI Registration, BIR Certificate, or Farmer&apos;s Accreditation)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Submit
              </button>
            </div>
          </form>
        )}
        {isOtpSent && !isOtpVerified && (
          <OtpVerification email={email} onOtpVerified={handleOtpVerified} onCancel={handleCancelOtp} />
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Success!</h2>
            <div className="text-center">
              <h5 className="text-lg font-semibold">You have successfully applied as a seller!</h5>
              <p className="mt-2">Your application is under review. You will be notified once approved.</p>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 mr-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  navigate("/seller/dashboard");
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Go to SellerDashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ApplyForm.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ApplyForm;