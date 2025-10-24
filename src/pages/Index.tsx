
import Layout from "@/components/Layout";
import VideoDownloader from "@/components/VideoDownloader";

const Index = () => {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center pt-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Free Video Downloader
          </div>
        </header>

        {/* Hero Section */}
        <div className="text-center space-y-8 py-8">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Download Videos from
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                YouTube
              </span>
            </h1>
            
            {/* Platform Logo */}
            <div className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border px-8 py-4 rounded-xl">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <span className="font-semibold text-lg text-foreground">YouTube</span>
              </div>
            </div>
          </div>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground/90 leading-relaxed">
            Fast, free, and unlimited video downloads with multiple format options.<br />
            <span className="text-base text-muted-foreground/70">No registration • Unlimited file size • MP4, WebM & MP3 • Batch downloads</span>
          </p>
        </div>

        {/* Main Downloader */}
        <VideoDownloader />
      </div>
    </Layout>
  );
};

export default Index;
