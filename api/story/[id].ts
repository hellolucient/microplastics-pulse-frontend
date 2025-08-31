import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  
  try {
    // Fetch story data from your backend
    const response = await fetch(`${process.env.BACKEND_URL || 'https://microplastics-pulse-backend-production.up.railway.app'}/api/story/${id}`);
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    const story = await response.json();
    
    // Generate HTML with meta tags for crawlers
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title} | MicroplasticsWatch</title>
  <meta name="description" content="${story.ai_summary || story.title}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${story.title}">
  <meta property="og:description" content="${story.ai_summary || story.title}">
  <meta property="og:image" content="${story.ai_image_url || '/Microplastics Watch_verticle logo.png'}">
  <meta property="og:url" content="https://www.microplasticswatch.com/story/${id}">
  <meta property="og:site_name" content="MicroplasticsWatch">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${story.title}">
  <meta name="twitter:description" content="${story.ai_summary || story.title}">
  <meta name="twitter:image" content="${story.ai_image_url || '/Microplastics Watch_verticle logo.png'}">
  
  <!-- Additional meta tags -->
  <meta name="author" content="MicroplasticsWatch">
  <meta name="robots" content="index, follow">
  
  <!-- Redirect to the actual story page for users -->
  <meta http-equiv="refresh" content="0;url=https://www.microplasticswatch.com/story/${id}">
</head>
<body>
  <p>Redirecting to story...</p>
  <script>window.location.href = 'https://www.microplasticswatch.com/story/${id}';</script>
</body>
</html>`;
    
    // Set headers for social media crawlers
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // Cache for 5 minutes
    
    // Return the HTML with meta tags
    res.status(200).send(html);
    
  } catch (error) {
    // Fallback to basic meta tags if story fetch fails
    const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Story | MicroplasticsWatch</title>
  <meta name="description" content="Stay informed with the latest microplastics research, news, and insights.">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="MicroplasticsWatch - Latest Research & News">
  <meta property="og:description" content="Stay informed with the latest microplastics research, news, and insights.">
  <meta property="og:image" content="/Microplastics Watch_verticle logo.png">
  <meta property="og:url" content="https://www.microplasticswatch.com/story/${id}">
  <meta property="og:site_name" content="MicroplasticsWatch">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="MicroplasticsWatch - Latest Research & News">
  <meta name="twitter:description" content="Stay informed with the latest microplastics research, news, and insights.">
  <meta name="twitter:image" content="/Microplastics Watch_verticle logo.png">
  
  <!-- Redirect to the actual story page -->
  <meta http-equiv="refresh" content="0;url=https://www.microplasticswatch.com/story/${id}">
</head>
<body>
  <p>Redirecting to story...</p>
  <script>window.location.href = 'https://www.microplasticswatch.com/story/${id}';</script>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(fallbackHtml);
  }
}
