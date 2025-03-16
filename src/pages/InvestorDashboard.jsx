import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import DocumentViewerModal from "../components/DocumentViewerModal";

const InvestorDashboard = () => {
  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investmentStats, setInvestmentStats] = useState({
    totalInvested: 0,
    totalConfirmed: 0,
    totalPending: 0,
    activeInvestments: 0,
    totalReturns: 0,
  });

  // State for filtering and sorting investments
  const [filter, setFilter] = useState("all"); // 'all', 'approved', 'pending'
  const [sort, setSort] = useState("date-desc");

  // Document viewer modal state
  const [showDocument, setShowDocument] = useState(false);
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get investor dashboard data (current user info and investments)
        const dashboardResponse = await axios.get(
          `${backendUrl}/api/investor/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (dashboardResponse.data.success) {
          setCurrentUser(dashboardResponse.data.user);

          // Extract investment stats from the user object
          const stats = {
            totalInvested: dashboardResponse.data.user.totalInvested || 0,
            totalConfirmed:
              dashboardResponse.data.user.investmentStats?.totalConfirmed || 0,
            totalPending:
              dashboardResponse.data.user.investmentStats?.totalPending || 0,
            activeInvestments:
              dashboardResponse.data.user.investmentStats?.activeInvestments ||
              0,
            totalReturns:
              dashboardResponse.data.user.investmentStats?.totalReturns || 0,
          };

          setInvestmentStats(stats);
        }

        // Get investor's investments
        const investmentsResponse = await axios.get(
          `${backendUrl}/api/investments/user`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (investmentsResponse.data.success) {
          // Populate campaign details in investments
          const investmentsWithDetails = await Promise.all(
            investmentsResponse.data.investments.map(async (investment) => {
              try {
                // Fetch campaign details for each investment
                const campaignResponse = await axios.get(
                  `${backendUrl}/api/campaign/${investment.campaignId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  }
                );

                if (campaignResponse.data.success) {
                  return {
                    ...investment,
                    campaignDetails: campaignResponse.data.campaign,
                  };
                }
                return investment;
              } catch {
                return investment;
              }
            })
          );

          setInvestments(investmentsWithDetails);
        }
      } catch (error) {
        console.error("Error fetching investor dashboard:", error);
        toast.error("Failed to load investor dashboard");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [backendUrl, navigate]);

  // Filtered and sorted investments
  const filteredInvestments = investments
    .filter((investment) => {
      if (filter === "all") return true;
      return investment.status === filter;
    })
    .sort((a, b) => {
      if (sort === "date-desc") return new Date(b.date) - new Date(a.date);
      if (sort === "date-asc") return new Date(a.date) - new Date(b.date);
      if (sort === "amount-desc") return b.amount - a.amount;
      if (sort === "amount-asc") return a.amount - b.amount;
      return 0;
    });

  // Portfolio diversification data
  const generatePortfolioData = () => {
    const categories = {};
    investments.forEach((investment) => {
      if (investment.status === "approved") {
        const category = investment.campaignDetails?.category || "Other";
        categories[category] =
          (categories[category] || 0) + parseFloat(investment.amount);
      }
    });

    return Object.keys(categories).map((key) => ({
      name: key,
      value: categories[key],
    }));
  };

  // Payment method distribution data
  const generatePaymentMethodData = () => {
    const methods = {};
    investments.forEach((investment) => {
      const method =
        investment.paymentMethod === "mobile_payment"
          ? "Mobile Payment"
          : investment.paymentMethod === "bank_transfer"
          ? "Bank Transfer"
          : "In-person";

      methods[method] = (methods[method] || 0) + parseFloat(investment.amount);
    });

    return Object.keys(methods).map((key) => ({
      name: key,
      value: methods[key],
    }));
  };

  const handleViewDocument = (url, title) => {
    setDocumentUrl(url);
    setDocumentTitle(title);
    setShowDocument(true);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Investor Dashboard
      </h1>

      {/* User Information */}
      {currentUser && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold">{currentUser.name}</h2>
              <p className="text-gray-600">{currentUser.email}</p>
              {currentUser.investorApplication && (
                <p className="text-sm mt-1">
                  <span className="font-medium">Status: </span>
                  <span
                    className={`${
                      currentUser.investorApplication.status === "approved"
                        ? "text-green-600"
                        : currentUser.investorApplication.status === "rejected"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {currentUser.investorApplication.status
                      .charAt(0)
                      .toUpperCase() +
                      currentUser.investorApplication.status.slice(1)}
                  </span>
                </p>
              )}
            </div>
            {currentUser.investorApplication && (
              <div className="mt-4 md:mt-0 flex flex-col items-end">
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {currentUser.investorApplication.investmentType}
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ₱
                    {currentUser.investorApplication.investmentAmount.toLocaleString()}{" "}
                    Investment Capacity
                  </span>
                </div>
                <button
                  className="text-sm text-blue-600 mt-2 hover:underline"
                  onClick={() =>
                    handleViewDocument(
                      currentUser.investorApplication.supportingDocument,
                      "Investment Verification Document"
                    )
                  }
                >
                  View Supporting Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Investment Analytics */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Investment Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Invested</p>
            <p className="text-2xl font-bold">
              ₱{investmentStats.totalInvested.toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Confirmed Investments</p>
            <p className="text-2xl font-bold">
              ₱{investmentStats.totalConfirmed.toLocaleString()}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active Investments</p>
            <p className="text-2xl font-bold">
              {investmentStats.activeInvestments}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Your Investments */}
        <div className="bg-white p-6 rounded-lg shadow-md h-[550px] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              Your Investments
            </h2>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-2">
            {filteredInvestments.length > 0 ? (
              <div className="space-y-4">
                {filteredInvestments.map((investment) => (
                  <div
                    key={investment._id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {investment.campaignDetails?.title || "Campaign"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Amount: ₱{investment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Date: {new Date(investment.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Payment:{" "}
                          {investment.paymentMethod === "mobile_payment"
                            ? "Mobile Payment"
                            : investment.paymentMethod === "bank_transfer"
                            ? "Bank Transfer"
                            : "In-person"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            investment.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : investment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {investment.status.charAt(0).toUpperCase() +
                            investment.status.slice(1)}
                        </span>
                        <span
                          className={`mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            investment.payment
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {investment.payment ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg
                  className="w-16 h-16 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <p className="mt-4 text-gray-500">
                  No investments found with the selected filters.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-md h-[550px] overflow-hidden flex flex-col">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Portfolio Analytics
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Investment by Category
              </h3>
              {generatePortfolioData().length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={generatePortfolioData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generatePortfolioData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₱${value.toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px]">
                  <p className="text-gray-500 text-sm">
                    No approved investments yet
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Payment Method Distribution
              </h3>
              {generatePaymentMethodData().length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={generatePaymentMethodData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {generatePaymentMethodData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[(index + 2) % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `₱${value.toLocaleString()}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px]">
                  <p className="text-gray-500 text-sm">
                    No investment data available
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Investment Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Approved:</span>
                  <span className="font-medium">
                    {investments.filter((i) => i.status === "approved").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending:</span>
                  <span className="font-medium">
                    {investments.filter((i) => i.status === "pending").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cancelled:</span>
                  <span className="font-medium">
                    {investments.filter((i) => i.status === "cancelled").length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payment Confirmed:</span>
                  <span className="font-medium">
                    {investments.filter((i) => i.payment).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-medium text-gray-700 mb-2">
                Recent Activity
              </h3>
              {investments.length > 0 ? (
                <div className="space-y-2 text-sm">
                  {investments.slice(0, 4).map((inv) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate max-w-[150px]">
                        {inv.campaignDetails?.title || "Campaign"}
                      </span>
                      <span
                        className={`${
                          inv.status === "approved"
                            ? "text-green-600"
                            : inv.status === "cancelled"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        ₱{inv.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center mt-4">
                  No recent activity
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={showDocument}
        onClose={() => setShowDocument(false)}
        documentUrl={documentUrl}
        title={documentTitle}
      />
    </div>
  );
};

export default InvestorDashboard;