// components/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("pft_token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("pft_token");

    if (storedToken) {
      fetch("https://naf-pft-sys.onrender.com/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session invalid");
          return res.json();
        })
        .then((data) => {
          setCurrentUser(data);
          setAuthLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("pft_token");
          setToken(null);
          setCurrentUser(null);
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem("pft_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("pft_token");
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, currentUser, authLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
