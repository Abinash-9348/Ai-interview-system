import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // HANDLE INPUT CHANGE
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // LOGIN API
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:8000/user/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      // IF LOGIN FAILED
      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      console.log("LOGIN RESPONSE:", data);

      // SAVE TOKEN (IF BACKEND SENDS TOKEN)
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // SAVE USER (OPTIONAL)
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setSuccess("Login successful!");

      // CLEAR FORM
      setFormData({
        email: "",
        password: "",
      });

      // REDIRECT
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (err) {
      console.error(err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] border border-[#00ff88]/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,255,136,0.15)]"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00ff88] mb-2">
            Welcome Back
          </h1>

          <p className="text-white/50">
            Login to continue coding
          </p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* EMAIL */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Email
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <Mail size={18} className="text-[#00ff88]" />

              <input
                type="email"
                name="email"
                required
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Password
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <Lock size={18} className="text-[#00ff88]" />

              <input
                type="password"
                name="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          {/* BUTTON */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00ff88] text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Logging in...
              </>
            ) : (
              <>
                Login
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* REGISTER LINK */}
        <p className="text-center text-white/50 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-[#00ff88] hover:underline"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}