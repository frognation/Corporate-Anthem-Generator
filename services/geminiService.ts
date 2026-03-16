import { GoogleGenAI, Type } from "@google/genai";
import { CompanySong } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateCompanySong = async (url: string): Promise<CompanySong> => {
  try {
    const prompt = `
      Create a 2000s-style corporate anthem for the company at: ${url}.
      
      1. Use Google Search to find the company's core values and mission.
      2. Compose 6-8 catchy lines.
      3. For EACH word in every line, assign a 'pitch' value from 0.5 to 2.0 to create a melody.
         - For example, a line "We are the best" could have pitches [0.8, 1.0, 1.2, 1.5].
         - Create musical intervals (e.g., jumps between 0.8 and 1.4) to make it sound like singing.
      4. Each line should be a 'SongSegment' containing an array of 'words'.

      Return a JSON object:
      {
        "companyName": "Name",
        "summary": "Short tagline",
        "lyrics": [
          { "words": [{"text": "Hello", "pitch": 1.2}, {"text": "World", "pitch": 1.5}], "rate": 1.0 }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            summary: { type: Type.STRING },
            lyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  words: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        pitch: { type: Type.NUMBER }
                      },
                      required: ["text", "pitch"]
                    }
                  },
                  rate: { type: Type.NUMBER }
                },
                required: ["words", "rate"]
              }
            }
          },
          required: ["companyName", "summary", "lyrics"]
        }
      }
    });

    if (!response.text) throw new Error("No response");
    return JSON.parse(response.text) as CompanySong;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};