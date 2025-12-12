import { GoogleGenAI } from "@google/genai";
import { Employee, IdentificationResult } from '../types';

// Using Gemini 2.5 Flash for multimodal analysis (Vision -> Text/JSON)
const MODEL_NAME = 'gemini-2.5-flash';

// Robust base64 cleaning that handles various browser implementations
const cleanBase64 = (data: string) => {
  if (data.includes(',')) {
    return data.split(',')[1];
  }
  return data;
};

const getMimeType = (data: string) => {
  const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const identifyEmployeeWithGemini = async (
  targetImageBase64: string,
  employees: Employee[]
): Promise<IdentificationResult> => {
  // Do not catch errors here; let them bubble up to the UI component for better feedback
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing in environment variables.");
  }

  if (employees.length === 0) {
    return { match: false, confidence: 0 };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct the prompt parts
  // We send the target image first
  const parts: any[] = [
    {
      inlineData: {
        mimeType: getMimeType(targetImageBase64),
        data: cleanBase64(targetImageBase64),
      },
    },
    {
      text: "This is the 'TARGET_PERSON' (Image #1) currently standing in front of the camera.",
    }
  ];

  // Send a larger batch of employees. Flash has a large context window.
  // Note: Extremely large lists might hit payload size limits, but 30-50 is usually safe for base64.
  const recentEmployees = employees.slice(-50); 
  
  recentEmployees.forEach((emp, index) => {
    parts.push({
      inlineData: {
        mimeType: getMimeType(emp.photoBase64),
        data: cleanBase64(emp.photoBase64),
      },
    });
    parts.push({
      text: `Reference Image #${index + 2}: This is ${emp.name} (ID: ${emp.id}).`,
    });
  });

  parts.push({
    text: `
    You are an expert biometric verification system.
    
    Task:
    Compare the face of the 'TARGET_PERSON' (the first image provided) against all other Reference Images provided.
    
    Guidelines:
    1. Account for differences in lighting, camera angle, distance, and facial expression. 
    2. Focus on key facial landmarks: eye distance, nose shape, jawline, and mouth structure.
    3. If the person matches one of the Reference Images with high certainty, return their details.
    
    Output Format (JSON Only):
    {
      "match": boolean,
      "employeeId": string | null,
      "name": string | null,
      "confidence": number (0.0 to 1.0)
    }
    
    If no clear match is found, set "match" to false.
    `
  });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      temperature: 0.3, // Lower temperature for more deterministic/strict results
    },
  });

  const resultText = response.text;
  if (!resultText) throw new Error("Empty response from AI model.");

  try {
    const result = JSON.parse(resultText) as IdentificationResult;
    return result;
  } catch (parseError) {
    console.error("Failed to parse JSON:", resultText);
    throw new Error("Invalid response format from AI.");
  }
};