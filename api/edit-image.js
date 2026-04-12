export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    console.log('🎨 Generating real AI transformation...');

    // Extract base64 from data URL
    let base64Data = image;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    }

    const apiKey = process.env.HUGGING_FACE_API_KEY;

    // Try Stable Diffusion 3 - better for realistic transformations
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3-medium',
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: `Transform this person: ${prompt}. Professional photo, cinematic lighting, high quality, detailed, masterpiece`
        }),
        timeout: 120000
      }
    );

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error('Transformation failed');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Result}`;

    console.log('✅ AI transformation complete!');
    return res.status(200).json({ image: dataUrl });

  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'AI transformation failed',
      message: error.message
    });
  }
}
