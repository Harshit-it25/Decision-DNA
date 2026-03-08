
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function analyzeDataset() {
  const data = fs.readFileSync('dataset.csv', 'utf8');
  const lines = data.split('\n').slice(1, 101); // Sample 100 records
  
  const prompt = `Analyze this credit dataset sample (100 records):
  ${lines.join('\n')}
  
  Provide a training report for two models:
  1. Logistic Regression
  2. Random Forest
  
  For each model, estimate:
  - Accuracy on this dataset
  - Feature Importance (Credit Score, Income, Debt Ratio)
  
  Return the result in a clear, professional format.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt
  });

  console.log(response.text);
}

analyzeDataset();
