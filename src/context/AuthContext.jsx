import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const AuthContext = createContext(null);

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // admin | superadmin | alumni
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ── Fetch Profile ───────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();

      const freshUser = data?.user ?? null;

      if (freshUser) {
        // Normalize user object with required fields
        const normalizedUser = {
          ...freshUser,
          role: freshUser.role || "alumni",
          isAdmin: freshUser.isAdmin ?? false,
          isApproved: freshUser.isApproved ?? true,
        };
        
        setUser(normalizedUser);
        setRole(normalizedUser.role);
        setIsAuthenticated(true);
      } else {
        throw new Error("No user found");
      }
    } catch {
      setUser(null);
      setRole(null);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── Initial Load ────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(
    async (userData) => {
      // Normalize user object
      const normalizedUser = {
        ...userData,
        role: userData.role || "alumni",
        isAdmin: userData.isAdmin ?? false,
        isApproved: userData.isApproved ?? true,
      };
      
      setUser(normalizedUser);
      setRole(normalizedUser.role);
      setIsAuthenticated(true);

      // Refresh from server
      try {
        await fetchProfile();
      } catch (err) {
        console.error("Login refresh failed", err);
      }
    },
    [fetchProfile]
  );

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed", err);
    }

    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
  }, []);

  // ── Refresh User ───────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      await fetchProfile();
    } catch {
      await logout();
    }
  }, [fetchProfile, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        authLoading,

        // helper flags
        isAdmin: role === "admin",
        isSuperAdmin: role === "superadmin",
        isAlumni: role === "alumni",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx)
    throw new Error(
      "useAuth must be used inside <AuthProvider>"
    );
  return ctx;
}