
// @google/genai guidelines followed: per-call initialization, direct process.env.API_KEY access, and proper result extraction.
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ProjectAudit } from "../types";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface EnhancedResponse<T> {
  data: T;
  sources: GroundingSource[];
}

export class GeminiCoderService {
  public isDemoMode: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey !== 'undefined' && apiKey.length > 10) {
      this.isDemoMode = false;
    } else {
      this.isDemoMode = true;
    }
  }

  // Extract grounding sources from the response's grounding metadata.
  private extractSources(response: any): GroundingSource[] {
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }
    return sources;
  }

  // Uses gemini-3-pro-preview for complex reasoning and architecture planning.
  async generateProjectStructure(prompt: string): Promise<EnhancedResponse<any>> {
    if (this.isDemoMode) {
      return { data: this.getMockStructure(prompt), sources: [] };
    }

    // Guideline: Create a new GoogleGenAI instance right before making an API call.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Sen dünyanın en gelişmiş otonom yazılım mühendislerinden birisin. 
          Kullanıcının şu isteği için interneti kullanarak 2025 yılının en güncel, kararlı ve performanslı teknolojilerini araştır:
          İstek: "${prompt}"
          
          Lütfen şu yapıda profesyonel bir proje planı (JSON) oluştur. Sadece en önemli dosyaları dahil et:
          {
            "projectName": "modern-project-slug",
            "files": [
              {"path": "src/main.tsx", "purpose": "App entry with strict typing"},
              {"path": "src/App.tsx", "purpose": "Main layout component"},
              {"path": "src/styles.css", "purpose": "Tailwind/Modern styling"}
            ]
          }
        `,
        config: {
          thinkingConfig: { thinkingBudget: 24000 },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              projectName: { type: Type.STRING },
              files: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING },
                    purpose: { type: Type.STRING }
                  },
                  required: ["path", "purpose"]
                }
              }
            },
            required: ["projectName", "files"]
          }
        }
      });
      
      // Guideline: Use response.text (property access) to get the generated text.
      const text = response.text || "{}";
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const cleanJson = jsonStart !== -1 ? text.slice(jsonStart, jsonEnd) : text;
      
      return {
        data: JSON.parse(cleanJson),
        sources: this.extractSources(response)
      };
    } catch (e) {
      console.warn("Architecture failed, using mock", e);
      return { data: this.getMockStructure(prompt), sources: [] };
    }
  }

  // Generate file content with thinking budget for high quality code generation.
  async generateFileContent(prompt: string, fileName: string, context: string): Promise<EnhancedResponse<string>> {
    if (this.isDemoMode) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Dosya Kodlama Görevi: "${fileName}"
          Genel Proje Amacı: ${prompt}
          Tüm Dosya Yapısı: ${context}
          
          Lütfen bu dosya için internetteki en güncel dökümantasyonları araştır. 
          Eğer bir web projesi ise modern kütüphaneleri ve güncel standartları kullan. 
          Modern, temiz, yorum satırları içeren ve hatasız bir kod yaz. 
          Sadece kodu döndür. Markdown blokları kullanma.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 18000 },
          tools: [{ googleSearch: {} }]
        }
      });
      
      return {
        data: response.text || '// İçerik üretilemedi.',
        sources: this.extractSources(response)
      };
    } catch (e) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }
  }

  // Fast completion using gemini-3-flash-preview.
  async getAutocomplete(currentCode: string, cursorContext: string): Promise<string> {
    if (this.isDemoMode) return "  // AI Tamamlama";
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tamamla:\n${currentCode}\nBağlam: ${cursorContext}`,
      });
      return response.text || '';
    } catch { return ""; }
  }

  private getMockStructure(prompt: string) {
    return {
      projectName: "Offline-Development",
      files: [
        { path: "src/main.ts", purpose: "Entry" },
        { path: "src/App.tsx", purpose: "Root Component" },
        { path: "src/index.css", purpose: "Styles" }
      ]
    };
  }

  private getMockFileContent(fileName: string): string {
    return `// Autonomous content for ${fileName}\nexport default function App() {\n  return <div>Hello</div>\n}`;
  }
}
