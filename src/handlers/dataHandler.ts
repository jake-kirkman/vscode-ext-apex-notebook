/*=========================================================
        Imports
=========================================================*/

import * as vscode from 'vscode';

/*=========================================================
        Constants
=========================================================*/

const REQUIRED_EXTENSION_CONFIGURATIONS: string[] = [

];

/*=========================================================
        Vars
=========================================================*/

var ExtensionContext: vscode.ExtensionContext;
var Events: Map<string, vscode.EventEmitter<any>> = new Map<string, vscode.EventEmitter<any>>();
var LocalStorage: Map<string, any> = new Map<string, any>();
var LocalStoragePromiseQueue: Map<string, {resolve:Function, reject:Function}[]> = new Map<string, {resolve:Function, reject:Function}[]>();


/*=========================================================
        Startup
=========================================================*/

export function validateRequiredSettings(pShowMessage: boolean = true) {
    let missingConfigs = [];
    for(let config of REQUIRED_EXTENSION_CONFIGURATIONS) {
        if(!vscode.workspace.getConfiguration().get(config)) {
            missingConfigs.push(config);
        }
    }
    if(missingConfigs.length != 0 && pShowMessage) {
        vscode.window.showWarningMessage(`You are missing required configurations. Navigate to Extension settings and update the following: [${missingConfigs.join(', ')}]`);
    }
    return missingConfigs.length == 0;
}

/**
 * Startup logic
 * @param pContext VSCode context
 * @returns True if configs are valid, false otherwise
 */
export function initiate(pContext: vscode.ExtensionContext) {
    ExtensionContext = pContext;
}

/*=========================================================
        Extension Context
=========================================================*/

/**
 * Gets the extension context
 * @returns Returns ExtensionContext
 */
export function getExtensionContext() {
    return ExtensionContext;
}

/*=========================================================
        Events
=========================================================*/

export function registerEvent<T>(pEventName:string): vscode.EventEmitter<T> {
    let emitter = new vscode.EventEmitter<T>();
    Events.set(pEventName, emitter);
    getExtensionContext().subscriptions.push(emitter);
    return emitter;
}

export function onEvent(pEventName: string, pListener: (pEvent: any) => any, pThisContext?: any): vscode.Disposable {
    let emitter = Events.get(pEventName);
    if(undefined == emitter) throw new Error(`Event ${pEventName} not registered`);
    return emitter.event(pListener, pThisContext, getExtensionContext().subscriptions);
}

export function fireEvent(pEventName: string, pData:any) {
    let emitter = Events.get(pEventName);
    if(undefined == emitter) throw new Error(`Event ${pEventName} not registered`);
    emitter.fire(pData);
}

export function unregisterEvent(pEventName: string): Boolean {
    let emitter = Events.get(pEventName);
    if(undefined != emitter) {
        emitter.dispose();
        return true;
    }
    return false;
}

/*=========================================================
        Local Storage
=========================================================*/

/**
 * Simple local storage
 * @param pKey String Identifier of thing to store
 * @param pData Data to store
 */
export function storeLocal(pKey:string, pData:any) {
    LocalStorage.set(pKey, pData);
}

/**
 * Fetches an item out of the local storage
 * @param pKey String Identifier to fetch from storage
 * @returns Data stored in storage
 */
export function getLocal<T>(pKey:string) {
    return LocalStorage.get(pKey) as T;
}

/**
 * Removes the key and data stored in LocalStorage, and returns the value of the deleted key.
 * @param pKey String Identifier to remove from storage
 * @returns Removed data
 */
export function removeLocal(pKey: string) {
    let data = LocalStorage.get(pKey);
    LocalStorage.delete(pKey);
    return data;
}

/**
 * Fetches an item out of local storage, if it returns undefined, the provided
 * function is called.
 * @param pKey String Identifier to fetch form storage
 * @param pFunction Function to call if the provided key returns undefined. Function should return item intended to be stored in storage
 * @returns Promise resolving to item out of the map
 */
export function getLocalWithQueue<T>(pKey:string, pFunction:Function): Promise<T> {
    return new Promise(async (pResolve, pReject) => {
        let ret = getLocal(pKey);
        if(undefined == ret) {
            let promiseArray = LocalStoragePromiseQueue.get(pKey);
            if(undefined == promiseArray) {
                promiseArray = [];
                LocalStoragePromiseQueue.set(pKey, promiseArray);
            }
            promiseArray.push({resolve: pResolve, reject: pReject});
            if(promiseArray.length == 1) {
                try {
                    let result = await pFunction();
                    storeLocal(pKey, result);
                    promiseArray.splice(0, promiseArray.length).forEach(prom => prom.resolve(result as T));
                } catch(ex) {
                    promiseArray.splice(0, promiseArray.length).forEach(prom => prom.reject(ex));
                }
            }
        } else {
            pResolve(ret as T);
        }
    });
}