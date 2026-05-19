import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Rocket,
  Brain,
  Code2,
  Users,
  X,
  ArrowRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Learning",
    description: "Learn with the help of advanced AI that adapts to your pace and style.",
  },
  {
    icon: Code2,
    title: "Interactive Coding",
    description: "Write, compile, and test code directly in your browser.",
  },
  {
    icon: Rocket,
    title: "Instant Feedback",
    description: "Get real-time feedback and suggestions as you code.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Modal and Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "join"
  
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem("display_name") || "";
  });
  const [userId] = useState(() => {
    let id = localStorage.getItem("user_id");
    if (!id) {
        id = "u-" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("user_id", id);
    }
    return id;
  });
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [roomIdInput, setRoomIdInput] = useState("");

  // Check for invite link on load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sharedRoomId = queryParams.get("room");
    
    if (sharedRoomId) {
      setRoomIdInput(sharedRoomId);
      setModalMode("join");
      setIsModalOpen(true);
    }
  }, [location]);
  if (modalMode === "create") {
  localStorage.setItem("room_creator", userName); // 👈 store creator
}

  const openModal = (mode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) return;

    // Set endpoint and body based on the mode
    const endpoint = modalMode === "create" 
      ? "http://localhost:8000/room/create" 
      : "http://localhost:8000/room/join";

const body =
  modalMode === "create"

    ? {
        language: selectedLanguage,
      }

    : {
        roomId: roomIdInput,
      };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Safe access to the Room ID from either response type
        const finalRoomId = data.room?.roomId || data.roomId || data.id || roomIdInput;

        if (finalRoomId) {
  localStorage.setItem("display_name", userName);

  // ✅ store creator PER ROOM
  if (modalMode === "create") {
    localStorage.setItem(`room_creator_${finalRoomId}`, userName);
  }

  navigate(`/code/${finalRoomId}`, {
    state: {
      name: userName,
      userId: userId,
      language: data.room?.language || selectedLanguage,
      joined: true,
    },
  });
}
      } else {
        alert(data.message || "Something went wrong. Please try again.");
        console.log("STATUS:", response.status);
console.log("DATA:", data);
      }
    } catch (err) {
      console.error("Navigation failed:", err);
      alert("Server connection failed.");
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-[#0a0a0a] text-white">
      {/* --- HERO SECTION --- */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center space-x-2 bg-[#00ff88]/10 text-[#00ff88] px-6 py-2 rounded-full mb-8"
          >
            <Sparkles className="w-5 h-5" />
            <span>The Future of Coding Education</span>
          </motion.div>

         <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00ff88] to-[#00ffff] mb-8 leading-[1.2] pb-4 transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(0,255,200,0.9)] hover:scale-105 py-6">
            Smart Coding Station
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto">
            Experience a revolutionary way to learn programming with our AI-powered platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* JOIN ROOM BUTTON */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal("join")}
              className="px-8 py-3 border border-[#00ff88] text-[#00ff88] rounded-lg flex items-center gap-2 bg-[#00ff88]/5"
            >
              <Users size={18} />
              Join Room
            </motion.button>

            {/* CREATE ROOM BUTTON */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal("create")}
              className="px-8 py-3 bg-[#00ff88] text-black font-semibold rounded-lg flex items-center gap-2"
            >
              <Sparkles size={18} />
              Create Room
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="p-6 rounded-lg border border-[#00ff88]/20 bg-black/50 hover:border-[#00ff88]/50 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-[#00ff88] mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MODAL COMPONENT --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#121212] border border-[#00ff88]/30 p-8 rounded-2xl shadow-[0_0_50px_-12px_rgba(0,255,136,0.3)]"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#00ff88]">
                  {modalMode === "create" ? "Create Workspace" : "Join Workspace"}
                </h2>
                <p className="text-sm text-white/50">
                  {modalMode === "create" 
                    ? "Set up a new room to start coding." 
                    : "Enter the Room ID and your name to join."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ROOM ID (Join Mode Only) */}
                {modalMode === "join" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                      Room ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 59c6f4"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value)}
                      className="w-full bg-black border border-[#00ff88]/20 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition-all"
                    />
                  </div>
                )}

             {modalMode === "create" && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                      Select Language
                    </label>
                    <select
                      required
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-black border border-[#00ff88]/20 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition-all cursor-pointer"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="c++">C++</option>
                      <option value="c">C</option>
                      <option value="csharp">C#</option>
                      <option value="typescript">TypeScript</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                      <option value="kotlin">Kotlin</option>
                      <option value="swift">Swift</option>
                      <option value="php">PHP</option>
                      <option value="ruby">Ruby</option>
                      <option value="scala">Scala</option>
                      <option value="dart">Dart</option>
                      <option value="r">R</option>
                      <option value="matlab">MATLAB</option>
                      <option value="sql">SQL</option>
                      <option value="bash">Bash</option>
                      <option value="perl">Perl</option>
                      <option value="haskell">Haskell</option>
                      <option value="html">HTML/CSS</option>
                    </select>
                  </div>
                )}
                {/* DISPLAY NAME (Both Modes) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                    User Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-black border border-[#00ff88]/20 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ff88] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#00ff88] text-black font-bold rounded-lg hover:bg-[#00cc6e] transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {modalMode === "create" ? "Create Room" : "Join Room"}
                  <Rocket size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}