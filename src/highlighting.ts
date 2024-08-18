import * as vscode from 'vscode';
import { getSetting } from './settings';

export function getOccurences(textEditor: vscode.TextEditor, searchStr: string, matchCase: boolean) {
    const visibleRange = textEditor.visibleRanges[0];
    const foundRanges: vscode.Range[] = [];

    searchStr = matchCase ? searchStr : searchStr.toLowerCase();
    for (let lineIndex = visibleRange.start.line; lineIndex <= visibleRange.end.line; lineIndex++) {
        const line = textEditor.document.lineAt(lineIndex);
        const lineText = matchCase ? line.text : line.text.toLowerCase();
        
        let startColumn = 0;
        while(startColumn < lineText.length) {
            let foundColumn = lineText.indexOf(searchStr, startColumn);

            if (foundColumn >= 0) {
                const newStartColumn = foundColumn + searchStr.length;

                foundRanges.push(new vscode.Range(lineIndex, foundColumn, lineIndex, newStartColumn));
                startColumn = newStartColumn;
            } else break;
        }
    }

    return foundRanges;
}

export function getLabelDecorations(textEditor: vscode.TextEditor, ranges: vscode.Range[], searchStr: string, matchCase: boolean): [string[], vscode.TextEditorDecorationType[]] {
    const labels = [];
    const labelDecorations = [];
    const nextCharacters = ranges.map(range => {
        const chr = textEditor.document.getText(new vscode.Range(range.start, new vscode.Position(range.end.line, range.end.character + 1))).charAt(searchStr.length);
        return matchCase ? chr : chr.toLowerCase();
    });

    for (let label of parseLabelsFromSettings()) {
        if (labelDecorations.length >= ranges.length) break;
        if (nextCharacters.includes(matchCase ? label : label.toLowerCase())) continue;

        labels.push(label);
        labelDecorations.push(
            vscode.window.createTextEditorDecorationType({
                backgroundColor: 'var(--vscode-editorOverviewRuler-findMatchForeground)',
                after: {
                    contentText: label,
                    backgroundColor: 'var(--vscode-button-background)',
                    color: 'white'
                }
            })
        );
    }

    return [labels, labelDecorations];
}

export function setHighlights(textEditor: vscode.TextEditor, labelDecorations: vscode.TextEditorDecorationType[], ranges: vscode.Range[]) {
    if (ranges.length > labelDecorations.length) console.info('Could not create enough unique labels.');

    for (let i = 0; i < Math.max(ranges.length, labelDecorations.length); i++) {
        textEditor.setDecorations(labelDecorations[i], ranges[i] ? [ranges[i]] : []);
    }
}

export function parseLabelsFromSettings() {
    return getSetting('segmentLabels', '').split(' ').filter((label, index, array) => array.indexOf(label) === index);
}
