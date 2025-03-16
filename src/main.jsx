import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ShopContextProvider from "./context/ShopContext.jsx";
import { InvestorProvider } from "./context/InvestorContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <InvestorProvider>
      <ShopContextProvider>
        <NotificationProvider>
        <App />
        </NotificationProvider>
      </ShopContextProvider>
    </InvestorProvider>
  </BrowserRouter>
);
