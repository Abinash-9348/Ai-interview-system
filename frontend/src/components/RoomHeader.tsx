import { Users, Share2, ShieldCheck } from "lucide-react";

export default function RoomHeader({ roomId }: any) {
  return (
    <div className="flex justify-between items-center mb-8 bg-white/5 p-6 rounded-2xl border border-white/10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#00ff88]/10 rounded-xl">
          <Users className="w-6 h-6 text-[#00ff88]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              Room:
              <span className="text-[#00ff88] ml-2">
                {roomId || "Global"}
              </span>
            </h1>

            <button
              onClick={() =>
                navigator.clipboard.writeText(window.location.href)
              }
            >
              <Share2 size={16} />
            </button>
          </div>

          <p className="text-xs flex items-center gap-1 text-white/40">
            <ShieldCheck size={12} className="text-[#00ff88]" />
            Secure Session
          </p>
        </div>
      </div>
    </div>
  );
}