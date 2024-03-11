import { TextEncoder, TextDecoder } from 'util';
import * as vscode from 'vscode';

interface RawNotebookCell {
    source: string[];
    cellType: 'code' | 'markdown';
    language: string;
}

export default class ApexNotebookSerializer implements vscode.NotebookSerializer {

    async deserializeNotebook(
      content: Uint8Array,
      _token: vscode.CancellationToken
    ): Promise<vscode.NotebookData> {
      var contents = new TextDecoder().decode(content);
  
      let raw: RawNotebookCell[];
      try {
        raw = (<RawNotebookCell[]>JSON.parse(contents));
      } catch {
        raw = [];
      }
  
      const cells = raw.map(
        item =>
          new vscode.NotebookCellData(
            item.cellType === 'code'
              ? vscode.NotebookCellKind.Code
              : vscode.NotebookCellKind.Markup,
            item.source.join('\n'),
            item.cellType === 'code' ? item.language : 'markdown'
          )
      );
  
      return new vscode.NotebookData(cells);
    }
  
    async serializeNotebook(
      data: vscode.NotebookData,
      _token: vscode.CancellationToken
    ): Promise<Uint8Array> {
      let contents: RawNotebookCell[] = [];
  
      for (const cell of data.cells) {
        contents.push({
          cellType: cell.kind === vscode.NotebookCellKind.Code ? 'code' : 'markdown',
          source: cell.value.split(/\r?\n/g),
          language: cell.languageId
        });
      }
  
      return new TextEncoder().encode(JSON.stringify(contents));
    }
}