import { useState } from "react";

import { motion } from "framer-motion";

import {
  Lock,
  KeyRound,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    otp: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(
        "https://ai-interview-system-5gbg.onrender.com/user/resetpasssword",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            otp: formData.otp,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Reset failed"
        );
      }

      setSuccess("Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

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
        className="w-full max-w-md bg-[#121212] border border-[#00ff88]/20 rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00ff88] mb-2">
            Reset Password
          </h1>

          <p className="text-white/50">
            Enter OTP and new password
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form
          onSubmit={handleResetPassword}
          className="space-y-5"
        >
          {/* OTP */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              OTP
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <KeyRound
                size={18}
                className="text-[#00ff88]"
              />

              <input
                type="text"
                name="otp"
                required
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              New Password
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <Lock
                size={18}
                className="text-[#00ff88]"
              />

              <input
                type="password"
                name="password"
                required
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00ff88] text-black rounded-lg font-bold flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Resetting...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}