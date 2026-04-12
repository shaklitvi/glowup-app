export default async function handler(req, res) {
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

    console.log('🚀 [API] Processing with Replicate AI...');

    // Convert data URL to base64 if needed
    let base64Data = image;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    }

    // Create image URL from base64
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use Hugging Face's img2img endpoint with ControlNet for real transformations
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    const response = await fetch(
      'https://api-inference.huggingface.co/models/diffusers/controlnet-canny-sdxl-1.0',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: {
            image: base64Data,
            prompt: `${prompt}, masterpiece, 8k, detailed, cinematic lighting`,
            negative_prompt: 'blurry, low quality, distorted'
          }
        }),
        timeout: 120000
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);

      // Fallback: Try alternative API
      return await tryAlternativeAPI(base64Data, prompt, res);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Result}`;

    console.log('✅ [API] Image transformed successfully!');
    return res.status(200).json({ image: dataUrl });

  } catch (error) {
    console.error('❌ [API] Error:', error.message);
    return res.status(500).json({
      error: 'Processing failed',
      message: error.message
    });
  }
}

async function tryAlternativeAPI(base64Data, prompt, res) {
  try {
    console.log('🔄 Trying alternative API...');

    // Try Hugging Face Stable Diffusion 3
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3-medium',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: `Transform and enhance: ${prompt}. High quality, detailed, professional`,
        }),
        timeout: 120000
      }
    );

    if (!response.ok) {
      throw new Error('Alternative API also failed');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Result}`;

    console.log('✅ Alternative API succeeded!');
    return res.status(200).json({ image: dataUrl });
  } catch (err) {
    console.error('❌ Alternative API failed:', err.message);
    return res.status(500).json({
      error: 'All AI services temporarily unavailable',
      message: 'Please try again in a moment'
    });
  }
}

