import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, CheckCircle } from 'lucide-react';

interface DownloadProgressProps {
  progress: number;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ progress }) => {
  const isComplete = progress === 100;

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm animate-fade-in">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Download className="h-5 w-5 text-primary animate-pulse" />
            )}
            <div>
              <h4 className="font-semibold">
                {isComplete ? 'Download Complete!' : 'Downloading Video...'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isComplete 
                  ? 'Your video has been downloaded successfully'
                  : `Progress: ${progress}%`
                }
              </p>
            </div>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
          />
          
          {isComplete && (
            <div className="text-xs text-muted-foreground">
              Check your downloads folder for the video file
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DownloadProgress;