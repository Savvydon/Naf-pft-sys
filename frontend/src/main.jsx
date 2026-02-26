import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Use basename for production under /PhysicalFitness
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/PhysicalFitness">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);