const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to avoid other issues
}));
app.use(cors({
  origin: true, // Allow all origins
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const path = require('path');

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React frontend app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Helper function to extract video ID from URL
function extractVideoId(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (hostname.includes('youtube.com')) {
      if (parsedUrl.pathname === '/watch') {
        return parsedUrl.searchParams.get('v');
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
    
    // Fallback to regex for edge cases
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
  } catch (e) {
    // If URL parsing fails, try regex directly
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
}

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format view count
function formatViews(views) {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

// Helper function to estimate file size
function estimateFileSize(duration, quality, format) {
  const durationMinutes = duration / 60;

  if (format === 'mp3') {
    // Audio bitrate in kbps
    const bitrates = { '320kbps': 320, '256kbps': 256, '128kbps': 128 };
    const bitrate = bitrates[quality] || 128;
    const sizeMB = (bitrate * durationMinutes * 60) / (8 * 1024);
    return `~${Math.round(sizeMB)}MB`;
  } else {
    // Video size estimates based on quality
    const sizes = {
      '2160p': 500, '1080p': 200, '720p': 100,
      '480p': 50, '360p': 30
    };
    const baseSize = sizes[quality] || 100;
    // Adjust for WebM (slightly smaller)
    const multiplier = format === 'webm' ? 0.9 : 1;
    return `~${Math.round(baseSize * multiplier)}MB`;
  }
}

// POST /api/video-info - Get video metadata and available formats
app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Create an agent with cookies if available (to bypass YouTube IP blocks)
    let agent;
    if (process.env.YOUTUBE_COOKIES) {
      try {
        const cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
        agent = ytdl.createAgent(cookies);
        console.log('Using YouTube Cookies for authentication');
      } catch (err) {
        console.error('Failed to parse YOUTUBE_COOKIES:', err.message);
      }
    } else {
      console.log('No YOUTUBE_COOKIES provided, using default agent');
    }

    // Check for cookies
    if (!process.env.YOUTUBE_COOKIES) {
      console.warn('WARNING: YOUTUBE_COOKIES environment variable is missing.');
    }

    // Get video info using ytdl-core with robust headers and agent
    // We try multiple strategies if the default fails
    // Get video info using ytdl-core with robust headers and agent
    // We try multiple strategies if the default fails OR if it returns low quality
    let info;
    const clients = ['WEB', 'IOS', 'ANDROID'];
    let lastError;
    let usedClient = 'NONE';

    for (const client of clients) {
      try {
        console.log(`Attempting fetch with ${client} client...`);
        
        let options = {
          agent,
          lang: 'en',
          requestOptions: {
            family: 4, // Force IPv4
          }
        };

        // Only add custom headers for WEB client. 
        // For Mobile clients, let ytdl-core set the correct User-Agent.
        if (client === 'WEB') {
           options.requestOptions.headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://www.youtube.com/',
              'Accept-Language': 'en-US,en;q=0.9'
           };
        } else if (client === 'IOS') {
           options.playerClients = ['IOS'];
        } else if (client === 'ANDROID') {
           options.playerClients = ['ANDROID'];
        }

        const tempInfo = await ytdl.getInfo(videoId, options);

        // Check if we got any high quality formats (>= 720p)
        const hasHighQuality = tempInfo.formats.some(f => f.bitrate && (f.height >= 720 || (f.hasVideo && !f.height))); 
        
        // If we found high quality, or if it's the last client, use it.
        // But if it's WEB and low quality, treat as failure to trigger fallback.
        if (hasHighQuality || client === 'ANDROID') {
           info = tempInfo;
           usedClient = client;
           console.log(`Success with ${client} client. High quality found: ${hasHighQuality}`);
           break; 
        } else {
           console.log(`${client} returned only low quality formats. Trying next client...`);
           lastError = new Error('Low quality formats only');
        }
      } catch (e) {
        console.error(`${client} client failed:`, e.message);
        lastError = e;
      }
    }

    if (!info) {
      throw lastError || new Error('All clients failed');
    }

    // Extract basic metadata
    const videoDetails = info.videoDetails;
    const title = videoDetails.title;
    const thumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url;
    const channel = videoDetails.author.name;
    const views = parseInt(videoDetails.viewCount);
    const duration = parseInt(videoDetails.lengthSeconds);

    // Get available formats
    const formats = info.formats;

    // Filter and organize formats
    const videoFormats = [];
    const audioFormats = [];

    // Video formats (MP4)
    // First try to find muxed formats (Video + Audio)
    let mp4Formats = formats
      .filter(f => f.container === 'mp4' && f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    // If no muxed formats found (common on restricted IPs for some videos), fall back to video-only
    // But we should prioritize muxed.
    // Allow both mp4 and webm containers for video-only (high quality is often webm/vp9)
    const videoOnlyFormats = formats
      .filter(f => (f.container === 'mp4' || f.container === 'webm') && f.hasVideo && !f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    mp4Formats.forEach(format => {
      if (format.height) {
        const quality = `${format.height}p`;
        const fileSize = estimateFileSize(duration, quality, 'mp4');
        videoFormats.push({
          quality,
          format: 'mp4',
          itag: format.itag,
          fileSize,
          hasVideo: true,
          hasAudio: true
        });
      }
    });

    // Add video-only formats (potentially high quality like 1080p/4k that are video-only)
    // We label them clearly so frontend can show "No Audio"
    videoOnlyFormats.forEach(format => {
      if (format.height) {
        const quality = `${format.height}p (No Audio)`;
        // Check if we already have this quality in muxed (Audio+Video)
        // We only want to add "No Audio" version if we DON'T have a muxed version of the same quality
        const existsAsMuxed = videoFormats.some(f => f.quality === `${format.height}p` && f.hasAudio);
        
        if (!existsAsMuxed) {
           const container = format.container || 'mp4';
           const fileSize = estimateFileSize(duration, `${format.height}p`, container);
           
           // Check if we already added this video-only format (deduplicate mp4 vs webm if same quality)
           const alreadyAdded = videoFormats.some(f => f.quality === quality);
           
           if (!alreadyAdded) {
             videoFormats.push({
               quality,
               format: container,
               itag: format.itag,
               fileSize,
               hasVideo: true,
               hasAudio: false
             });
           }
        }
      }
    });

    // WebM formats
    const webmFormats = formats
      .filter(f => f.container === 'webm' && f.hasVideo && f.hasAudio)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    webmFormats.forEach(format => {
      if (format.height && format.height >= 720) {
        const quality = `${format.height}p`;
        const fileSize = estimateFileSize(duration, quality, 'webm');
        videoFormats.push({
          quality,
          format: 'webm',
          itag: format.itag,
          fileSize,
          hasVideo: true,
          hasAudio: true
        });
      }
    });

    // Audio formats (MP3)
    const audioOnlyFormats = formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    audioOnlyFormats.forEach(format => {
      if (format.audioBitrate) {
        let quality;
        if (format.audioBitrate >= 320) quality = '320kbps';
        else if (format.audioBitrate >= 256) quality = '256kbps';
        else quality = '128kbps';

        const fileSize = estimateFileSize(duration, quality, 'mp3');
        audioFormats.push({
          quality,
          format: 'mp3',
          itag: format.itag,
          fileSize,
          hasVideo: false,
          hasAudio: true
        });
      }
    });

    // Remove duplicates and organize
    const uniqueVideoFormats = videoFormats.filter((format, index, self) =>
      index === self.findIndex(f => f.quality === format.quality && f.format === format.format)
    );

    const uniqueAudioFormats = audioFormats.filter((format, index, self) =>
      index === self.findIndex(f => f.quality === format.quality)
    );

    const allFormats = [...uniqueVideoFormats, ...uniqueAudioFormats];

    res.json({
      title,
      thumbnail,
      channel,
      views: formatViews(views),
      duration: formatDuration(duration),
      formats: allFormats,
      videoId,
      debug: {
        usedClient,
        totalFormatsFound: formats.length,
        hasHighQuality: formats.some(f => f.height >= 720)
      }
    });

  } catch (error) {
    console.error('Error fetching video info:', error);
    
    // Check if cookies were provided to give better guidance
    const hasCookies = !!process.env.YOUTUBE_COOKIES;
    let userMessage = error.message;

    if (error.message.includes('429')) {
      userMessage = 'YouTube is rate limiting requests from this server. Please try again later.';
    } else if (error.message.includes('Sign in')) {
      userMessage = hasCookies 
        ? 'YouTube rejected the provided cookies. They may be expired or invalid.' 
        : 'YouTube requires sign-in for this video. Please update Vercel env vars with cookies.';
    } else if (error.message.includes('formats')) {
      userMessage = hasCookies 
        ? 'No playable formats found even with cookies. Vercel IP might be blocked.' 
        : 'No playable formats found. Please add YOUTUBE_COOKIES to Vercel env vars.';
    }

    res.status(500).json({
      error: 'Failed to fetch video information',
      details: userMessage
    });
  }
});

// GET /api/download - Download video/audio file
app.get('/api/download', async (req, res) => {
  try {
    const { videoId, itag, title, format } = req.query;

    if (!videoId || !itag) {
      return res.status(400).json({ error: 'videoId and itag are required' });
    }

    // Create an agent with cookies if available
    let agent;
    if (process.env.YOUTUBE_COOKIES) {
      try {
        const cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
        agent = ytdl.createAgent(cookies);
      } catch (err) {
        console.error('Failed to parse YOUTUBE_COOKIES for download:', err.message);
      }
    }

    // Get video info to validate and stream from pre-fetched data
    const info = await ytdl.getInfo(videoId, {
      agent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      },
      lang: 'en'
    });
    const selectedFormat = info.formats.find(f => f.itag.toString() === itag);

    if (!selectedFormat) {
      return res.status(400).json({ error: 'Invalid format selected' });
    }

    console.log(`Starting download for videoId: ${videoId}, itag: ${itag}, format: ${selectedFormat.container || format}, quality: ${selectedFormat.qualityLabel || 'N/A'}`);
    console.log('Selected format details:', selectedFormat);

    // Set appropriate headers
    const fileName = `${title || 'video'}.${format || 'mp4'}`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mimeType = format === 'mp3' ? 'audio/mpeg' :
                     format === 'webm' ? 'video/webm' : 'video/mp4';

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', mimeType);

    // Stream using pre-fetched info for reliability
    // We reuse the agent created above
    const stream = ytdl.downloadFromInfo(info, {
      quality: itag,
      agent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.youtube.com/',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });

    stream.pipe(res);

    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Stream error for itag', itag, ':', error.message);
      console.error('Full stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed', details: error.message });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Download failed',
        details: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Any request that doesn't match the above API routes will be handled by the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`YouTube Downloader Backend running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
