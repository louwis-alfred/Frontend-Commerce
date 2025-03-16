import { createContext, useContext, useState } from "react";
import axios from "axios";
const InvestorContext = createContext();

export const InvestorProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  const selectInvestment = (investment) => {
    setSelectedInvestment(investment);
  };

  // Existing function: contactFarmer, etc.
  const contactFarmer = async (contactInfo) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/contact`, contactInfo);
      alert("Message sent successfully!");
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const placeInvestment = async ({ userId, videoId, amount }) => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/investment/place`, {
        userId,
        videoId,
        amount,
        paymentMethod: "COD"  
      });
      alert(response.data.message || "Investment placed successfully");
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <InvestorContext.Provider
      value={{
        selectedInvestment,
        selectInvestment,
        contactFarmer,
        placeInvestment,
        loading,
        error,
      }}
    >
      {children}
    </InvestorContext.Provider>
  );
};

export const useInvestor = () => useContext(InvestorContext);

export default InvestorContext;