export interface ToolResult {
  toolName: string;
  available: boolean;
  data: any;
  error?: string | null;
  sourceUrl?: string | null;
}

export class ToolResultHelper {
  static unavailable(toolName: string, reason: string): ToolResult {
    return { toolName, available: false, data: null, error: reason };
  }

  static ok(toolName: string, data: any, sourceUrl?: string | null): ToolResult {
    return { toolName, available: true, data, sourceUrl: sourceUrl || null };
  }
}

export class ResearchBundle {
  companyName: string;
  results: ToolResult[];

  constructor(companyName: string) {
    this.companyName = companyName;
    this.results = [];
  }

  add(result: ToolResult): void {
    this.results.push(result);
  }

  get availableResults(): ToolResult[] {
    return this.results.filter(r => r.available);
  }

  get unavailableTools(): string[] {
    return this.results.filter(r => !r.available).map(r => r.toolName);
  }

  toPromptContext(): string {
    if (this.availableResults.length === 0) {
      return "No external data sources were available. Reason from general knowledge only.";
    }

    return this.availableResults
      .map(r => `### Source: ${r.toolName}\n${r.data}`)
      .join('\n\n');
  }
}
