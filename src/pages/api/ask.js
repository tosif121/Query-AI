import formidable from 'formidable';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

const preprocessImage = async (inputBuffer) => {
  try {
    return await sharp(inputBuffer)
      .grayscale()
      .normalize()
      .median(1)
      .resize(2000, null, {
        withoutEnlargement: true,
        fit: 'inside',
      })
      .toBuffer();
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    return inputBuffer;
  }
};

const sanitizeInput = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/[^\w\s.,!?;:'"()\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const improveOCRAccuracy = (text) => {
  if (!text) return '';
  return text
    .replace(/[|]/g, 'I')
    .replace(/[£]/g, 'E')
    .replace(/[0]/g, 'O')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024,
      keepExtensions: true,
      filter: function ({ name, originalFilename, mimetype }) {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const imageFile = files.image?.[0];
    const userText = fields.text?.[0] || '';

    if (!imageFile) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const originalBuffer = await fs.readFile(imageFile.filepath);
    const processedBuffer = await preprocessImage(originalBuffer);

    const ocrResult = await Tesseract.recognize(processedBuffer, 'eng', {
      logger: (m) => console.log(m),
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!? ',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO_OSD,
      tessjs_create_pdf: '0',
      tessjs_create_hocr: '0',
    });

    const extractedText = improveOCRAccuracy(sanitizeInput(ocrResult.data.text));

    if (!extractedText) {
      return res.status(400).json({ error: 'No text found in the image' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const defaultPrompt = 'Please analyze the following content safely.';
    const prompt = `${sanitizeInput(userText) || defaultPrompt}\n\nText extracted from image: ${
      extractedText || defaultPrompt
    }`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      await fs.unlink(imageFile.filepath).catch(console.error);

      return res.status(200).json({
        extractedText,
        answer: aiResponse,
        confidence: ocrResult.data.confidence,
      });
    } catch (error) {
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
