// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App.jsx";
// import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Import Bootstrap CSS
// import "bootstrap/dist/js/bootstrap.bundle.min.js"; // optional for modals, dropdowns
// import "./index.css"; // your custom CSS

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// );

// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
