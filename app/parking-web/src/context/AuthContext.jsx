import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    // Check localStorage for saved role
    return localStorage.getItem("parkingRole") || "visitor";
  });

  // Save role to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("parkingRole", role);
  }, [role]);

  const login = (username, password) => {
    // Simple hardcoded credentials for demo
    if (username === "admin" && password === "admin123") {
      setRole("admin");
      return { success: true };
    }
    return { success: false, error: "Username ose password gabim!" };
  };

  const logout = () => {
    setRole("visitor");
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
