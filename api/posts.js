// Simple in-memory posts storage (for demo)
let allPosts = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    let currentUser = null;

    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
        currentUser = decoded.email;
      } catch (e) {
        // no auth required for getting posts
      }
    }

    if (req.method === 'POST') {
      // Create new post
      if (!currentUser) {
        return res.status(401).json({ error: 'Must be logged in' });
      }

      const { image, caption, transformation } = req.body;

      const newPost = {
        id: Date.now().toString(),
        author: currentUser,
        image,
        caption,
        transformation,
        likes: 0,
        comments: [],
        createdAt: new Date(),
        likedBy: []
      };

      allPosts.unshift(newPost);

      return res.status(201).json({ success: true, post: newPost });
    }

    if (req.method === 'GET') {
      // Get all posts
      return res.status(200).json({ success: true, posts: allPosts });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Posts error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

