import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const response = await fetch(
        "https://ai-interview-system-5gbg.onrender.com/user/forgotpassword",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong"
        );
      }

      setSuccess("OTP sent to your email");

      setTimeout(() => {
        navigate("/reset-password");
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
            Forgot Password
          </h1>

          <p className="text-white/50">
            Enter your registered email
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
          onSubmit={handleForgotPassword}
          className="space-y-5"
        >
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Email
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-lg px-3">
              <Mail
                size={18}
                className="text-[#00ff88]"
              />

              <input
                type="email"
                required
                placeholder="Enter email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
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
                Sending OTP...
              </>
            ) : (
              <>
                Send OTP
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}