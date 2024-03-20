# Change Log

All notable changes to the "anonymous-apex-notebook" extension will be documented in this file.

## 0.4.0

- Added text for when no records are returned
- Added primitive support for displaying lookup fields (e.g MyLookup__r.Name)
- Added primitive support for child relationships
- 'Id' column will now always show as the first column

## 0.3.0

- Added option to execute only Apex when running a mixture of Apex and SOQLs
- Extension's code cleanup
- Added "Total Records" above SOQL results
  - This means COUNT() queries should now work correctly

## 0.2.0

- Renamed configs to camelCase so VSCode will display the config names properly.
- Added in `enableSoqlJsonOutput` setting to optionally allow users to display the JSON response when running a SOQL 
- Made this changelog pretty
- Added option to execute only SOQLs when running a mixture of Apex and SOQLs

## 0.1.2

- More minor config updates

## 0.1.1

- Minor config updates

## 0.1.0

- Initial VSCode release. Contains a barebones experience for holding various apex scripts and SOQL queries