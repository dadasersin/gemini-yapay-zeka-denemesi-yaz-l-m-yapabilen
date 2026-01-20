
export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'security' | 'performance' | 'best-practice';
  title: string;
  description: string;
  suggestion: string;
}

export interface ProjectAudit {
  score: number;
  issues: SecurityIssue[];
  summary: string;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'pending';
  expected: string;
  actual?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  files: GeneratedFile[];
  tests: TestCase[];
  audit?: ProjectAudit;
  status: 'idle' | 'generating' | 'reviewing' | 'optimizing' | 'compiling' | 'completed' | 'error';
  progress: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  basePrompt: string;
}

export enum ProcessStep {
  INITIAL_DRAFT = 'INITIAL_DRAFT',
  SELF_REVIEW = 'SELF_REVIEW',
  OPTIMIZATION = 'OPTIMIZATION',
  BUILD_READY = 'BUILD_READY'
}
