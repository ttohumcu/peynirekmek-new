import { GoogleGenAI, Type } from "@google/genai";
import { GeminiStyleResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateButtonStyle = async (description: string): Promise<GeminiStyleResponse> => {
  const modelId = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a UI Design Expert using Tailwind CSS. 
    Your goal is to generate CSS classes for a button based on a user's description.
    
    Rules:
    1. Return valid Tailwind CSS class names only.
    2. Include layout, spacing, colors, borders, shadows, and hover states.
    3. Ensure the text is readable (high contrast).
    4. Make the button look modern and professional.
    5. Also select a matching icon name from the Lucide React library (kebab-case string).
    6. Do NOT include 'w-full' or fixed dimensions that might break a grid layout, but do include padding (e.g., p-4, px-6).
    7. Always include 'flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Description: ${description}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            className: {
              type: Type.STRING,
              description: "The Tailwind CSS class string.",
            },
            icon: {
              type: Type.STRING,
              description: "The Lucide icon name (e.g., 'rocket', 'home', 'coffee').",
            },
          },
          required: ["className", "icon"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as GeminiStyleResponse;
  } catch (error) {
    console.error("Gemini generation failed:", error);
    // Fallback style
    return {
      className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300",
      icon: "link"
    };
  }
};