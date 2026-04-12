export default async function handler(req, res) {
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
      console.error('❌ Missing HUGGING_FACE_API_KEY');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('🔄 Processing image with prompt:', prompt.substring(0, 50));

    // Prepare image data
    const base64Data = image.split(',')[1] || image;
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Call Hugging Face API with Instruct Pix2Pix model
    const response = await fetch(
      'https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix',
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: {
            image: base64Data,
            text: prompt,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Hugging Face error:', error);
      return res.status(500).json({ error: 'Image processing failed', details: error });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Result = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Result}`;

    console.log('✅ Image processed successfully');
    return res.status(200).json({ image: dataUrl });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
