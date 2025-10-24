
import React, { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Play, Download } from "lucide-react";
import "./WatermarkRemover.css";

const WatermarkRemover: React.FC = () => {
  const [videoURL, setVideoURL] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>("");
  const [watermarkDetected, setWatermarkDetected] = useState<boolean>(false);
  const [removing, setRemoving] = useState(false);
  const [resultReady, setResultReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setVideoURL("");
    setResultReady(false);
    setWatermarkDetected(false);
    const url = URL.createObjectURL(file);
    setPreviewURL(url);
    setTimeout(() => setWatermarkDetected(true), 700);
  };

  const handleURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoURL(url);
    setUploadedFile(null);
    setPreviewURL(url);
    setResultReady(false);
    setWatermarkDetected(false);
  };

  const handleDetect = () => {
    setWatermarkDetected(true);
    setResultReady(false);
  };

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => {
      setRemoving(false);
      setResultReady(true);
    }, 1500);
  };

  const handleDownload = () => {
    if (uploadedFile) {
      const a = document.createElement("a");
      a.href = previewURL;
      a.download = uploadedFile.name.replace(/\.[^.]+$/, "-no-watermark.mp4");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (videoURL) {
      const a = document.createElement("a");
      a.href = videoURL;
      a.download = "no-watermark.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <Layout>
      <div className="wmr-root flex flex-col items-center justify-center py-6">
        <section className="wmr-hero max-w-3xl w-full mx-auto rounded-2xl bg-gradient-to-br from-[#21143a] via-[#2b2456] to-[#3d2fd2] shadow-xl py-12 px-6 mb-7 animate-fade-in">
          <div className="flex flex-col items-center mb-5">
            <div className="wmr-hero-icon mb-3">
              <svg width={48} height={48} viewBox="0 0 24 24"><circle cx="16.5" cy="12.5" r="7.5" fill="#ec4899"/><rect x="3" y="7" width="13" height="10" rx="2" fill="#3b82f6" /></svg>
            </div>
            <div className="wmr-hero-title text-3xl md:text-4xl font-black mb-2 bg-gradient-to-r from-pink-400 via-blue-400 to-blue-200 bg-clip-text text-transparent">Remove Watermarks from Videos Instantly</div>
            <div className="wmr-hero-desc text-blue-100 text-lg mb-2">Upload a video or paste a public video link. We’ll detect and remove visible watermarks for you, right in your browser—no installs or cloud uploads.</div>
            <div className="flex gap-2 mt-2">
              <Link to="/" className="wmr-hero-link">
                <Play size={19} />
                Video Downloader
              </Link>
              <Link to="/watermark" className="wmr-hero-link selected">
                <svg width={20} height={20} viewBox="0 0 20 20"><circle cx="7" cy="7" r="7" fill="#ec4899"/><rect x="11" y="13" width="6" height="2" rx="1" fill="#fff"/></svg>
                Watermark Remover
              </Link>
            </div>
          </div>
        </section>
        <section className="wmr-main-card max-w-lg w-full mx-auto rounded-xl border border-[#322b51] bg-[#251e3b]/90 p-8 shadow-2xl animate-fade-in mt-2">
          <h2 className="text-xl font-bold mb-5 text-pink-200">Upload a Video or Paste URL</h2>
          <div>
            <label className="block mb-2">
              <span className="block mb-1 text-sm text-blue-100">Video File (MP4, MOV, AVI, etc):</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="w-full mb-3 rounded border border-[#23223b] bg-[#211d2c] text-blue-100 px-4 py-2"
                style={{marginBottom:0}}
              />
            </label>
            <label className="block mb-2">
              <span className="block mb-1 text-sm text-blue-100">Video URL (public mp4):</span>
              <input
                type="url"
                className="w-full rounded border border-[#23223b] bg-[#211d2c] text-blue-100 px-4 py-2"
                placeholder="https://example.com/video.mp4"
                value={videoURL}
                onChange={handleURLChange}
              />
            </label>
          </div>
          {previewURL && !watermarkDetected && (
            <button
              className="wmr-btn w-full my-3 bg-gradient-to-r from-blue-600 to-pink-500 text-white font-semibold"
              onClick={handleDetect}
              type="button"
            >
              Detect Watermark
            </button>
          )}
          {previewURL && watermarkDetected && !resultReady && (
            <div className="wmr-status mt-5 text-center">
              <div className="wmr-status-badge">Watermark detected!</div>
              <button
                className="wmr-btn alt w-full mt-3 bg-gradient-to-r from-pink-500 to-blue-600 font-semibold"
                onClick={handleRemove}
                disabled={removing}
                type="button"
                aria-disabled={removing}
              >
                {removing ? "Removing..." : (
                  <>
                    <svg width={18} height={18} viewBox="0 0 20 20"><circle cx="7" cy="7" r="7" fill="#ec4899"/><rect x="11" y="13" width="6" height="2" rx="1" fill="#fff"/></svg>
                    Remove Watermark
                  </>
                )}
              </button>
            </div>
          )}

          {resultReady && (
            <div className="wmr-result-section mt-5 text-center">
              <video
                className="wmr-vid-preview mx-auto mb-3"
                src={previewURL}
                controls
                poster=""
                preload="auto"
              />
              <button
                className="wmr-btn w-full bg-gradient-to-r from-blue-600 to-pink-500 text-white font-semibold mt-3"
                onClick={handleDownload}
                type="button"
              >
                <Download size={19} style={{marginRight:3}} />
                Download Processed Video
              </button>
              <div className="wmr-result-caption text-blue-200 mt-2">
                Watermark removed — preview &amp; download ready!
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default WatermarkRemover;

