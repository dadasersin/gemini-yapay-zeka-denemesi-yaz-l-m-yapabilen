
export interface ScrapedData {
  id: string;
  topic: string;
  timestamp: string;
  summary: string;
  technicalDetails: string[];
  sources: { title: string; uri: string; stars?: number }[];
  repoStats?: {
    language: string;
    forks: number;
    license: string;
  };
}

export class WebResearchService {
  private STORAGE_KEY = 'GITHUB_VAULT_DATA';

  constructor() {}

  getStoredResearch(): ScrapedData[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private storeData(newData: ScrapedData) {
    const existing = this.getStoredResearch();
    const updated = [newData, ...existing];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
  }

  // GitHub üzerinden otonom araştırma yap
  async performResearch(topic: string): Promise<ScrapedData> {
    try {
      // GitHub Search API kullanımı - API Key gerektirmez (limitli olsa da genel aramaya açıktır)
      const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}+sort:stars`);
      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("Eşleşen GitHub projesi bulunamadı.");
      }

      // En iyi 3 projeyi analiz et
      const topRepos = data.items.slice(0, 5);
      const bestRepo = topRepos[0];

      const scrapedData: ScrapedData = {
        id: Date.now().toString(),
        topic: topic.toUpperCase(),
        timestamp: new Date().toLocaleString('tr-TR'),
        summary: `${bestRepo.full_name} projesi, ${topic} araması için en yüksek uyumlulukla bulundu. ${bestRepo.description || 'Açıklama bulunmuyor.'}`,
        technicalDetails: topRepos.map((repo: any) => 
          `${repo.name}: ${repo.stargazers_count} yıldız, ${repo.language || 'Belirsiz'} diliyle geliştirilmiş.`
        ),
        sources: topRepos.map((repo: any) => ({
          title: repo.full_name,
          uri: repo.html_url,
          stars: repo.stargazers_count
        })),
        repoStats: {
          language: bestRepo.language || 'N/A',
          forks: bestRepo.forks_count,
          license: bestRepo.license?.name || 'Belirtilmemiş'
        }
      };

      this.storeData(scrapedData);
      return scrapedData;
    } catch (e) {
      console.error("GitHub Research error:", e);
      throw e;
    }
  }

  clearVault() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
