import * as vscode from 'vscode';
import { Codehopper } from './codehopper';

export function activate(context: vscode.ExtensionContext) {
	let codehopper = new Codehopper(context);
	
	const settingsListener = vscode.workspace.onDidChangeConfiguration(changeEvent => {
		if (changeEvent.affectsConfiguration('codehopper')) codehopper.refresh();
	});

	const openHopperCommand = vscode.commands.registerTextEditorCommand('codehopper.openHopper', textEditor => {
		codehopper.open(textEditor);
	});

	const toggleMatchCaseCommand = vscode.commands.registerCommand('codehopper.toggleMatchCase', () => {
		codehopper.toggleMatchCase();
	});

	const toggleHightlightCommand = vscode.commands.registerCommand('codehopper.toggleHighlightDuringSearch', () => {
		const disabled = vscode.workspace.getConfiguration('codehopper').get<boolean>('disableHighlightingDuringSearch');
		vscode.workspace.getConfiguration('codehopper').update('disableHighlightingDuringSearch', !disabled, true);
	});

	context.subscriptions.push(settingsListener, openHopperCommand, toggleMatchCaseCommand, toggleHightlightCommand);
}

export function deactivate() {

}
