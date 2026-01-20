
export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: GeneratedFile[];
  status: 'idle' | 'generating' | 'reviewing' | 'optimizing' | 'compiling' | 'completed' | 'error';
  progress: number;
}

export enum ProcessStep {
  INITIAL_DRAFT = 'INITIAL_DRAFT',
  SELF_REVIEW = 'SELF_REVIEW',
  OPTIMIZATION = 'OPTIMIZATION',
  BUILD_READY = 'BUILD_READY'
}
