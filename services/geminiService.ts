
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
  private ai: GoogleGenAI | null = null;
  public isDemoMode: boolean = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey !== 'undefined' && apiKey.length > 10) {
      this.ai = new GoogleGenAI({ apiKey });
      this.isDemoMode = false;
    } else {
      this.isDemoMode = true;
    }
  }

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

  async generateProjectStructure(prompt: string): Promise<EnhancedResponse<any>> {
    if (this.isDemoMode || !this.ai) {
      return { data: this.getMockStructure(prompt), sources: [] };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Sen otonom bir yazılım mühendisisin. Kullanıcının şu isteği için interneti tara ve en güncel (2025 standartlarında) kütüphane ve mimari yapıları bul:
          İstek: "${prompt}"
          
          Lütfen şu yapıda bir JSON planı oluştur:
          {
            "projectName": "Örn: Modern-E-Ticaret-Projesi",
            "files": [
              {"path": "src/main.ts", "purpose": "Uygulama giriş noktası"},
              ...
            ]
          }
        `,
        config: {
          thinkingConfig: { thinkingBudget: 20000 },
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
      
      return {
        data: JSON.parse(response.text),
        sources: this.extractSources(response)
      };
    } catch (e) {
      console.warn("Project structure generation failed, using mock", e);
      return { data: this.getMockStructure(prompt), sources: [] };
    }
  }

  async generateFileContent(prompt: string, fileName: string, context: string): Promise<EnhancedResponse<string>> {
    if (this.isDemoMode || !this.ai) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          Görev: "${fileName}" dosyasını kodla.
          Proje Amacı: ${prompt}
          Mevcut Dosya Yapısı: ${context}
          
          Lütfen internetten bu dosya için gerekli olan en son dökümantasyonları ve kod örneklerini araştırarak hatasız bir içerik üret.
          Sadece kodu döndür.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 15000 },
          tools: [{ googleSearch: {} }]
        }
      });
      
      return {
        data: response.text || '// İçerik oluşturulamadı.',
        sources: this.extractSources(response)
      };
    } catch (e) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }
  }

  async getAutocomplete(currentCode: string, cursorContext: string): Promise<string> {
    if (this.isDemoMode || !this.ai) return "  // Otomatik tamamlama simülasyonu";
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Kodun devamını tamamla:\n${currentCode}\nBağlam: ${cursorContext}`,
      });
      return response.text || '';
    } catch { return ""; }
  }

  private getMockStructure(prompt: string) {
    return {
      projectName: "Offline-Project",
      files: [
        { path: "src/index.ts", purpose: "Main entry" },
        { path: "src/utils.ts", purpose: "Helper functions" }
      ]
    };
  }

  private getMockFileContent(fileName: string): string {
    return `// Demo modunda üretilen içerik: ${fileName}\nexport const run = () => console.log("Hello!");`;
  }
}
