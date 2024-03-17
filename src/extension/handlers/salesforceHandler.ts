/*=========================================================
        Imports
=========================================================*/

import * as CONSTANTS from '../constants';
import * as DataHandler from './dataHandler';
import * as sfdc_core from '@salesforce/core';

/*=========================================================
        Exported Functions
=========================================================*/

export async function getSalesforceConnection() {
    //Grab via queue option so if multiple apex scripts are running, we only initialise
    //the service and related config once
    return await DataHandler.getLocalWithQueue<sfdc_core.Connection>(
        CONSTANTS.STORAGE_KEY_APEX_EXECUTE_SERVICE,
        getConnectionForDefaultUsername
    );
} 

/*=========================================================
        Helper Functions
=========================================================*/

/**
 * Based on the Salesforce VSCode plugins, this is how they obtain an execute service
 * that allows apex scripts to be ran in the target org for the default username
 * @returns SFDC Execute Service for executing apex
 */
async function getConnectionForDefaultUsername() {
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