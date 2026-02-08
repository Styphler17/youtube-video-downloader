import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Video, Music, FileVideo } from 'lucide-react';

export interface DownloadFormat {
  type: 'video' | 'audio';
  quality: string;
  format: string;
  fileSize?: string;
}

interface FormatSelectorProps {
  selectedFormat: DownloadFormat;
  onFormatChange: (format: DownloadFormat) => void;
  availableFormats?: DownloadFormat[];
}

const FormatSelector: React.FC<FormatSelectorProps> = ({ selectedFormat, onFormatChange, availableFormats }) => {
  // If availableFormats is provided, use it to filter/generate options
  // Otherwise fall back to defaults (though in this app we should always have them)

  const videoFormats = availableFormats
    ? availableFormats.filter(f => f.type === 'video' && f.format === 'mp4')
    : [
      { type: 'video', quality: '2160p', format: 'mp4', fileSize: '~500MB' },
      { type: 'video', quality: '1080p', format: 'mp4', fileSize: '~200MB' },
      { type: 'video', quality: '720p', format: 'mp4', fileSize: '~100MB' },
      { type: 'video', quality: '480p', format: 'mp4', fileSize: '~50MB' },
      { type: 'video', quality: '360p', format: 'mp4', fileSize: '~30MB' },
    ] as DownloadFormat[];

  const audioFormats = availableFormats
    ? availableFormats.filter(f => f.type === 'audio')
    : [
      { type: 'audio', quality: '320kbps', format: 'mp3', fileSize: '~8MB' },
      { type: 'audio', quality: '256kbps', format: 'mp3', fileSize: '~6MB' },
      { type: 'audio', quality: '128kbps', format: 'mp3', fileSize: '~3MB' },
    ] as DownloadFormat[];

  const webmFormats = availableFormats
    ? availableFormats.filter(f => f.type === 'video' && f.format === 'webm')
    : [
      { type: 'video', quality: '1080p', format: 'webm', fileSize: '~180MB' },
      { type: 'video', quality: '720p', format: 'webm', fileSize: '~90MB' },
    ] as DownloadFormat[];

  const allFormats = availableFormats || [...videoFormats, ...audioFormats, ...webmFormats];

  return (
    <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <FileVideo className="h-5 w-5 text-primary" />
              Select Format & Quality
            </h3>
            <p className="text-sm text-muted-foreground">
              Choose your preferred video quality or extract audio only
            </p>
          </div>

          <RadioGroup
            value={`${selectedFormat.type}-${selectedFormat.quality}-${selectedFormat.format}`}
            onValueChange={(value) => {
              const format = allFormats.find(
                f => `${f.type}-${f.quality}-${f.format}` === value
              );
              if (format) onFormatChange(format);
            }}
            className="space-y-3"
          >
            {/* Video Formats */}
            {videoFormats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video (MP4)
                </Label>
                <div className="pl-6 space-y-2">
                  {videoFormats.map((format) => (
                    <div key={`${format.quality}-${format.format}`} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={`${format.type}-${format.quality}-${format.format}`}
                        id={`${format.quality}-${format.format}`}
                      />
                      <Label
                        htmlFor={`${format.quality}-${format.format}`}
                        className="flex-1 flex items-center justify-between cursor-pointer text-sm"
                      >
                        <span className="font-medium">{format.quality}</span>
                        <span className="text-muted-foreground text-xs">{format.fileSize}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WebM Formats */}
            {webmFormats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video (WebM)
                </Label>
                <div className="pl-6 space-y-2">
                  {webmFormats.map((format) => (
                    <div key={`${format.quality}-${format.format}`} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={`${format.type}-${format.quality}-${format.format}`}
                        id={`webm-${format.quality}`}
                      />
                      <Label
                        htmlFor={`webm-${format.quality}`}
                        className="flex-1 flex items-center justify-between cursor-pointer text-sm"
                      >
                        <span className="font-medium">{format.quality}</span>
                        <span className="text-muted-foreground text-xs">{format.fileSize}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Formats */}
            {audioFormats.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Audio Only (MP3)
                </Label>
                <div className="pl-6 space-y-2">
                  {audioFormats.map((format) => (
                    <div key={`${format.quality}-${format.format}`} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={`${format.type}-${format.quality}-${format.format}`}
                        id={`audio-${format.quality}`}
                      />
                      <Label
                        htmlFor={`audio-${format.quality}`}
                        className="flex-1 flex items-center justify-between cursor-pointer text-sm"
                      >
                        <span className="font-medium">{format.quality}</span>
                        <span className="text-muted-foreground text-xs">{format.fileSize}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormatSelector;
