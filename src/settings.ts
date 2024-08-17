import * as vscode from "vscode";

export type SettingNames = keyof Settings;
export type Settings = {
    disableHighlightingWhenHopping: boolean
};

export function getSetting<Name extends SettingNames>(settingName: Name, defaultValue: Settings[Name]) {
    return vscode.workspace.getConfiguration('codehopper').get(settingName, defaultValue);
}