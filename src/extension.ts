import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const openHopperCommand = vscode.commands.registerCommand('codehopper.openHopper', () => {
		vscode.window.showInformationMessage('Opening codehopper');
	});

	context.subscriptions.push(openHopperCommand);
}

export function deactivate() {

}
