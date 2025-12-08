import { GoogleGenAI } from "@google/genai";
import { Employee, IdentificationResult } from '../types';

// Using Gemini 2.5 Flash for multimodal analysis (Vision -> Text/JSON)
// gemini-2.5-flash-image does not support JSON output, so we must use gemini-2.5-flash.
const MODEL_NAME = 'gemini-2.5-flash';

// We need to clean the base64 string for Gemini (remove data:image/png;base64, prefix)
const cleanBase64 = (data: string) => {
  return data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (data: string) => {
  const match = data.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const identifyEmployeeWithGemini = async (
  targetImageBase64: string,
  employees: Employee[]
): Promise<IdentificationResult> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is missing");
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
        text: "This is the 'TARGET_PERSON' currently standing in front of the camera.",
      }
    ];

    // Then we attach reference images for context
    const recentEmployees = employees.slice(-10); 
    
    recentEmployees.forEach((emp, index) => {
      parts.push({
        inlineData: {
          mimeType: getMimeType(emp.photoBase64),
          data: cleanBase64(emp.photoBase64),
        },
      });
      parts.push({
        text: `Reference Image #${index + 1}: This is ${emp.name} (ID: ${emp.id}).`,
      });
    });

    // Explicitly ask for JSON in the prompt to ensure structure without relying on strict responseSchema
    // which can sometimes cause INVALID_ARGUMENT on certain model versions with Vision.
    parts.push({
      text: `
      Analyze the 'TARGET_PERSON' image and compare it against the provided Reference Images.
      
      Your task:
      1. Determine if the TARGET_PERSON matches any of the Reference Images significantly.
      2. If a match is found, return the ID and Name of the person.
      3. Provide a confidence score between 0.0 and 1.0.
      4. If the person is not in the reference list or the image is unclear, return match=false.
      
      Output MUST be a single raw JSON object (no markdown formatting) with this structure:
      {
        "match": boolean,
        "employeeId": string | null,
        "name": string | null,
        "confidence": number
      }
      
      Be strict. Do not guess. If the face is obscured or different, say no match.
      `
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        // Enforce JSON output format
        responseMimeType: "application/json",
        temperature: 0.4, 
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText) as IdentificationResult;
    return result;

  } catch (error) {
    console.error("Gemini Identification Error:", error);
    // Return a safe fallback
    return { match: false, confidence: 0 };
  }
};