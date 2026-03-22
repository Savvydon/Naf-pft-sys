// AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);
const API_BASE = "https://naf-pft-sys-1.onrender.com";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session status on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        credentials: "include", // Important: sends cookies
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Session invalid");
      }

      const data = await response.json();
      setCurrentUser(data);
      setIsAuthenticated(true);
    } catch (error) {
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const login = useCallback(async (token, userData) => {
    // Token is stored in HTTP-only cookie by backend, but we store minimal info in memory
    setCurrentUser(userData);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkSession();
  }, []);

  const value = {
    currentUser,
    authLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ==== old code==
// // AuthContext.jsx
// import { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(localStorage.getItem("pft_token"));
//   const [currentUser, setCurrentUser] = useState(null);
//   const [authLoading, setAuthLoading] = useState(true);

//   useEffect(() => {
//     const storedToken = localStorage.getItem("pft_token");

//     if (storedToken) {
//       fetch("https://naf-pft-sys-1.onrender.com/auth/me", {
//         headers: {
//           Authorization: `Bearer ${storedToken}`,
//         },
//       })
//         .then((res) => {
//           if (!res.ok) throw new Error("Session invalid");
//           return res.json();
//         })
//         .then((data) => {
//           setCurrentUser(data);
//           setAuthLoading(false);
//         })
//         .catch(() => {
//           localStorage.removeItem("pft_token");
//           setToken(null);
//           setCurrentUser(null);
//           setAuthLoading(false);
//         });
//     } else {
//       setAuthLoading(false);
//     }
//   }, []);

//   const login = (newToken, userData) => {
//     localStorage.setItem("pft_token", newToken);
//     setToken(newToken);
//     setCurrentUser(userData); // ✅ set user immediately
//   };

//   const logout = () => {
//     localStorage.removeItem("pft_token");
//     setToken(null);
//     setCurrentUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{ token, currentUser, authLoading, login, logout }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);

// // AuthContext.jsx
// import { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(localStorage.getItem("pft_token"));
//   const [currentUser, setCurrentUser] = useState(null);
//   const [authLoading, setAuthLoading] = useState(true);

//   useEffect(() => {
//     const storedToken = localStorage.getItem("pft_token");

//     if (storedToken) {
//       fetch("https://naf-pft-sys-1.onrender.com/auth/me", {
//         headers: {
//           Authorization: `Bearer ${storedToken}`,
//         },
//       })
//         .then((res) => {
//           if (!res.ok) throw new Error("Session invalid");
//           return res.json();
//         })
//         .then((data) => {
//           setCurrentUser(data);
//           setAuthLoading(false);
//         })
//         .catch(() => {
//           localStorage.removeItem("pft_token");
//           setToken(null);
//           setCurrentUser(null);
//           setAuthLoading(false);
//         });
//     } else {
//       setAuthLoading(false);
//     }
//   }, []);

//   const login = (newToken) => {
//     localStorage.setItem("pft_token", newToken);
//     setToken(newToken);
//   };

//   const logout = () => {
//     localStorage.removeItem("pft_token");
//     setToken(null);
//     setCurrentUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{ token, currentUser, authLoading, login, logout }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);
