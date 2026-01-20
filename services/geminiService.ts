
// @google/genai guidelines followed: per-call initialization, direct process.env.API_KEY access, and proper result extraction.
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from "../types";

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TechnicalKnowledge {
  topic: string;
  summary: string;
  libraries: { name: string; version: string; reason: string }[];
  keyFacts: string[];
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

  /**
   * Phase 1: Deep Research
   * Specifically instructs Gemini to act as a data scraper and aggregator.
   */
  async collectKnowledge(prompt: string): Promise<EnhancedResponse<TechnicalKnowledge>> {
    if (this.isDemoMode) {
      return { 
        data: { 
          topic: prompt, 
          summary: "Demo knowledge base generated offline.", 
          libraries: [{ name: "React", version: "18.x", reason: "Stable default" }],
          keyFacts: ["Researching is simulated in demo mode."] 
        }, 
        sources: [] 
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          GÖREV: İnterneti kullanarak şu konu hakkında teknik araştırma yap ve veri topla: "${prompt}"
          
          Lütfen şu bilgileri topla ve JSON olarak sakla:
          1. Konunun teknik özeti.
          2. Kullanılması gereken en güncel kütüphaneler (versiyonlarıyla birlikte).
          3. Uygulanması gereken kritik teknik gerçekler ve best-practice'ler.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 32000 },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              summary: { type: Type.STRING },
              libraries: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    version: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["name", "version", "reason"]
                }
              },
              keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["topic", "summary", "libraries", "keyFacts"]
          }
        }
      });

      return {
        data: JSON.parse(response.text || "{}"),
        sources: this.extractSources(response)
      };
    } catch (e) {
      console.error("Research failed:", e);
      throw e;
    }
  }

  async generateProjectStructure(prompt: string, knowledge: string): Promise<EnhancedResponse<any>> {
    if (this.isDemoMode) return { data: this.getMockStructure(prompt), sources: [] };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          TOPLANAN BİLGİLER: ${knowledge}
          HEDEF PROJE: ${prompt}
          
          Bu bilgilere dayanarak modern bir dosya yapısı oluştur (JSON):
          {
            "projectName": "project-slug",
            "files": [{"path": "src/App.tsx", "purpose": "Main view using collected libraries"}]
          }
        `,
        config: {
          thinkingConfig: { thinkingBudget: 15000 },
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
        data: JSON.parse(response.text || "{}"),
        sources: this.extractSources(response)
      };
    } catch (e) {
      return { data: this.getMockStructure(prompt), sources: [] };
    }
  }

  async generateFileContent(prompt: string, fileName: string, knowledge: string, context: string): Promise<EnhancedResponse<string>> {
    if (this.isDemoMode) return { data: this.getMockFileContent(fileName), sources: [] };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          DOSYA: ${fileName}
          ARAŞTIRILAN BİLGİLER: ${knowledge}
          BAĞLAM: ${context}
          
          Lütfen toplanan bilgiler ışığında en modern kodu yaz. Sadece kod döndür.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 20000 },
          tools: [{ googleSearch: {} }] // Keep search active for fine-tuned details
        }
      });

      return {
        data: response.text || '// Error generating content',
        sources: this.extractSources(response)
      };
    } catch (e) {
      return { data: this.getMockFileContent(fileName), sources: [] };
    }
  }

  private getMockStructure(prompt: string) {
    return {
      projectName: "Offline-Development",
      files: [
        { path: "src/main.ts", purpose: "Entry" },
        { path: "src/App.tsx", purpose: "Root Component" }
      ]
    };
  }

  private getMockFileContent(fileName: string): string {
    return `// Autonomous content for ${fileName}\nexport default function App() { return <div>Hello</div> }`;
  }
}
