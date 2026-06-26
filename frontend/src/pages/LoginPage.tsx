import { useState } from "react";

import { motion } from "framer-motion";

import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

const BASE_URL = "http://localhost:8000";

export default function LoginPage() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] =
    useState({
      email: "",
      password: "",
    });

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

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
        `${BASE_URL}/user/login`,
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data =
        await response.json();

      // LOGIN FAILED
      if (!response.ok) {
        throw new Error(
          data.error||
            "Login failed"
        );
      }

      console.log(
        "LOGIN RESPONSE:",
        data
      );

      // SAVE TOKEN
      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      // SAVE USER
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setSuccess(
        "Login successful!"
      );

      // CLEAR FORM
      setFormData({
        email: "",
        password: "",
      });

      // REDIRECT
      setTimeout(() => {
        navigate("/home-page");
      }, 1200);

    } catch (err) {
      console.error(err);

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 text-white overflow-hidden">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute w-[400px] h-[400px] bg-[#00ff88]/10 blur-3xl rounded-full top-[-100px] left-[-100px]" />

      <div className="absolute w-[400px] h-[400px] bg-[#00ff88]/10 blur-3xl rounded-full bottom-[-100px] right-[-100px]" />

      <motion.div
        initial={{
          opacity: 0,
          y: 40,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="relative w-full max-w-md bg-[#121212]/90 backdrop-blur-xl border border-[#00ff88]/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(0,255,136,0.15)]"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#00ff88] mb-3">
            Welcome Back
          </h1>

          <p className="text-white/50 text-sm">
            Login to continue your
            coding journey
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mb-4 bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* SUCCESS */}
        {success && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="mb-4 bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-xl text-sm"
          >
            {success}
          </motion.div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="space-y-5"
        >
          {/* EMAIL */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Email
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-xl px-3 focus-within:border-[#00ff88] transition-all">
              <Mail
                size={18}
                className="text-[#00ff88]"
              />

              <input
                type="email"
                name="email"
                required
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none placeholder:text-white/20"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Password
            </label>

            <div className="flex items-center bg-black border border-[#00ff88]/20 rounded-xl px-3 focus-within:border-[#00ff88] transition-all">
              <Lock
                size={18}
                className="text-[#00ff88]"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                required
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-transparent p-3 outline-none placeholder:text-white/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="text-white/50 hover:text-[#00ff88] transition-all"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* REMEMBER + FORGOT */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-white/50 cursor-pointer">
              <input
                type="checkbox"
                className="accent-[#00ff88]"
              />

              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-[#00ff88] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <motion.button
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#00ff88] text-black rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
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

        {/* DIVIDER */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-white/10" />

          <span className="text-white/30 text-sm">
            OR
          </span>

          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* GOOGLE LOGIN */}
        <button className="w-full border border-white/10 hover:border-[#00ff88]/40 bg-white/5 hover:bg-white/10 transition-all py-3 rounded-xl font-medium">
          Continue with Google
        </button>

        {/* REGISTER */}
        <p className="text-center text-white/50 mt-6 text-sm">
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