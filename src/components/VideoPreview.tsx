import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Clock, Eye, Loader2, ListPlus, User, PlayCircle } from 'lucide-react';
import VideoModal from './VideoModal';
import { DownloadFormat } from './FormatSelector';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  url: string;
  channel?: string;
  views?: string;
}

interface VideoPreviewProps {
  videoInfo: VideoInfo;
  onDownload: () => void;
  onAddToQueue: () => void;
  isDownloading: boolean;
  autoPlay?: boolean;
  selectedFormat: DownloadFormat;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  videoInfo, 
  onDownload,
  onAddToQueue,
  isDownloading,
  autoPlay = false,
  selectedFormat
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handlePreview = () => {
    setIsModalOpen(true);
  };

  const getPreviewVideoUrl = (url: string, platform: string): string | null => {
    if (platform === 'YouTube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        // Return direct embed URL without autoplay to avoid consent issues
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
      }
    }
    return null;
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback if autoplay fails
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const previewVideoUrl = getPreviewVideoUrl(videoInfo.url, videoInfo.platform);
  return (
    <>
      <Card className="border-border bg-card/50 backdrop-blur-sm animate-slide-up">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Video Preview */}
            <div className="relative md:w-80 w-full">
              <div 
                className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer relative group"
                onClick={handlePreview}
              >
                {previewVideoUrl ? (
                  <div className="w-full h-full relative">
                    <iframe
                      src={previewVideoUrl}
                      className="w-full h-full"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${videoInfo.title} - Preview`}
                    />
                    {/* Overlay for better UX */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="absolute bottom-4 right-4">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          Click to expand
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <img 
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary" className="bg-black/70 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {videoInfo.duration}
                </Badge>
              </div>
            </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary text-primary">
                  {videoInfo.platform}
                </Badge>
                <Badge variant="secondary">
                  {selectedFormat.quality} {selectedFormat.format.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold leading-tight mb-2">
                {videoInfo.title}
              </h3>
              
              {/* Enhanced video details */}
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                {videoInfo.channel && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{videoInfo.channel}</span>
                  </div>
                )}
                {videoInfo.views && videoInfo.views !== 'N/A' && (
                  <div className="flex items-center gap-1">
                    <PlayCircle className="h-3 w-3" />
                    <span>{videoInfo.views}</span>
                  </div>
                )}
                {videoInfo.duration !== 'N/A' && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{videoInfo.duration}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                Ready to download • {selectedFormat.type === 'audio' ? 'Audio Only' : 'Full Video'} • Estimated size: {selectedFormat.fileSize}
              </p>
            </div>

            {/* Download Options */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={onDownload}
                  disabled={isDownloading}
                  className="bg-gradient-primary hover:opacity-90 transition-opacity"
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isDownloading ? 'Downloading...' : 'Download Now'}
                </Button>

                <Button 
                  variant="outline"
                  onClick={onAddToQueue}
                  disabled={isDownloading}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add to Queue
                </Button>
                
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• Free & unlimited downloads • No registration required</p>
                <p>• Multiple formats: MP4, WebM, MP3 • All quality options</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <VideoModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      videoInfo={videoInfo}
      onDownload={onDownload}
      isDownloading={isDownloading}
    />
    </>
  );
};

export default VideoPreview;