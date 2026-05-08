import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App.tsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

const app = (
  <BrowserRouter>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#14532d",
          borderRadius: 18,
          colorBgContainer: "rgba(255, 251, 245, 0.88)",
          colorText: "#1f2937",
          colorTextSecondary: "#5b6470",
          fontFamily: '"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
