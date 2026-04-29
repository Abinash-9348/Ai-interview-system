import { useState } from "react";
import { Send } from "lucide-react";

export default function ChatBox() {
  const [messages, setMessages] = useState([
    { user: "Peer_Dev", text: "Hey check line 25" },
    { user: "You", text: "Fixing now!" }
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([...messages, { user: "You", text: input }]);
    setInput("");
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl h-full flex flex-col">
      <div className="p-4 border-b border-white/10 text-[#00ff88] font-bold">
        Live Chat
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, i) => (
          <div key={i}>
            <p className="text-xs text-[#00ff88]">{msg.user}</p>
            <p className="bg-white/5 p-2 rounded">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type Message..."
          className="flex-1 bg-black/30 p-2 rounded-lg outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-[#00ff88] text-black p-2 rounded-lg"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}