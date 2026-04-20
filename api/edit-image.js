// Vercel Serverless Function for AI Image Editing
// This handles image editing requests and calls Hugging Face API

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
    const { image, prompt, apiKey } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Missing image or prompt' });
    }

    // Get Hugging Face token from request (user provides it)
    let hfToken = apiKey || process.env.HUGGING_FACE_API_KEY;

    if (!hfToken) {
      return res.status(400).json({
        error: 'Missing API key',
        message: 'Please provide your Hugging Face API key'
      });
    }

    // Prepare the request
    const base64Data = image.split(',')[1] || image;
    const binaryData = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append('inputs', prompt);

    // Create blob from binary data
    const imageBlob = new Blob([binaryData], { type: 'image/jpeg' });
    formData.append('inputs', imageBlob, 'image.jpg');

    // Call Hugging Face API
    const response = await fetch(
      'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`
        },
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Image editing failed',
        details: errorText
      });
    }

    // Get the edited image as blob
    const resultBlob = await response.blob();
    const resultBuffer = await resultBlob.arrayBuffer();
    const base64Result = Buffer.from(resultBuffer).toString('base64');

    return res.status(200).json({
      success: true,
      image: `data:image/jpeg;base64,${base64Result}`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
