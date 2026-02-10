import { GoogleGenAI } from "@google/genai";
import { LocationData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface DestinationResult {
  text: string;
  mapUri?: string;
}

export interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
}

export const findDestination = async (
  query: string,
  currentLocation?: LocationData
): Promise<DestinationResult> => {
  try {
    const prompt = `Find exact details for this location: "${query}". Provide the full, formatted address.`;
    
    const toolConfig: any = {};
    if (currentLocation) {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig
      },
    });

    const text = response.text || "Keine Details gefunden.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let mapUri: string | undefined = undefined;

    if (groundingChunks && groundingChunks.length > 0) {
      const mapChunk = groundingChunks.find((c: any) => c.web?.uri);
      if (mapChunk) {
        mapUri = mapChunk.web.uri;
      }
    }

    return {
      text,
      mapUri
    };

  } catch (error) {
    console.error("Gemini API Error (Find):", error);
    throw new Error("Fehler bei der Adresssuche.");
  }
};

export const calculateRouteInfo = async (start: string, end: string): Promise<RouteInfo> => {
  try {
    const prompt = `Calculate the driving distance and duration between "${start}" and "${end}". 
    Return strictly JSON with 'distanceKm' (number) and 'durationMinutes' (number).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // No tools needed here, purely reasoning/knowledge based or relying on internal map knowledge
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Round UP the distance as requested
      const exactDistance = data.distanceKm || 0;
      const roundedDistance = Math.ceil(exactDistance);

      return {
        distanceKm: roundedDistance,
        durationMinutes: data.durationMinutes || 0
      };
    }
    
    return { distanceKm: 0, durationMinutes: 0 };
  } catch (error) {
    console.error("Gemini API Error (Route):", error);
    // Fallback if calculation fails
    return { distanceKm: 0, durationMinutes: 0 };
  }
};