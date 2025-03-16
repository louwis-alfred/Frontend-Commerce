import { useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const OtpVerification = ({ email, onOtpVerified, onCancel }) => {
  const { backendUrl } = useContext(ShopContext);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Auto focus on first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Set up countdown timer
    const countdown = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(countdown);
          setCanResend(true);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    return () => clearInterval(countdown);
  }, []);

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    // Allow any character, but only take the last one
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Move to next input if current input is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Please enter a complete 6-character OTP');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/otp/verify/seller`, { 
        email, 
        otp: otpString 
      });
      
      if (response.data.success) {
        setMessage('OTP verified successfully');
        onOtpVerified(email);
      } else {
        setMessage(response.data.message || 'Invalid OTP');
      }
    } catch (error) {
      setMessage('Error verifying OTP: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      await axios.post(`${backendUrl}/api/otp/resend`, { email });
      setMessage('New OTP sent to your email');
      setTimer(60);
      setCanResend(false);
      
      // Reset OTP fields
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error) {
      setMessage('Error sending OTP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verification Required</h2>
        <p className="text-gray-600 mt-2">
          Enter the 6-character code sent to 
          <span className="font-medium text-blue-600"> {email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            maxLength="1"
            value={digit}
            onChange={e => handleOtpChange(e, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            disabled={loading}
            className="w-12 h-12 border-2 rounded-md text-center text-xl font-semibold text-gray-800 focus:border-blue-500 focus:ring-blue-500 focus:outline-none transition-colors"
          />
        ))}
      </div>
      
      {message && (
        <div className={`text-center p-2 rounded mb-4 ${message.includes('success') || message === 'OTP verified' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button 
          onClick={verifyOtp} 
          disabled={loading || otp.join('').length !== 6}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        
        <button 
          onClick={onCancel}
          disabled={loading}
          className="w-full py-3 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          {canResend ? (
            <button 
              onClick={handleResendOtp}
              className="text-blue-600 hover:text-blue-800 font-medium"
              disabled={loading}
            >
              Resend OTP
            </button>
          ) : (
            <span>
              Resend OTP in <span className="font-medium">{timer}</span> seconds
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

OtpVerification.propTypes = {
  email: PropTypes.string.isRequired,
  onOtpVerified: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default OtpVerification;