/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { BoxItem } from "../types";

// Helper to convert a File object to a GoogleGenerativeAI.Part object
const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

// Helper to extract MIME type and base64 data from a data URL
const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

// Helper to convert a data URL string to a GoogleGenerativeAI.Part object
const dataUrlToPart = (dataUrl: string) => {
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
}

// Helper to fetch an image from a URL and convert it to a GoogleGenerativeAI.Part object
const urlToPart = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${url}`);
    }
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise<object>((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const { mimeType, data } = dataUrlToParts(dataUrl);
            resolve({ inlineData: { mimeType, data } });
        };
        reader.onerror = error => reject(error);
    });
};

const handleApiResponse = (response: GenerateContentResponse): string => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `La solicitud fue bloqueada. Razón: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    // Find the first image part in any candidate
    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `La generación de imágenes se detuvo inesperadamente. Razón: ${finishReason}. Esto a menudo se relaciona con la configuración de seguridad.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `El modelo de IA no devolvió una imagen. ` + (textFeedback ? `El modelo respondió con texto: "${textFeedback}"` : "Esto puede ocurrir debido a los filtros de seguridad o si la solicitud es demasiado compleja. Por favor, intenta con una imagen diferente.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash-image-preview';

export const generateLogoOnBoxImage = async (box: BoxItem, logoImage: File): Promise<string> => {
    const boxImagePart = box.url.startsWith('data:')
      ? dataUrlToPart(box.url)
      : await urlToPart(box.url);
    const logoImagePart = await fileToPart(logoImage);
    
    // Simplified, more direct prompt to reduce failure rate.
    const prompt = `Replace the "TASTY BOX" text on the first image (the box) with the second image (the logo). The logo must be placed realistically on the box's front, matching the lighting, texture, and perspective. Output ONLY the resulting image.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [boxImagePart, logoImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateAngleVariation = async (boxImageUrl: string, angleInstruction: string): Promise<string> => {
    const boxImagePart = dataUrlToPart(boxImageUrl);
    // Refined prompt for clarity
    const prompt = `Take the provided image of a product box. Generate a new image showing the exact same box and logo, but from a different angle described as: "${angleInstruction}". Keep the style, lighting, and background consistent. Output only the newly generated image.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [boxImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};