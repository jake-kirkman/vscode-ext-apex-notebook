import { NOTEBOOK_TYPE } from "../constants";
import * as vscode from 'vscode';
import * as CONSTANTS from '../constants';
import * as DataHandler from '../handlers/dataHandler';
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
        if(cells.some(pCell => pCell.document.languageId == 'apex-anon')) {
            let confirmDialogPreference = vscode.workspace.getConfiguration().get(CONSTANTS.SETTING_KEY_CONFIRM_DIALOG_PREFERENCE);
            if(
                confirmDialogPreference == CONSTANTS.CONFIRM_DIALOG_OPTION_ALWAYS 
                || confirmDialogPreference == CONSTANTS.CONFIRM_DIALOG_OPTION_ONLY_MULTIPLE 
                && cells.length > 1
            ) {
                let answer = await vscode.window.showQuickPick([
                    'Execute Apex',
                    'Cancel'
                ], {
                    title: `Are you sure you want to execute ${cells.length} anonymous apex cells?`
                });
                if(!answer || answer == 'Cancel') {
                    return;
                }
            }
        }
        //Run execute
        for(let cell of cells) {
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
            let connection = await DataHandler.getLocalWithQueue<sfdc_core.Connection>(
                CONSTANTS.STORAGE_KEY_APEX_EXECUTE_SERVICE,
                this.getConnectionForDefaultUsername.bind(this)
            );
            //Switch depending on type
            switch(cell.document.languageId) {
                case 'apex-anon':
                    //Grab execute service
                    let executor = new sfdc.ExecuteService(connection);
                    //Execute apex
                    let response = await executor.executeAnonymous({
                        apexCode: cell.document.getText()
                    });
                    success = response.compiled && response.success;
                    if(response.diagnostic) {
                        executionTask.appendOutput(new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.json(
                                response.diagnostic
                            )
                        ]));
                    } 
                    if(response.logs) {
                        executionTask.appendOutput(new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(response.logs)
                        ]));
                    }
                    
                    break;
                case 'soql':
                    
                    let queryResult = await connection.query(cell.document.getText());
                    success = queryResult.done;
                    let markdownOutput = this.outputRecordAsHtmlTable(queryResult.records);

                    let output: vscode.NotebookCellOutputItem[] = [];
                    output.push(vscode.NotebookCellOutputItem.text(markdownOutput, 'text/html'));
                    if(true == vscode.workspace.getConfiguration().get(CONSTANTS.SETTING_KEY_DISPLAY_JSON_OUTPUT)) {
                        output.push(vscode.NotebookCellOutputItem.json(queryResult.records));
                    }
                    
                    executionTask.appendOutput(new vscode.NotebookCellOutput(output));
                    break;
                default:
                    throw new Error('Unsupported language found: ' + cell.document.languageId);
            }
            
        } catch(ex) {
            console.error(ex);
            executionTask.replaceOutput(new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.json(ex)
            ]));
        } finally {
            executionTask.end(success, Date.now());
        }

    }

    outputRecordAsHtmlTable(pRecords: {[key: string]: any}[]): string {
        let rows: string[][] = [];
        if(pRecords.length > 0) {
            //Grab headers
            let headers = Object.keys(pRecords[0]).filter(pKey => pKey != 'attributes').sort();
            console.log('Headers : ' + JSON.stringify(headers));
            rows.push(headers);
            //Process records
            rows.push(
                ...pRecords.map(
                    pRecord => headers.map(
                        header => (
                            '' + (pRecord[header] || ' ')
                        ).replace(
                            /\r\n|\n/, '<br/>'
                        )
                    )
                )
            );
        }
        return '<table>' + rows.map((pArray, pIndex) => {
            let tagName = pIndex == 0 ? 'th' : 'td';
            let combinedRow = `<tr>` + pArray.map(pItem => `<${tagName}>${pItem}</${tagName}>`).join('') + '</tr>';
            return combinedRow;
        }).join('') + '</table>';
    }

    /**
     * Based on the Salesforce VSCode plugins, this is how they obtain an execute service
     * that allows apex scripts to be ran in the target org for the default username
     * @returns SFDC Execute Service for executing apex
     */
    async getConnectionForDefaultUsername() {
        //Grab config aggregator which contains the default username/alias
        let configAggregator = await sfdc_core.ConfigAggregator.create();
        let defaultUsernameOrAlias = JSON.stringify(configAggregator.getPropertyValue('target-org')).replace(/"/g, '');
        
        //In order to build an AuthInfo object, we need a username, not an alias
        //so this grabs it out of the alias map. Of course if it's simply a username to begin with
        //then we use that if we can't find the alias in the map
        let info = await sfdc_core.StateAggregator.getInstance();
        let defaultUsername = info.aliases.getUsername(defaultUsernameOrAlias) || defaultUsernameOrAlias;

        //Build a connection using the default username
        return await sfdc_core.Connection.create({
            authInfo: await sfdc_core.AuthInfo.create({
                username: defaultUsername
            })
        });
    }

    dispose() {

    }

}