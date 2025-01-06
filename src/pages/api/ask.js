import formidable from 'formidable';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const sanitizeInput = (text) => {
  // Add null check and string conversion
  if (!text) return '';
  return String(text).replace(/[^a-zA-Z0-9 .,!?]/g, '').trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const imageFile = files.image?.[0];
    // Ensure text is a string or empty string
    const userText = fields.text?.[0] || '';

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = await fs.readFile(imageFile.filepath);
    const ocrResult = await Tesseract.recognize(imageBuffer, 'eng', {
      logger: (m) => console.log(m),
    });

    const extractedText = sanitizeInput(ocrResult.data.text);

    if (!extractedText) {
      return res.status(400).json({ error: 'No text found in the image' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const defaultPrompt = 'Please analyze the following content safely.';
    const prompt = `${sanitizeInput(userText) || defaultPrompt}\n\nText extracted from image: ${extractedText || defaultPrompt}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      // Ensure cleanup happens even if response fails
      await fs.unlink(imageFile.filepath).catch(console.error);

      return res.status(200).json({
        extractedText,
        answer: aiResponse,
      });
    } catch (error) {
      // Ensure cleanup on error
      await fs.unlink(imageFile.filepath).catch(console.error);

      if (error.message?.includes('SAFETY')) {
        console.log('Flagged Prompt:', prompt);
        return res.status(400).json({
          extractedText,
          answer: 'The AI could not generate a response due to content safety concerns.',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}