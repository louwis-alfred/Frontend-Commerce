import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const InvestmentCheckoutModal = ({
  campaign,
  isOpen,
  onClose,
  onInvestmentSuccess,
}) => {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_payment"); // Default to mobile payment
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = amount, 2 = payment, 3 = confirm, 4 = success
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    console.log("Campaign data:", campaign);
  }, [campaign]);

  const handleAmountChange = (e) => {
    // Only allow numbers and decimal point
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Ensure only one decimal point
    if (value.split(".").length > 2) return;
    setInvestmentAmount(value);
  };

  const goToNextStep = () => {
    const amount = parseFloat(investmentAmount);
    console.log({
      amount,
      isValid: !isNaN(amount) && amount > 0,
      meetsMinimum: amount >= (campaign.minimumInvestment || 100),
      withinLimit:
        amount <= campaign.targetAmount - (campaign.currentAmount || 0),
      campaign,
    });

    if (step === 1) {
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid investment amount");
        return;
      }

      if (amount < (campaign.minimumInvestment || 100)) {
        toast.error(
          `Minimum investment is ₱${campaign.minimumInvestment || 100}`
        );
        return;
      }

      if (amount > campaign.targetAmount - (campaign.currentAmount || 0)) {
        toast.error("Amount exceeds remaining investment needed");
        return;
      }
    }

    setStep(step + 1);
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const amount = parseFloat(investmentAmount);

      // Calculate expected return values
      const expectedReturnPercentage = campaign.expectedReturn || 15;
      const expectedReturn = (amount * expectedReturnPercentage) / 100;

      const response = await axios.post(
        `${backendUrl}/api/investments/create`,
        {
          campaignId: campaign._id,
          amount,
          paymentMethod,
          expectedReturn,
          expectedReturnPercentage,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        // Set success step
        setStep(4);

        toast.success(`Successfully invested ₱${amount} in ${campaign.title}`);

        // Pass investment data back to parent
        if (onInvestmentSuccess) {
          onInvestmentSuccess({
            ...response.data,
            campaignTitle: campaign.title,
            amount,
            expectedReturn: expectedReturn,
            expectedReturnPercentage: expectedReturnPercentage,
          });
        }

        // Navigate to dashboard after short delay for success screen
        setTimeout(() => {
          setLoading(false);
          onClose();
          window.location.href = "/investor/dashboard";
        }, 3000);
      } else {
        throw new Error(
          response.data.message || "Failed to process investment"
        );
      }
    } catch (error) {
      console.error("Investment error:", error);
      setLoading(false);
      toast.error(
        error.response?.data?.message || "Failed to process investment"
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="font-bold text-lg">
            {step === 1
              ? "Investment Amount"
              : step === 2
              ? "Payment Method"
              : step === 3
              ? "Confirm Investment"
              : "Investment Successful"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {step < 4 && (
            <div className="flex mb-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s === step
                        ? "bg-green-600 text-white"
                        : s < step
                        ? "bg-green-200 text-green-800"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {s === 1 ? "Amount" : s === 2 ? "Payment" : "Confirm"}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="my-6">
            {step === 1 && (
              <div>
                <h4 className="font-medium text-gray-800">{campaign.title}</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Target: ₱{campaign.targetAmount?.toLocaleString()} • Raised: ₱
                  {campaign.currentAmount?.toLocaleString()} • Expected Return:{" "}
                  {campaign.expectedReturn || "10-15"}%
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Amount (₱)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₱</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={investmentAmount}
                      onChange={handleAmountChange}
                      className="focus:ring-green-500 focus:border-green-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum investment: ₱{campaign.minimumInvestment || 100}
                  </p>
                </div>

                {/* Display the calculated expected returns */}
                {investmentAmount &&
                  !isNaN(parseFloat(investmentAmount)) &&
                  parseFloat(investmentAmount) > 0 && (
                    <div className="p-3 bg-green-50 rounded-md border border-green-100">
                      <p className="text-sm font-medium text-green-800">
                        Potential Returns
                      </p>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-green-700">Investment:</span>
                        <span className="font-medium">
                          ₱{parseFloat(investmentAmount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-green-700">Expected return:</span>
                        <span className="font-medium">
                          ₱
                          {(
                            (parseFloat(investmentAmount) *
                              (campaign.expectedReturn || 15)) /
                            100
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className="text-green-700">Total value:</span>
                        <span className="font-medium">
                          ₱
                          {(
                            parseFloat(investmentAmount) *
                            (1 + (campaign.expectedReturn || 15) / 100)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {step === 2 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-3">
                  Select Payment Method
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_payment"
                      checked={paymentMethod === "mobile_payment"}
                      onChange={() => setPaymentMethod("mobile_payment")}
                      className="h-4 w-4 text-green-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium">GCash/Mobile Payment</p>
                      <p className="text-sm text-gray-500">
                        Pay instantly with mobile payment
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="h-4 w-4 text-green-600"
                    />
                    <div className="ml-3">
                      <p className="font-medium">Cash on Delivery (COD)</p>
                      <p className="text-sm text-gray-500">
                        Pay when your investment is delivered/processed
                      </p>
                    </div>
                  </label>
                </div>

                {/* Payment instructions */}
                <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Payment Instructions
                  </p>
                  <p className="text-xs text-blue-700">
                    {paymentMethod === "mobile_payment"
                      ? "After confirming your investment, you'll be able to pay instantly through our mobile payment gateway."
                      : "Your investment will be processed and you can pay with cash when it's completed. Our team will contact you to arrange the details."}
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Review your investment
                </h4>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Campaign:</span>
                    <span className="font-medium">{campaign.title}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      ₱{parseFloat(investmentAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {paymentMethod === "mobile_payment"
                        ? "GCash/Mobile Payment"
                        : "Cash on Delivery (COD)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected Return:</span>
                    <span className="font-medium text-green-600">
                      ₱
                      {(
                        (parseFloat(investmentAmount) *
                          (campaign.expectedReturn || 15)) /
                        100
                      ).toLocaleString()}{" "}
                      ({campaign.expectedReturn || 15}%)
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 pt-2 border-t">
                    <span className="text-gray-600">Total at maturity:</span>
                    <span className="font-medium text-green-700">
                      ₱
                      {(
                        parseFloat(investmentAmount) *
                        (1 + (campaign.expectedReturn || 15) / 100)
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>

                {paymentMethod === "cod" && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-yellow-500 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Cash on Delivery Selected
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Your investment will be processed and our team will
                          contact you to arrange payment details. Please keep
                          your phone available.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  By confirming, you agree to invest in this campaign according
                  to the terms and conditions.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-700">
                  Investment Successful!
                </h3>
                <p className="text-gray-600">
                  You&apos;ve successfully invested ₱
                  {parseFloat(investmentAmount).toLocaleString()} in{" "}
                  {campaign.title}
                </p>

                <p className="text-sm text-gray-500">
                  Redirecting to your dashboard...
                </p>

                <div className="animate-pulse text-green-600">
                  <svg
                    className="w-6 h-6 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex justify-between">
          {step > 1 && step < 4 ? (
            <button
              onClick={goToPreviousStep}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Back
            </button>
          ) : step < 4 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
          ) : (
            <div></div> // Empty div to maintain flex layout on success screen
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                console.log("Continue button clicked");
                goToNextStep();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Continue
            </button>
          ) : step === 3 ? (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing
                </>
              ) : (
                "Confirm Investment"
              )}
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={true}
            >
              Going to Dashboard...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

InvestmentCheckoutModal.propTypes = {
  campaign: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    targetAmount: PropTypes.number,
    currentAmount: PropTypes.number,
    expectedReturn: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    minimumInvestment: PropTypes.number,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInvestmentSuccess: PropTypes.func,
};

export default InvestmentCheckoutModal;
