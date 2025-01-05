```markdown
# Query AI - Next.js Project

**Query AI** is a web application built with Next.js that allows users to capture or upload images, extract text from them using Optical Character Recognition (OCR), and then ask any questions or solve problems based on the extracted text using Google Generative AI.

## Features

- **OCR (Optical Character Recognition)**: Extracts text from uploaded images using Tesseract.js.
- **Generative AI**: Uses Google Generative AI to process the extracted text and provide a response.
- **Image Upload**: Users can upload images containing text to be processed.
- **AI-Assisted Problem Solving**: Once text is extracted, users can ask additional questions or get solutions based on the content.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tosif121/query-ai.git
   ```

2. Install dependencies:
   ```bash
   cd query-ai
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file and add your Google Generative AI API key:
   ```bash
   GEMINI_API_KEY=your_google_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open the app in your browser at [http://localhost:3000](http://localhost:3000).

## Usage

1. **Upload an Image**: Use the file upload functionality to upload an image with text.
2. **Ask a Question**: After extracting the text, input any question you have, and the AI will respond with a solution or answer based on the content in the image.

## API Details

The application includes a POST API endpoint (`/api/ask`) that:

1. Accepts an image file upload along with optional text.
2. Processes the image using Tesseract.js for OCR to extract any text.
3. Uses Google Generative AI to generate a response based on the extracted text and user-provided text.

**Request Format**:
- Method: `POST`
- Body: 
   - `image` (file): The image containing the text.
   - `text` (optional, string): Any additional context or question the user has.

**Response**:
- `extractedText`: The text extracted from the image.
- `answer`: The AI-generated response based on the extracted text and user question.

## Technologies Used

- **Next.js**: Framework for React-based applications.
- **Tesseract.js**: JavaScript OCR library for text extraction from images.
- **Google Generative AI**: For generating content based on extracted text and user queries.
- **Formidable**: For handling file uploads.
