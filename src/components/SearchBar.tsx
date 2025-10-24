import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
  url: string;
}

interface SearchBarProps {
  onSelectVideo: (url: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectVideo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter something to search for",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate search results (in a real app, you'd call YouTube Data API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock results based on search query
      const mockResults: SearchResult[] = [
        {
          id: 'dQw4w9WgXcQ',
          title: `${searchQuery} - Official Video`,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          duration: '3:45',
          channel: 'Sample Channel',
          views: '1.2M views',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        {
          id: 'jNQXAC9IVRw',
          title: `${searchQuery} Tutorial`,
          thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
          duration: '10:23',
          channel: 'Tutorial Channel',
          views: '850K views',
          url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
        },
        {
          id: '9bZkp7q19f0',
          title: `${searchQuery} Explained`,
          thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
          duration: '7:12',
          channel: 'Educational Videos',
          views: '2.4M views',
          url: 'https://www.youtube.com/watch?v=9bZkp7q19f0'
        },
      ];

      setSearchResults(mockResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${mockResults.length} results for "${searchQuery}"`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Search YouTube
              </h3>
              <p className="text-sm text-muted-foreground">
                Search for videos directly on YouTube
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Search for videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-background/50"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4">Search Results</h4>
            <div className="space-y-3">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => onSelectVideo(result.url)}
                >
                  <div className="relative w-40 flex-shrink-0">
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className="w-full aspect-video object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-1 right-1 bg-black/80 text-white text-xs"
                    >
                      {result.duration}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {result.title}
                    </h5>
                    <p className="text-sm text-muted-foreground mt-1">{result.channel}</p>
                    <p className="text-xs text-muted-foreground mt-1">{result.views}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
