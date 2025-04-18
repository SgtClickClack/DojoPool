import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const LoadingFallback = () => (
  <div className="loading-container">
    <p>Loading...</p>
  </div>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
    </Suspense>
  </React.StrictMode>,
);
