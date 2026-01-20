
import { GoogleGenAI, Type } from "@google/genai";

export interface ScrapedData {
  id: string;
  topic: string;
  timestamp: string;
  summary: string;
  technicalDetails: string[];
  sources: { title: string; uri: string }[];
}

export class WebResearchService {
  private STORAGE_KEY = 'RESEARCH_VAULT_DATA';

  constructor() {}

  // LocalStorage'dan geçmiş verileri getir
  getStoredResearch(): ScrapedData[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Veriyi kalıcı olarak kaydet
  private storeData(newData: ScrapedData) {
    const existing = this.getStoredResearch();
    const updated = [newData, ...existing];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  // İnternetten bilgi topla ve analiz et
  async performResearch(topic: string): Promise<ScrapedData> {
    // İnternet taraması için sistemin sağladığı arama motorunu kullanıyoruz
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `
          GÖREV: İnterneti tara ve şu konu hakkında derinlemesine teknik bilgi topla: "${topic}"
          
          Lütfen şu yapıda bir veri paketi oluştur (JSON):
          1. Kısa teknik özet.
          2. En az 5 adet kritik teknik detay/bulgu.
        `,
        config: {
          thinkingConfig: { thinkingBudget: 25000 },
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              technicalDetails: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["summary", "technicalDetails"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      // Kaynakları ayıkla
      const sources: { title: string; uri: string }[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web) sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        });
      }

      const scrapedData: ScrapedData = {
        id: Date.now().toString(),
        topic,
        timestamp: new Date().toLocaleString('tr-TR'),
        summary: result.summary,
        technicalDetails: result.technicalDetails,
        sources: sources
      };

      this.storeData(scrapedData);
      return scrapedData;
    } catch (e) {
      console.error("Research error:", e);
      throw e;
    }
  }

  clearVault() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
