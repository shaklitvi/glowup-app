export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) {
      console.error('❌ [API] Missing HUGGING_FACE_API_KEY environment variable');
      return res.status(500).json({
        error: 'API not configured',
        message: 'HUGGING_FACE_API_KEY is missing in Vercel environment variables'
      });
    }

    console.log('🔄 [API] Processing image with prompt:', prompt.substring(0, 50));
    console.log('📸 [API] Image size:', image.length, 'bytes');

    // Prepare image data - handle both data URLs and base64
    let base64Data = image;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    }

    // Validate base64
    if (!base64Data || base64Data.length === 0) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    console.log('✅ [API] Image validated, base64 length:', base64Data.length);

    // Call Hugging Face API with Instruct Pix2Pix model
    console.log('🚀 [API] Calling Hugging Face API...');

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: {
            image: base64Data,
            text: prompt,
          },
        }),
        timeout: 120000, // 2 minutes timeout
      }
    );

    console.log('📡 [API] HF Response status:', hfResponse.status);

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('❌ [API] HF Error:', errorText);

      if (hfResponse.status === 401) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid Hugging Face API key'
        });
      }

      if (hfResponse.status === 429) {
        return res.status(429).json({
          error: 'Rate limited',
          message: 'Too many requests. Please wait a moment and try again.'
        });
      }

      return res.status(500).json({
        error: 'Hugging Face API error',
        status: hfResponse.status,
        details: errorText.substring(0, 200)
      });
    }

    // Get the image from response
    const arrayBuffer = await hfResponse.arrayBuffer();
    const base64Result = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Result}`;

    console.log('✅ [API] Image processed successfully!');
    console.log('📊 [API] Result size:', dataUrl.length, 'bytes');

    return res.status(200).json({ image: dataUrl });

  } catch (error) {
    console.error('❌ [API] Error:', error.message);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

