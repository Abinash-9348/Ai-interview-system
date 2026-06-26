import { useState } from "react";
import {
  Upload,
  X,
  Loader2,
} from "lucide-react";

import toast from "react-hot-toast";

interface JDUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (jdData: any) => void;
}

export default function JDUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: JDUploadModalProps) {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("jd", selectedFile);

      const response = await fetch(
        "https://ai-interview-system-5gbg.onrender.com/jd/upload",
        {
          method: "POST",
          body: formData,
          credentials:"include"
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "JD Uploaded Successfully"
        );

        if (onUploadSuccess) {
          onUploadSuccess(data.data);
        }

        onClose();
      } else {
        toast.error(
          data.message || "Upload failed"
        );
      }
    } catch (err) {
      console.error(err);

      toast.error("Server Error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#00ff88]/20 bg-[#111] p-6 relative">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={22} />
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-bold text-[#00ff88] mb-2">
          Upload JD
        </h2>

        <p className="text-white/40 text-sm mb-6">
          Upload Job Description PDF file
        </p>

        {/* FILE INPUT */}
        <div className="mb-6">
          <label className="block text-sm mb-2 text-white/70">
            File Name
          </label>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setSelectedFile(
                e.target.files?.[0] || null
              )
            }
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white
            file:mr-4
            file:px-4
            file:py-2
            file:border-0
            file:rounded-lg
            file:bg-[#00ff88]
            file:text-black"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="px-5 py-2 rounded-xl bg-[#00ff88] text-black font-semibold hover:bg-[#00cc6e] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}