async function checkFormats(videoUrl) {
  try {
    const response = await fetch('http://localhost:3001/api/video-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl })
    });

    if (!response.ok) {
      console.error('Error fetching video info:', await response.text());
      return;
    }

    const data = await response.json();
    console.log('Video Title:', data.title);
    console.log('Available Formats:');
    console.table(data.formats);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

checkFormats('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
