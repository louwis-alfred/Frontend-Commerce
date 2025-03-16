import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [currentState, setCurrentState] = useState("Login");
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (currentState === "Sign Up") {
        if (!otpSent) {
          // Send OTP
          console.log("Sending OTP to:", email);
          const response = await axios.post(`${backendUrl}/api/otp/send`, { email });
          console.log("OTP Send Response:", response.data);
          if (response.data.success) {
            setOtpSent(true);
            toast.success("OTP sent to your email");
          } else {
            toast.error(response.data.message);
          }
        } else {
          // Verify OTP
          console.log("Verifying OTP for:", email);
          const verifyResponse = await axios.post(`${backendUrl}/api/otp/verify/user`, { email, otp });
          console.log("OTP Verify Response:", verifyResponse.data);
          if (verifyResponse.data.success) {
            // Register User
            const registerResponse = await axios.post(`${backendUrl}/api/user/register`, {
              name,
              email,
              password,
            });
            console.log("Register Response:", registerResponse.data);
            if (registerResponse.data.success) {
              setToken(registerResponse.data.token);
              localStorage.setItem("token", registerResponse.data.token);
              toast.success("Account created successfully!");
              setOtpSent(false);
              setOtp("");
            } else {
              toast.error(registerResponse.data.message);
            }
          } else {
            toast.error(verifyResponse.data.message);
          }
        }
      } else {
        console.log("Logging in with:", email);
        const response = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password,
        });
        console.log("Login Response:", response.data);
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("Logged in successfully!");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.log("Error:", error.response || error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <motion.form
        onSubmit={onSubmitHandler}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm bg-white rounded-lg shadow-md p-6"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentState}
          </h2>
          <p className="text-sm text-gray-500">
            {currentState === "Login"
              ? "Welcome back! Please sign in to continue."
              : "Create an account to get started."}
          </p>
        </div>

        <AnimatePresence>
          {currentState === "Sign Up" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Name"
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Email"
            required
          />
        </div>

        <div className="mb-6">
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Password"
            required
          />
        </div>

        {currentState === "Sign Up" && otpSent && (
          <div className="mb-6">
            <input
              onChange={(e) => setOtp(e.target.value)}
              value={otp}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter OTP"
              required
            />
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          {currentState === "Login" && (
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              setCurrentState(currentState === "Login" ? "Sign Up" : "Login")
            }
            className="text-sm text-blue-600 hover:underline"
          >
            {currentState === "Login"
              ? "Create an account"
              : "Already have an account? Login"}
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-sm"
          disabled={loading}
        >
          {loading ? "Processing..." : currentState === "Login" ? "Sign In" : otpSent ? "Verify OTP" : "Sign Up"}
        </button>
      </motion.form>
    </div>
  );
};

export default Login;