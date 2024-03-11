/*=========================================================
        Imports
=========================================================*/

import * as vscode from 'vscode';
import * as dataHandler from './dataHandler'

/*=========================================================
        Vars
=========================================================*/

var Logger: vscode.OutputChannel;

/*=========================================================
        Methods
=========================================================*/

//Init
export function initiate() {
    Logger = vscode.window.createOutputChannel('Anonymous Apex Notebook');
    dataHandler.getExtensionContext().subscriptions.push(Logger);
}

//Misc
export function showLog() {
    Logger.show();
}

//Logging
function appendLine(pPrefix:string, pMessage:string) {
    Logger.appendLine(`${pPrefix}: ${pMessage}`);
}
export function log(pMessage: string) {appendLine('LOG', pMessage);}
export function warning(pMessage: string) {appendLine('WARNING', pMessage);}
export function debug(pMessage: string) {appendLine('DEBUG', pMessage);}
export function error(pMessage: string) {appendLine('ERROR', pMessage);}
