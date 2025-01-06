import formidable from 'formidable';
import fs from 'fs/promises';
import { createWorker } from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let worker = null;

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
    const userText = fields.text || '';

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    worker = await createWorker('eng');

    const imageBuffer = await fs.readFile(imageFile.filepath);

    const {
      data: { text: extractedText },
    } = await worker.recognize(imageBuffer);

    if (!extractedText) {
      return res.status(400).json({ error: 'No text found in the image' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `${userText}\n\nText extracted from image: ${extractedText}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponse = response.text();

    await worker.terminate();
    await fs.unlink(imageFile.filepath).catch(console.error);

    return res.status(200).json({
      extractedText,
      answer: aiResponse,
    });
  } catch (error) {
    if (worker) {
      await worker.terminate().catch(console.error);
    }
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
