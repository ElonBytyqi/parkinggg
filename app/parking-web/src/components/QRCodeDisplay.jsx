import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";

export default function QRCodeDisplay({ onClose }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const currentUrl = window.location.origin + window.location.pathname;
    setUrl(currentUrl);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">QR Code</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-8 rounded-3xl border border-violet-100">
            <QRCodeSVG value={url} size={180} />
          </div>

          <p className="text-gray-400 text-sm mt-6 text-center">
            Skeno këtë QR code për të hapur aplikacionin
          </p>

          <div className="mt-6 w-full">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-transparent text-gray-500 text-sm outline-none"
              />
              <button
                onClick={handleCopy}
                className="p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-xl transition"
              >
                {copied ? <Check size={18} className="text-teal-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <p className="text-gray-300 text-xs mt-5 text-center">
            Vizitorët do të shohin vetëm statusin (pa mundësi editimi)
          </p>
        </div>
      </div>
    </div>
  );
}
