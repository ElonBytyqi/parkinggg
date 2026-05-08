import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";

export default function LoginModal({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">Admin Login</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition"
              placeholder="Shkruaj username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 transition"
              placeholder="Shkruaj password"
            />
          </div>

          {error && (
            <div className="text-rose-400 text-sm bg-rose-50 px-5 py-4 rounded-2xl border border-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-4 rounded-2xl transition shadow-lg shadow-teal-100"
          >
            Hyr
          </button>
        </form>

        <p className="text-gray-300 text-sm text-center mt-8">
          Demo: <span className="font-medium text-gray-400">admin</span> / <span className="font-medium text-gray-400">admin123</span>
        </p>
      </div>
    </div>
  );
}
