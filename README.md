# Apex Notebook VSCode Extension

## Features

Allows the creation of an "Apex Notebook" which enables the execution of Anonymous Apex and SOQL queries within the UI of VSCode's Notebook framework

![Demo](media/demo.gif)

## Commands

- "Create: New Apex Notebook" - Creates a new apex notebook for use

## Requirements

The following extensions are required due to the language support:
- [Apex (Salesforce)](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode-apex) 
- [SOQL (Salesforce)](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode-soql) 

## Extension Settings

This extension contributes the following settings:

* `anonymous-apex-notebook.confirm-dialog-preference`: Picklist which dictates whether running Apex should confirm the action of executing the anonymous apex script.

## Planned additions

- Eventually I want to add a custom renderer to make it a cleaner display for apex issues and query results
- Some form of username configuration, at the moment it will only use the default username set in your workspace

## Known Issues

None at the moment, let me know if you run into anything via github issues!

## Release Notes

### 0.1.0

Initial VSCode release. Contains a barebones experience for holding various apex scripts and SOQL queries