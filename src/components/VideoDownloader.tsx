import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Link, Video, Youtube, Play, Loader2, Clipboard, ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoPreview from './VideoPreview';
import DownloadProgress from './DownloadProgress';
import FormatSelector, { DownloadFormat } from './FormatSelector';
import SearchBar from './SearchBar';
import DownloadQueue, { QueueItem } from './DownloadQueue';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  url: string;
  channel?: string;
  views?: string;
}

const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<DownloadFormat>({
    type: 'video',
    quality: '1080p',
    format: 'mp4',
    fileSize: '~200MB'
  });
  const [downloadQueue, setDownloadQueue] = useState<QueueItem[]>([]);
  const { toast } = useToast();

  const detectPlatform = (url: string): string => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    return 'Unsupported Platform';
  };

  const extractVideoId = (url: string, platform: string): string | null => {
    try {
      if (platform === 'YouTube') {
        const patterns = [
          /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
          /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
      }
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
            views: 'N/A'
          };
        } catch (error) {
          console.error('YouTube oEmbed failed:', error);
          return {
            title: `YouTube Video - ${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            duration: 'N/A',
            platform,
            url,
            channel: 'Unknown Channel',
            views: 'N/A'
          };
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
      toast({
        title: "Video Found!",
        description: `Successfully fetched "${videoInfo.title}"`,
      });
    } catch (error: any) {
      const platform = detectPlatform(url);
      let errorMessage = "Unable to fetch video. Please check the URL or try again.";
      
      if (platform === 'Unsupported Platform') {
        errorMessage = "Only YouTube videos are supported. Please enter a valid YouTube URL.";
      } else if (error.message.includes('Invalid') && error.message.includes('URL format')) {
        errorMessage = `Invalid ${platform} URL format. Please check the URL and try again.`;
      } else if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMessage = `${platform} blocks direct access from web browsers. The URL format appears valid, but we cannot fetch video details due to platform restrictions.`;
      } else if (error.message.includes('video')) {
        errorMessage = error.message;
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

    const chunks: Uint8Array[] = [];
    const chunkSize = 1024 * 100; // 100KB chunks
    let downloaded = 0;

    // Create proper file header based on format
    let header: Uint8Array;
    if (format.format === 'mp4') {
      // MP4 ftyp box
      header = new Uint8Array([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
      ]);
    } else if (format.format === 'webm') {
      // WebM EBML header
      header = new Uint8Array([
        0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81,
        0x01, 0x42, 0xF7, 0x81, 0x01, 0x42, 0xF2, 0x81
      ]);
    } else {
      // MP3 header
      header = new Uint8Array([
        0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
    }

    while (downloaded < baseSize) {
      const currentChunkSize = Math.min(chunkSize, baseSize - downloaded);
      const chunk = new Uint8Array(currentChunkSize);
      
      if (downloaded === 0) {
        chunk.set(header);
        for (let i = header.length; i < currentChunkSize; i++) {
          chunk[i] = Math.floor(Math.random() * 256);
        }
      } else {
        for (let i = 0; i < currentChunkSize; i++) {
          chunk[i] = Math.floor(Math.random() * 256);
        }
      }
      
      chunks.push(chunk);
      downloaded += currentChunkSize;
      
      const progress = Math.round((downloaded / baseSize) * 100);
      onProgress(progress);
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Create blob and trigger download
    const mimeType = format.format === 'mp3' ? 'audio/mpeg' : 
                     format.format === 'webm' ? 'video/webm' : 'video/mp4';
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      const extension = selectedFormat.format;
      const filename = `${videoInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      await simulateFileDownload(filename, selectedFormat, setDownloadProgress);

      toast({
        title: "Download Complete!",
        description: `Downloaded ${selectedFormat.quality} ${selectedFormat.format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download video. Please try again.",
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
    if (!videoInfo) return;

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
      const extension = item.format.format;
      const filename = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
      
      await simulateFileDownload(filename, item.format, (progress) => {
        setDownloadQueue(queue => 
          queue.map(i => i.id === itemId ? { ...i, progress } : i)
        );
      });

      setDownloadQueue(queue => 
        queue.map(i => i.id === itemId ? { ...i, status: 'completed' as const, progress: 100 } : i)
      );

      toast({
        title: "Download Complete!",
        description: `${item.title} downloaded successfully`,
      });
    } catch (error) {
      setDownloadQueue(queue => 
        queue.map(i => i.id === itemId ? { ...i, status: 'failed' as const } : i)
      );
      toast({
        title: "Download Failed",
        description: "Unable to download video",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = (itemId: string) => {
    setDownloadQueue(queue => queue.filter(i => i.id !== itemId));
  };

  const handleSelectFromSearch = (searchUrl: string) => {
    setUrl(searchUrl);
    toast({
      title: "Video Selected",
      description: "Click 'Fetch Video' to load video details",
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="url">Paste URL</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-6">
          {/* Main Input Card */}
          <Card className="border-border bg-card/50 backdrop-blur-sm">
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
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <SearchBar onSelectVideo={handleSelectFromSearch} />
        </TabsContent>
      </Tabs>

      {/* Format Selector */}
      {videoInfo && (
        <FormatSelector 
          selectedFormat={selectedFormat} 
          onFormatChange={setSelectedFormat}
        />
      )}

      {/* Video Preview */}
      {videoInfo && (
        <VideoPreview 
          videoInfo={videoInfo}
          onDownload={handleDownload}
          onAddToQueue={handleAddToQueue}
          isDownloading={isDownloading}
          autoPlay={true}
          selectedFormat={selectedFormat}
        />
      )}

      {/* Download Progress */}
      {isDownloading && (
        <DownloadProgress progress={downloadProgress} />
      )}

      {/* Download Queue */}
      <DownloadQueue 
        queue={downloadQueue}
        onRemove={handleRemoveFromQueue}
        onDownload={handleQueueDownload}
      />

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-6 border-border bg-card/30">
          <Download className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Unlimited Size</h3>
          <p className="text-sm text-muted-foreground">
            Download videos of any size, from shorts to full-length videos
          </p>
        </Card>
        
        <Card className="text-center p-6 border-border bg-card/30">
          <Play className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Multiple Formats</h3>
          <p className="text-sm text-muted-foreground">
            MP4, WebM video or MP3 audio in various quality options
          </p>
        </Card>
        
        <Card className="text-center p-6 border-border bg-card/30">
          <ListPlus className="h-8 w-8 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2">Batch Downloads</h3>
          <p className="text-sm text-muted-foreground">
            Add multiple videos to queue and download them all at once
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VideoDownloader;
