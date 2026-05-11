import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();

    console.log("Register Data:", formData);

    // API CALL HERE

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#121212] border border-[#00ff88]/20 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,255,136,0.15)]"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00ff88] mb-2">
            Create Account
          </h1>

          <p className="text-white/50">
            Start your coding journey
          </p>
        </div>

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
            className="w-full py-3 bg-[#00ff88] text-black rounded-lg font-bold flex items-center justify-center gap-2"
          >
            Register
            <ArrowRight size={18} />
          </motion.button>
        </form>

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