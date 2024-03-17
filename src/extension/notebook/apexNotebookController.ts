import { NOTEBOOK_TYPE } from "../constants";
import * as vscode from 'vscode';
import * as CONSTANTS from '../constants';
import * as SalesforceHandler from '../handlers/salesforceHandler';
import * as sfdc_core from '@salesforce/core';
import * as sfdc from '@salesforce/apex-node';

export default class NotebookController {

    /*=========================================================
            Vars
    =========================================================*/

    readonly controllerId = 'anon-apex-notebook-controller';
    readonly notebookType = NOTEBOOK_TYPE;
    readonly notebookLabel = 'Anon Apex Notebook';
    readonly supportedLanguages = ['apex-anon', 'soql'];

    private readonly _controller: vscode.NotebookController;

    /*=========================================================
            Setup
    =========================================================*/

    constructor() {
        this._controller = vscode.notebooks.createNotebookController(
            this.controllerId,
            this.notebookType,
            this.notebookLabel
        );

        this._controller.supportedLanguages = this.supportedLanguages;
        this._controller.executeHandler = this._execute.bind(this);
    }

    /*=========================================================
            Methods
    =========================================================*/

    async _execute(
        cells: vscode.NotebookCell[],
        _notebook: vscode.NotebookDocument,
        _controller: vscode.NotebookController
    ) {
        //Check for confirmation dialog
        let cellsToProcess = [...cells];
        if(cells.some(pCell => pCell.document.languageId == 'apex-anon')) {
            let confirmDialogPreference = vscode.workspace.getConfiguration().get(CONSTANTS.SETTING_KEY_CONFIRM_DIALOG_PREFERENCE);
            if(
                confirmDialogPreference == CONSTANTS.CONFIRM_DIALOG_OPTION_ALWAYS 
                || confirmDialogPreference == CONSTANTS.CONFIRM_DIALOG_OPTION_ONLY_MULTIPLE 
                && cells.length > 1
            ) {
                //Vars
                let amountOfApexCells = cells.filter(pCell => pCell.document.languageId == 'apex-anon').length;
                let amountOfSoqlCells = cells.filter(pCell => pCell.document.languageId == 'soql').length;
                let options = [];
                //Generate options
                options.push(`Execute ${amountOfApexCells} Apex script(s) and ${amountOfSoqlCells} SOQL queries`);
                if(amountOfApexCells !== 0 && amountOfSoqlCells !== 0) {
                    if(amountOfApexCells > 0) {
                        //If there are some SOQLs and some Apex, display an option to only execute SOQLs
                        options.push('Execute only Apex');
                    }
                    if(amountOfSoqlCells > 0) {
                        //If there are some SOQLs and some Apex, display an option to only execute SOQLs
                        options.push('Execute only SOQLs');
                    }
                }
                options.push('Cancel');
                //Show quick pick
                let answer = await vscode.window.showQuickPick(options, {
                    title: `Are you sure you want to execute ${amountOfApexCells} anonymous apex cell(s)?`
                });
                //If answer wasn't selected or cancel was pressed, exit.
                //If answer was Execute only SOQLs, then filter out anything except SOQLs
                //Otherwise continue on as normal and execute all cells
                if(!answer || answer === 'Cancel') {
                    return;
                } else if(answer === 'Execute only SOQLs') {
                    cellsToProcess = cells.filter(pCell => pCell.document.languageId === 'soql');
                } else if(answer === 'Execute only Apex') {
                    cellsToProcess = cells.filter(pCell => pCell.document.languageId === 'apex');
                }
            }
        }
        //Run execute
        for(let cell of cellsToProcess) {
            this._doExecution(cell);
        }
    }

    async _doExecution(
        cell: vscode.NotebookCell
    ) {
        let executionTask = this._controller.createNotebookCellExecution(cell);
        executionTask.start(Date.now());
        executionTask.clearOutput();
        let success = false;
        try {
            //Grab via queue option so if multiple apex scripts are running, we only initialise
            //the service and related config once
            let connection = await SalesforceHandler.getSalesforceConnection();
            //Switch depending on type
            switch(cell.document.languageId) {
                case 'apex-anon':
                    success = await this.executeApex(cell, connection, executionTask);
                    break;
                case 'soql':
                    success = await this.executeSoql(cell, connection, executionTask);
                    break;
                default:
                    throw new Error('Unsupported language found: ' + cell.document.languageId);
            }
            
        } catch(ex: any) {
            console.error(ex);
            executionTask.replaceOutput(new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(ex)
            ]));
        } finally {
            executionTask.end(success, Date.now());
        }

    }

    async executeApex(pCell: vscode.NotebookCell, pConnection: sfdc_core.Connection, pExecutionTask: vscode.NotebookCellExecution): Promise<boolean> {
        //Grab execute service
        let executor = new sfdc.ExecuteService(pConnection);
        //Execute apex
        let response = await executor.executeAnonymous({
            apexCode: pCell.document.getText()
        });
        if(response.diagnostic) {
            pExecutionTask.appendOutput(new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.json(
                    response.diagnostic
                )
            ]));
        } 
        if(response.logs) {
            pExecutionTask.appendOutput(new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.text(response.logs)
            ]));
        }
        return response.compiled && response.success;
    }

    async executeSoql(pCell: vscode.NotebookCell, pConnection: sfdc_core.Connection, pExecutionTask: vscode.NotebookCellExecution): Promise<boolean> {    
        let queryResult = await pConnection.query(pCell.document.getText());
        
        pExecutionTask.appendOutput(
            new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.json(
                    queryResult,
                    CONSTANTS.RENDERER_SOQL
                )
            ])
        );
        return queryResult.done;
    }

    dispose() {

    }

}