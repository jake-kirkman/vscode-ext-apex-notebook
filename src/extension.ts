// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ApexNotebookController from './notebook/apexNotebookController';
import ApexNotebookSerializer from './notebook/apexNotebookSerializer';
import * as CONSTANTS from './constants';
import * as DataHandler from './handlers/dataHandler';
import * as LogHandler from './handlers/logHandler';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anonymous-apex-notebook" is now active!');

    DataHandler.initiate(context);
    LogHandler.initiate();

    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(CONSTANTS.NOTEBOOK_TYPE, new ApexNotebookSerializer())
    );
    context.subscriptions.push(
        new ApexNotebookController()
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_NEW_NOTEBOOK,
            async () => {
                let notebook = await vscode.workspace.openNotebookDocument(
                    CONSTANTS.NOTEBOOK_TYPE,
                    new vscode.NotebookData([
                        new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '// Your anonymous apex script goes here!', 'apex-anon'),
                        new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'SELECT Id, Name FROM Account', 'soql'),
                    ])
                );
                vscode.window.showNotebookDocument(notebook);
            }
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
