import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Link, Video, Youtube, Play, Loader2, Clipboard, ListPlus, Shield, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VideoPreview from './VideoPreview';
import DownloadProgress from './DownloadProgress';
import FormatSelector, { DownloadFormat } from './FormatSelector';
import DownloadQueue, { QueueItem } from './DownloadQueue';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  url: string;
  channel?: string;
  views?: string;
  formats: DownloadFormat[];
}

interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
}

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat | null>(null);
  const [downloadQueue, setDownloadQueue] = useState<QueueItem[]>([]);
  const { toast } = useToast();

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('yt_downloader_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addToHistory = (url: string, title: string) => {
    setHistory(prev => {
      // Remove existing entry for this URL to move it to the top
      const filtered = prev.filter(item => item.url !== url);
      const newItem = { url, title, timestamp: Date.now() };
      const newHistory = [newItem, ...filtered].slice(0, 5); // Keep top 5
      localStorage.setItem('yt_downloader_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const detectPlatform = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Unsupported Platform';
  };

  const extractVideoId = (url: string, platform: string): string | null => {
    console.log(`Attempting to extract ID from URL: ${url} (Platform: ${platform})`);
    try {
      if (platform === 'YouTube') {
        try {
          const parsedUrl = new URL(url);
          const hostname = parsedUrl.hostname;
          console.log(`Parsed hostname: ${hostname}, pathname: ${parsedUrl.pathname}`);

          if (hostname.includes('youtube.com')) {
            if (parsedUrl.pathname === '/watch') {
              const v = parsedUrl.searchParams.get('v');
              if (v) return v;
            } else if (parsedUrl.pathname.startsWith('/embed/')) {
              return parsedUrl.pathname.split('/')[2];
            } else if (parsedUrl.pathname.startsWith('/v/')) {
              return parsedUrl.pathname.split('/')[2];
            } else if (parsedUrl.pathname.startsWith('/shorts/')) {
              return parsedUrl.pathname.split('/')[2];
            }
          } else if (hostname === 'youtu.be') {
            return parsedUrl.pathname.substring(1);
          }
        } catch (e) {
          console.warn('URL parsing failed, falling back to regex:', e);
        }

        const patterns = [
          /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
          /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            console.log(`Regex match found: ${match[1]}`);
            return match[1];
          }
        }
      }
      console.warn('No ID extracted from URL');
      return null;
    } catch (error) {
      console.error('Error in extractVideoId:', error);
      return null;
    }
  };

  const fetchVideoMetadata = async (url: string, platform: string): Promise<VideoInfo | null> => {
    try {
      if (platform === 'YouTube') {
        const videoId = extractVideoId(url, platform);
        if (!videoId) throw new Error('Invalid YouTube URL');

        try {
          // Use backend API instead of oEmbed
          const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
          const response = await fetch(`${backendUrl}/api/video-info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Prefer detailed error message from backend (e.g. ytdl error)
            throw new Error(errorData.details || errorData.error || 'Failed to fetch video data');
          }

          const data = await response.json();

          // Map backend formats to frontend DownloadFormat
          const formats: DownloadFormat[] = data.formats.map((f: any) => ({
            type: f.hasVideo ? 'video' : 'audio',
            quality: f.quality,
            format: f.format,
            fileSize: f.fileSize || 'N/A' // Use backend size if available
          }));

          return {
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            platform,
            url,
            channel: data.channel,
            views: data.views,
            formats
          };
        } catch (error) {
          console.error('Backend API failed:', error);
          // Fallback to oEmbed if backend is unavailable
          try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (!response.ok) throw new Error('Failed to fetch video data');

            const data = await response.json();
            return {
              title: data.title,
              thumbnail: data.thumbnail_url,
              duration: 'N/A',
              platform,
              url,
              channel: data.author_name,
              views: 'N/A',
              formats: [] // No formats available in fallback
            };
          } catch (fallbackError) {
            console.error('Fallback oEmbed also failed:', fallbackError);
            return {
              title: `YouTube Video - ${videoId}`,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              duration: 'N/A',
              platform,
              url,
              channel: 'Unknown Channel',
              views: 'N/A',
              formats: []
            };
          }
        }
      }

      throw new Error(`Platform "${platform}" is not supported. Only YouTube is supported.`);
    } catch (error) {
      console.error('Error fetching video metadata:', error);
      throw error;
    }
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleFetchVideo = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid video URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setVideoInfo(null);

    try {
      const platform = detectPlatform(url);
      const videoInfo = await fetchVideoMetadata(url, platform);

      if (!videoInfo) {
        throw new Error('Unable to fetch video information');
      }

      setVideoInfo(videoInfo);
      addToHistory(videoInfo.url, videoInfo.title);

      if (videoInfo.formats.length > 0) {
        // ... selection logic ...
        // Log debug info
        console.log('Video Info Debug:', data.debug);
        toast({
          title: "Video Found!",
          description: `Fetched via ${data.debug?.usedClient || 'WEB'} (${data.debug?.totalFormatsFound} formats)`,
        });
      } else {
        // No formats found - throw error to be caught below
        throw new Error("Video found, but no downloadable formats are available. This might be due to server restrictions.");
      }
    } catch (error: unknown) {
      const platform = detectPlatform(url);
      let errorMessage = "Unable to fetch video. Please check the URL or try again.";

      if (platform === 'Unsupported Platform') {
        errorMessage = "Only YouTube videos are supported. Please enter a valid YouTube URL.";
      } else if (error instanceof Error) {
        if (error.message.includes('Invalid') && error.message.includes('URL format')) {
          errorMessage = `Invalid ${platform} URL format. Please check the URL and try again.`;
        } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
          errorMessage = `${platform} blocks direct access from web browsers. The URL format appears valid, but we cannot fetch video details due to platform restrictions.`;
        } else if (error.message.includes('video')) {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Fetch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateFileDownload = async (
    filename: string,
    format: DownloadFormat,
    onProgress: (progress: number) => void
  ) => {
    // Calculate file size based on format (no limits!)
    let baseSize = 1024 * 1024; // 1MB base

    if (format.type === 'video') {
      switch (format.quality) {
        case '2160p': baseSize *= 500; break; // ~500MB
        case '1080p': baseSize *= 200; break; // ~200MB
        case '720p': baseSize *= 100; break;  // ~100MB
        case '480p': baseSize *= 50; break;   // ~50MB
        case '360p': baseSize *= 30; break;   // ~30MB
      }
    } else {
      // Audio
      switch (format.quality) {
        case '320kbps': baseSize *= 8; break; // ~8MB
        case '256kbps': baseSize *= 6; break; // ~6MB
        case '128kbps': baseSize *= 3; break; // ~3MB
      }
    }

    // This function is no longer used - downloads are handled by backend
    throw new Error('This function is deprecated. Use backend download instead.');
  };

  const handleDownload = async () => {
    if (!videoInfo || !selectedFormat) return;

    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      // Extract video ID for backend API
      const videoId = extractVideoId(videoInfo.url, 'YouTube');
      if (!videoId) throw new Error('Invalid video URL');

      // Get format itag from backend formats list we already have
      // We need to re-find it in the original data to get the itag if we didn't store it in DownloadFormat
      // But wait, the backend download endpoint needs `itag`.
      // The current DownloadFormat interface doesn't have `itag`.
      // We should probably rely on quality+format matching as before, but since we KNOW it exists in `videoInfo.formats`,
      // we can just pass the quality and format to the backend and let it find the itag, OR 
      // we can fetch the info again (redundant but safe) OR
      // we can assume the backend will handle the `format` and `quality` query params if we updated it?
      // No, looking at server.js (from memory), it expects `itag`.

      // Let's re-fetch to get the itag OR we could have stored it in videoInfo.formats.
      // Since I didn't update DownloadFormat to include itag (it's UI focused), let's refetch logic BUT
      // we know it SHOULD succeed now because we only let user select available formats.

      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const infoResponse = await fetch(`${backendUrl}/api/video-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoInfo.url }),
      });

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to get video formats');
      }

      const infoData = await infoResponse.json();
      const selectedBackendFormat = infoData.formats.find(
        (f: { quality: string; format: string }) => f.quality === selectedFormat.quality && f.format === selectedFormat.format
      );

      if (!selectedBackendFormat) throw new Error('Selected format not available');

      // Start download with progress tracking
      const downloadUrl = `${backendUrl}/api/download?videoId=${videoId}&itag=${selectedBackendFormat.itag}&title=${encodeURIComponent(videoInfo.title)}&format=${selectedFormat.format}`;

      // Use fetch to download with progress
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Unable to read response');

      const chunks: ArrayBuffer[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value.buffer);
        receivedLength += value.length;

        if (contentLength > 0) {
          const progress = Math.round((receivedLength / contentLength) * 100);
          setDownloadProgress(progress);
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${selectedFormat.format}`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Complete!",
        description: `Downloaded ${selectedFormat.quality} ${selectedFormat.format.toUpperCase()}`,
      });
    } catch (error: unknown) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unable to download video. Please try again.";
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  };

  const handleAddToQueue = () => {
    if (!videoInfo || !selectedFormat) return;

    const newItem: QueueItem = {
      id: Date.now().toString(),
      url: videoInfo.url,
      title: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      format: selectedFormat,
      status: 'pending',
      progress: 0
    };

    setDownloadQueue([...downloadQueue, newItem]);
    toast({
      title: "Added to Queue",
      description: `${videoInfo.title} added to download queue`,
    });
  };

  const handleQueueDownload = async (itemId: string) => {
    const item = downloadQueue.find(i => i.id === itemId);
    if (!item) return;

    setDownloadQueue(queue =>
      queue.map(i => i.id === itemId ? { ...i, status: 'downloading' as const } : i)
    );

    try {
      // Extract video ID for backend API
      const videoId = extractVideoId(item.url, 'YouTube');
      if (!videoId) throw new Error('Invalid video URL');

      // Get format itag from backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');
      const infoResponse = await fetch(`${backendUrl}/api/video-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: item.url }),
      });

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to get video formats');
      }

      const infoData = await infoResponse.json();
      const selectedBackendFormat = infoData.formats.find(
        (f: { quality: string; format: string }) => f.quality === item.format.quality && f.format === item.format.format
      );

      if (!selectedBackendFormat) throw new Error('Selected format not available');

      // Start download
      const downloadUrl = `${backendUrl}/api/download?videoId=${videoId}&itag=${selectedBackendFormat.itag}&title=${encodeURIComponent(item.title)}&format=${item.format.format}`;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Unable to read response');

      const chunks: ArrayBuffer[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value.buffer);
        receivedLength += value.length;

        if (contentLength > 0) {
          const progress = Math.round((receivedLength / contentLength) * 100);
          setDownloadQueue(queue =>
            queue.map(i => i.id === itemId ? { ...i, progress } : i)
          );
        }
      }

      // Create blob and trigger download
      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${item.format.format}`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadQueue(queue =>
        queue.map(i => i.id === itemId ? { ...i, status: 'completed' as const, progress: 100 } : i)
      );

      toast({
        title: "Download Complete!",
        description: `${item.title} downloaded successfully`,
      });
    } catch (error: unknown) {
      setDownloadQueue(queue =>
        queue.map(i => i.id === itemId ? { ...i, status: 'failed' as const } : i)
      );
      const errorMessage = error instanceof Error ? error.message : "Unable to download video";
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = (itemId: string) => {
    setDownloadQueue(queue => queue.filter(i => i.id !== itemId));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Main Input Card */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Video className="h-6 w-6 text-primary" />
            Video Downloader
          </CardTitle>
          <p className="text-muted-foreground">
            Paste any YouTube video URL
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 pr-10 bg-background/50"
                onKeyPress={(e) => e.key === 'Enter' && handleFetchVideo()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setUrl(text);
                    toast({
                      title: "Pasted!",
                      description: "URL pasted from clipboard",
                    });
                  } catch (err) {
                    toast({
                      title: "Paste Failed",
                      description: "Could not access clipboard",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleFetchVideo}
              disabled={isLoading}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Fetching...' : 'Fetch Video'}
            </Button>
          </div>

          {/* Supported Platforms */}
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
            <span>Supports:</span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                <Youtube className="h-3 w-3" /> YouTube
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent History */}
      {
        history.length > 0 && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
              <History className="h-4 w-4" />
              <span>Recent Links</span>
            </div>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <button
                  key={item.timestamp}
                  onClick={() => {
                    setUrl(item.url);
                    handleFetchVideo();
                  }}
                  className="text-left p-3 rounded-lg border bg-card/50 hover:bg-card hover:border-primary/50 transition-all group"
                >
                  <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate opacity-70">
                    {item.url}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      }

      {/* Format Selector */}
      {
        videoInfo && selectedFormat && (
          <FormatSelector
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
            availableFormats={videoInfo.formats}
          />
        )
      }

      {/* Video Preview */}
      {
        videoInfo && selectedFormat && (
          <VideoPreview
            videoInfo={videoInfo}
            onDownload={handleDownload}
            onAddToQueue={handleAddToQueue}
            isDownloading={isDownloading}
            autoPlay={true}
            selectedFormat={selectedFormat}
          />
        )
      }

      {/* Download Progress */}
      {
        isDownloading && (
          <DownloadProgress progress={downloadProgress} />
        )
      }

      {/* Download Queue */}
      <DownloadQueue
        queue={downloadQueue}
        onRemove={handleRemoveFromQueue}
        onDownload={handleQueueDownload}
      />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <Card className="text-center p-6 glass-card hover:bg-card/80 transition-colors">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Download className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Unlimited Size</h3>
          <p className="text-sm text-muted-foreground">
            Download videos of any size, from shorts to full-length videos
          </p>
        </Card>

        <Card className="text-center p-6 glass-card hover:bg-card/80 transition-colors">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Play className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Multiple Formats</h3>
          <p className="text-sm text-muted-foreground">
            MP4, WebM video or MP3 audio in various quality options
          </p>
        </Card>

        <Card className="text-center p-6 glass-card hover:bg-card/80 transition-colors">
          <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mb-2">Secure & Safe</h3>
          <p className="text-sm text-muted-foreground">
            We prioritize your privacy. No registration required and 100% safe to use.
          </p>
        </Card>
      </div>
    </div >
  );
};

export default VideoDownloader;
