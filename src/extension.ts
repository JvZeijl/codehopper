import * as vscode from 'vscode';
import { Codehopper } from './codehopper';

export function activate(context: vscode.ExtensionContext) {
	let codehopper = new Codehopper(context);
	
	const settingsListener = vscode.workspace.onDidChangeConfiguration(changeEvent => {
		if (changeEvent.affectsConfiguration('codehopper')) codehopper = new Codehopper(context);
	});

	const openHopperCommand = vscode.commands.registerTextEditorCommand('codehopper.openHopper', textEditor => {
		codehopper.open(textEditor);
	});

	context.subscriptions.push(openHopperCommand, settingsListener);
}

export function deactivate() {

}
