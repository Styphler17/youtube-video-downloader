import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { List, X, Download, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { DownloadFormat } from './FormatSelector';

export interface QueueItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  format: DownloadFormat;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
}

interface DownloadQueueProps {
  queue: QueueItem[];
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
}

const DownloadQueue: React.FC<DownloadQueueProps> = ({ queue, onRemove, onDownload }) => {
  if (queue.length === 0) return null;

  const getStatusIcon = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'downloading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'downloading':
        return <Badge className="bg-primary">Downloading</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              Download Queue ({queue.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queue.forEach(item => {
                if (item.status === 'pending') onDownload(item.id);
              })}
              disabled={!queue.some(item => item.status === 'pending')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>

          <div className="space-y-3">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="relative w-32 flex-shrink-0">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full aspect-video object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  {item.status === 'downloading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {item.format.quality} {item.format.format.toUpperCase()}
                    </Badge>
                    {getStatusBadge(item.status)}
                  </div>

                  {item.status === 'downloading' && (
                    <div className="space-y-1">
                      <Progress value={item.progress} className="h-2" />
                      <p className="text-xs text-muted-foreground">{item.progress}%</p>
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDownload(item.id)}
                      className="h-7 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Start Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DownloadQueue;
