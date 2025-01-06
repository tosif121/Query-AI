import formidable from 'formidable';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const imageFile = files.image?.[0];
    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = await fs.readFile(imageFile.filepath);

    const ocrResult = await Tesseract.recognize(imageBuffer, 'eng', {
      corePath: '/tesseract-core-simd.wasm',
      logger: (m) => console.log(m),
    });

    const extractedText = ocrResult.data.text;

    if (!extractedText) {
      return res.status(400).json({ error: 'No text found in the image' });
    }

    await fs.unlink(imageFile.filepath).catch(console.error);

    return res.status(200).json({ extractedText });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
