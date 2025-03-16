import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import OtpVerification from "../components/OtpVerification";
import { ShopContext } from "../context/ShopContext";

// Investment Types
const investmentTypes = [
  "Angel Investor", 
  "Venture Capital", 
  "Private Equity", 
  "Corporate Investment", 
  "Institutional Investor",
  "Impact Investor", 
  "Agricultural Finance", 
  "Farming Co-op Investor", 
  "Agri-tech Investor",
  "Supply Chain Financing"
];

// Industry Types
const industryTypes = [
  "Crop Farming",
  "Livestock Farming",
  "Aquaculture",
  "Forestry",
  "Agri-tech",
  "Food Processing",
  "Agricultural Supply Chain",
  "Farm Equipment",
  "Organic Farming",
  "Sustainable Agriculture",
  "Agricultural Research",
  "Agricultural Education",
  "Agricultural Export"
];

const ApplyAsInvestor = ({ onClose }) => {
  const { backendUrl } = useContext(ShopContext);
  const [investmentType, setInvestmentType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
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
    // Basic validation
    if (!investmentType || !contactNumber || !investmentAmount || !email || !file) {
      setAlertMessage("Please fill all required fields");
      setAlertVariant("danger");
      return;
    }

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
    formData.append("investmentType", investmentType);
    formData.append("companyName", companyName);
    formData.append("industry", industry);
    formData.append("contactNumber", contactNumber);
    formData.append("investmentAmount", investmentAmount);
    formData.append("supportingDocument", file);

    console.log("Form Data:", {
      investmentType,
      companyName,
      industry,
      contactNumber,
      email: verifiedEmail,
      investmentAmount,
      file
    });

    try {
      const response = await axios.post(`${backendUrl}/api/user/apply-investor`, formData, {
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
        <h5 className="text-center text-2xl font-bold mb-6">Apply to Become an Investor</h5>
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
                <label className="block text-sm font-medium text-gray-700">Investment Type*</label>
                <select
                  value={investmentType}
                  onChange={(e) => setInvestmentType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Investment Type</option>
                  {investmentTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name (Optional)</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your company name"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Industry Type (Optional)</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Industry</option>
                  {industryTypes.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number*</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter contact number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Investment Amount (₱)*</label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter investment amount"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
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
                Upload Supporting Document* (e.g., ID, Business Registration, Financial Statement)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p>* Required fields</p>
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
              <h5 className="text-lg font-semibold">You have successfully applied as an investor!</h5>
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
                Close
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  onClose();
                  navigate("/invest");  // Navigate to investment section
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Go to Investments
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

ApplyAsInvestor.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ApplyAsInvestor;