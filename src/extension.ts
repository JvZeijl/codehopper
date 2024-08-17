import * as vscode from 'vscode';
import { Codehopper } from './codehopper';

export function activate(context: vscode.ExtensionContext) {
	const codehopper = new Codehopper(context);
	const openHopperCommand = vscode.commands.registerTextEditorCommand('codehopper.openHopper', textEditor => {
		codehopper.open(textEditor);
	});

	context.subscriptions.push(openHopperCommand);
}

export function deactivate() {

}
