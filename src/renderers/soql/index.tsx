/*=========================================================
        Imports
=========================================================*/

import type { ActivationFunction } from 'vscode-notebook-renderer';
// import { h, render } from 'preact';

/*=========================================================
        Methods
=========================================================*/

/*=========================================================
        Entry Method
=========================================================*/

export const activate: ActivationFunction = (context) => ({
    renderOutputItem(data, element) {
        element.innerText = JSON.stringify(data.json());
    }
});