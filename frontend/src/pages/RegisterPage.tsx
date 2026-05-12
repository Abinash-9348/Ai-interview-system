import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
// import axios from "axios";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
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

  // REGISTER API
  const handleRegister = async (e) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  try {
    setLoading(true);

    const response = await fetch(
      "http://localhost:8000/user/create",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      }
    );

    const data = await response.json();

    // IF API FAILED
    if (!response.ok) {
      throw new Error(
        data.message || "Registration failed"
      );
    }

    console.log("REGISTER RESPONSE:", data);

    setSuccess("Account created successfully!");

    // CLEAR FORM
    setFormData({
      name: "",
      email: "",
      password: "",
    });

    // REDIRECT
    setTimeout(() => {
      navigate("/login");
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
            Create Account
          </h1>

          <p className="text-white/50">
            Start your coding journey
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
        <form onSubmit={handleRegister} className="space-y-5">
          {/* NAME */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Name
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <User size={18} className="text-[#00ff88]" />

              <input
                type="text"
                name="name"
                required
                placeholder="Enter name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </div>

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
                <Loader2 size={18} className="animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Register
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* LOGIN LINK */}
        <p className="text-center text-white/50 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#00ff88] hover:underline"
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}