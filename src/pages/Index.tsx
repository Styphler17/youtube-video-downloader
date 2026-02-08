import Layout from "@/components/Layout";
import VideoDownloader from "@/components/VideoDownloader";
import { ModeToggle } from "@/components/mode-toggle";
import AdPlaceholder from "@/components/AdPlaceholder";

const Index = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative">
        {/* Theme Toggle - Fixed Bottom Right */}
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in delay-500">
          <div className="bg-card/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-border">
            <ModeToggle />
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 py-12 space-y-12">

          {/* Top Ad */}
          <div className="animate-fade-in">
            <AdPlaceholder slotName="Top Banner Ad" />
          </div>

          {/* Hero Section */}
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Online & Ready to Download
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              YouTube Downloader <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Fast & Effective
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
              Download YouTube videos in 4K, 1080p, and MP3 instantly. No registration, just pure speed.
            </p>
          </div>

          {/* Main Downloader */}
          <div className="animate-slide-up">
            <VideoDownloader />
          </div>

          {/* Middle Ad */}
          <div className="animate-slide-up">
            <AdPlaceholder slotName="Middle Responsive Ad" />
          </div>

          {/* SEO Content: How to Use */}
          <article className="prose dark:prose-invert max-w-none space-y-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <section className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                How to Download YouTube Videos
              </h2>
              <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                <li className="pl-2"><strong>Copy the URL:</strong> Go to YouTube, open the video you want to save, and copy its link from the address bar.</li>
                <li className="pl-2"><strong>Paste the Link:</strong> Return to YouTube Downloader and paste the URL into the input field above.</li>
                <li className="pl-2"><strong>Select Format:</strong> Choose your preferred quality (MP4 1080p, 4K, or MP3 audio).</li>
                <li className="pl-2"><strong>Download:</strong> Click the "Download" button and your file will start saving instantly.</li>
              </ol>
            </section>

            {/* SEO Content: Features */}
            <section className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-3">🚀 High-Speed 4K Downloader</h3>
                <p className="text-muted-foreground">
                  We use advanced servers to process videos at lightning speed. Download 4K and 8K videos without buffering or waiting.
                </p>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-3">🎵 YouTube to MP3 Converter</h3>
                <p className="text-muted-foreground">
                  Extract high-quality audio from any video. Perfect for creating playlists, podcasts, or offline listening.
                </p>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-3">🔒 Secure & Safe</h3>
                <p className="text-muted-foreground">
                  We prioritize your privacy. No registration required, no intrusive pop-ups, and no malware. 100% safe.
                </p>
              </div>
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-3">📱 Mobile Friendly</h3>
                <p className="text-muted-foreground">
                  Works seamlessly on iPhone, Android, tablets, and desktops. Save videos directly to your device.
                </p>
              </div>
            </section>

            {/* Bottom Ad */}
            <AdPlaceholder slotName="Bottom Ad Unit" />

            {/* SEO Content: FAQ */}
            <section className="glass-card p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Is this tool free to use?</h3>
                  <p className="text-muted-foreground">Yes, this YouTube Downloader is compatible with many devices. We rely on ads to keep the service free for everyone.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Can I download YouTube Shorts?</h3>
                  <p className="text-muted-foreground">Absolutely! We support YouTube Shorts, full-length videos, and live stream archives.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Where are videos saved?</h3>
                  <p className="text-muted-foreground">Videos are saved in your device's default "Downloads" folder unless you have changed your browser settings.</p>
                </div>
              </div>
            </section>
          </article>
        </main>
      </div>
    </Layout>
  );
};

export default Index;
