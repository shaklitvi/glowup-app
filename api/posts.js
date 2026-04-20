import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'glowup-secret-key-2024';

// מסד נתונים זמני
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
        const decoded = jwt.verify(token, SECRET);
        currentUser = decoded.email;
      } catch (e) {
        // no auth required for getting posts
      }
    }

    if (req.method === 'POST') {
      // יצירת פוסט חדש
      if (!currentUser) {
        return res.status(401).json({ error: 'צריך להיות מחובר' });
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

      allPosts.push(newPost);

      return res.status(201).json({ success: true, post: newPost });
    }

    if (req.method === 'GET') {
      // קבלת כל הפוסטים
      return res.status(200).json({ success: true, posts: allPosts });
    }

    return res.status(400).json({ error: 'פעולה לא ידועה' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
