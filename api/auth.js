import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'glowup-secret-key-2024';

// מסד נתונים זמני (בעתיד נשתמש ב-MongoDB)
let users = {};
let posts = {};
let follows = {};

// רישום משתמש חדש
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, email, password, username } = req.body;

    if (action === 'register') {
      // בדיקה אם המשתמש קיים
      if (users[email]) {
        return res.status(400).json({ error: 'משתמש קיים כבר' });
      }

      // יצירת משתמש חדש
      const userId = Date.now().toString();
      users[email] = {
        id: userId,
        email,
        password, // בעתיד נהצפין
        username,
        avatar: '👤',
        bio: '',
        glowScore: 0,
        xp: 0,
        followers: [],
        following: [],
        createdAt: new Date()
      };

      // יצירת JWT token
      const token = jwt.sign({ email, userId }, SECRET);

      return res.status(201).json({
        success: true,
        token,
        user: {
          id: userId,
          email,
          username,
          avatar: '👤',
          glowScore: 0,
          xp: 0
        }
      });
    }

    if (action === 'login') {
      // בדיקת משתמש
      const user = users[email];
      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'דוא"ל או סיסמה שגויים' });
      }

      // יצירת JWT token
      const token = jwt.sign({ email, userId: user.id }, SECRET);

      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email,
          username: user.username,
          avatar: user.avatar,
          glowScore: user.glowScore,
          xp: user.xp
        }
      });
    }

    if (action === 'get-user') {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'לא מחובר' });
      }

      try {
        const decoded = jwt.verify(token, SECRET);
        const user = users[decoded.email];
        if (!user) {
          return res.status(404).json({ error: 'משתמש לא נמצא' });
        }

        return res.status(200).json({ success: true, user });
      } catch (e) {
        return res.status(401).json({ error: 'טוקן לא תקני' });
      }
    }

    return res.status(400).json({ error: 'פעולה לא ידועה' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
