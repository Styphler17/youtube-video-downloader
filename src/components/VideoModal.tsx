import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, Loader2 } from 'lucide-react';

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  platform: string;
  url: string;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoInfo: VideoInfo;
  onDownload: () => void;
  isDownloading: boolean;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoInfo,
  onDownload,
  isDownloading
}) => {
  const getEmbedUrl = (url: string, platform: string): string => {
    if (platform === 'YouTube') {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&fs=1`;
      }
    }
    
    if (platform === 'Vimeo') {
      const videoId = url.match(/vimeo\.com\/(?:.*\/)?(\d+)/)?.[1];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoInfo.url, videoInfo.platform);
  const canEmbed = videoInfo.platform === 'YouTube' || videoInfo.platform === 'Vimeo';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold pr-8">
              {videoInfo.title}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
            {canEmbed ? (
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <div className="text-center space-y-4">
                  <img 
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="max-w-full max-h-full object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <p className="text-muted-foreground">
                    Preview not available for {videoInfo.platform}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(videoInfo.url, '_blank')}
                  >
                    View on {videoInfo.platform}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {videoInfo.platform} • {videoInfo.duration}
            </div>
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
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;