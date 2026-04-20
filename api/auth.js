export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, email, password, username } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    if (action === 'register') {
      // Validate input
      if (!email || !password || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Simple in-memory user storage (for demo)
      const users = {};

      if (users[email]) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userId = Date.now().toString();
      const token = Buffer.from(JSON.stringify({ email, userId })).toString('base64') + '.' +
                   Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64');

      return res.status(201).json({
        success: true,
        token: token,
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
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Demo: accept any email/password
      const userId = Date.now().toString();
      const token = Buffer.from(JSON.stringify({ email, userId })).toString('base64') + '.' +
                   Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64');

      return res.status(200).json({
        success: true,
        token: token,
        user: {
          id: userId,
          email,
          username: email.split('@')[0],
          avatar: '👤',
          glowScore: 0,
          xp: 0
        }
      });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}

