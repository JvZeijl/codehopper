import * as vscode from 'vscode';
import { Codehopper } from './codehopper';

export const MATCH_CASE_STATE_KEY = 'codehopperMatchCase';

export function activate(context: vscode.ExtensionContext) {
	let codehopper = new Codehopper(context);
	
	const settingsListener = vscode.workspace.onDidChangeConfiguration(changeEvent => {
		if (changeEvent.affectsConfiguration('codehopper')) codehopper = new Codehopper(context);
	});

	const openHopperCommand = vscode.commands.registerTextEditorCommand('codehopper.openHopper', textEditor => {
		codehopper.open(textEditor);
	});

	const toggleMatchCaseCommand = vscode.commands.registerCommand('codehopper.toggleMatchCase', () => {
		codehopper.toggleMatchCase();
	});

	context.subscriptions.push(settingsListener, openHopperCommand, toggleMatchCaseCommand);
}

export function deactivate() {

}
