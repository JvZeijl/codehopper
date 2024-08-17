import * as vscode from "vscode";
import { getSetting } from "./settings";
import { getLabelDecorations, getOccurences, setHighlights } from "./highlighting";

const MATCH_CASE_STATE_KEY = 'codehopperMatchCase';
const NO_HIGHLIGHT_DECORATION = vscode.window.createTextEditorDecorationType({
    color: 'var(--vscode-editor-foreground)'
});

export class Codehopper {
    private disableHighlightingWhenHopping = getSetting('disableHighlightingWhenHopping', false);

    private activeTextEditor: vscode.TextEditor | null = null;
    private inputBox: vscode.InputBox | null = null;
    private buttons = new Map<vscode.QuickInputButton, () => void>();

    private currentRanges: vscode.Range[] = [];
    private currentLabels: string[] = [];
    private currentLabelDecorations: vscode.TextEditorDecorationType[] = [];
    
    get matchCase() {
        return this.context.globalState.get<boolean>(MATCH_CASE_STATE_KEY, false);
    }

    set matchCase(matchCase) {
        this.context.globalState.update(MATCH_CASE_STATE_KEY, matchCase);

        if (this.inputBox) this.createButtons(this.inputBox);
    }

    constructor(private readonly context: vscode.ExtensionContext) { }

    open(textEditor: vscode.TextEditor) {
        if (this.activeTextEditor !== null) {
            console.error('Codehopper is already open.');
            return;
        }

        this.activeTextEditor = textEditor;
        this.inputBox = this.createInputBox();
        this.inputBox.valueSelection = undefined; // Setting to undefined selects the whole input.
        this.inputBox.show();

        if (this.disableHighlightingWhenHopping) {
            this.activeTextEditor.setDecorations(NO_HIGHLIGHT_DECORATION, this.activeTextEditor.visibleRanges);
        }
    }

    close() {
        if (this.activeTextEditor === null || this.inputBox === null) {
            console.error('Codehopper is not open.');
            return;
        }
    
        if (this.disableHighlightingWhenHopping) {
            this.activeTextEditor.setDecorations(NO_HIGHLIGHT_DECORATION, []);
        }
        
        this.clearLabels();
        this.inputBox.dispose();
        this.buttons.clear();
        this.inputBox = null;
        this.activeTextEditor = null;
    }

    toggleMatchCase() {
        this.matchCase = !this.matchCase;
    }
    
    private search(searchStr: string) {
        if (this.activeTextEditor === null || this.inputBox === null) {
            console.error('Codehopper is not open.');
            return;
        }
    
        // Search string validation
        if (searchStr.length < 2) {
            this.inputBox.validationMessage = { message: 'Use at least two characters', severity: vscode.InputBoxValidationSeverity.Warning };
            this.clearLabels();
            return;
        } else this.inputBox.validationMessage = undefined;

        // Check if one of the options is selected
        for (let i = 0; i < this.currentRanges.length; i++) {
            if (!this.currentLabels[i]) break;

            const matchStr = this.activeTextEditor.document.getText(this.currentRanges[i]) + this.currentLabels[i];
            if ((this.matchCase && matchStr === searchStr) || matchStr.toLowerCase() === searchStr.toLowerCase()) {
                this.selectAndClose(this.currentRanges[i]);
                break;
            }
        }

        // Clear the old labels before generating the new ones
        this.clearLabels();

        this.currentRanges = getOccurences(this.activeTextEditor, searchStr, this.matchCase);
        const [labels, labelDecorations] = getLabelDecorations(this.activeTextEditor, this.currentRanges, searchStr);
        this.currentLabels = labels;
        this.currentLabelDecorations = labelDecorations;


        setHighlights(this.activeTextEditor, this.currentLabelDecorations, this.currentRanges);
    }

    private createInputBox() {
        const inputBox = vscode.window.createInputBox();

        this.createButtons(inputBox);
        inputBox.onDidChangeValue(this.search, this);
        inputBox.onDidTriggerButton(this.onButtonClick, this);
        inputBox.onDidHide(this.close, this);

        return inputBox;
    }

    private createButtons(inputBox: vscode.InputBox) {
        this.buttons.clear();
        this.buttons.set(
            {
                iconPath: new vscode.ThemeIcon(this.matchCase ? 'case-sensitive' : 'preserve-case'),
                tooltip: 'Match case'
            },
            this.toggleMatchCase.bind(this)
        );

        this.buttons.set({ iconPath: new vscode.ThemeIcon('close') }, this.close.bind(this));

        inputBox.buttons = Array.from(this.buttons.keys());
    }

    private onButtonClick(triggeredBtn: vscode.QuickInputButton) {
        this.buttons.get(triggeredBtn)?.call(this);
    }

    private selectAndClose(range: vscode.Range) {
        if (this.activeTextEditor === null) {
            console.error('Codehopper is not open.');
            return;
        }

        this.activeTextEditor.selection = new vscode.Selection(range.start, range.start);
        this.close();
    }

    private clearLabels() {
        if (this.activeTextEditor === null) {
            console.error('Codehopper is not open.');
            return;
        }

        setHighlights(this.activeTextEditor, this.currentLabelDecorations, []);
        this.currentRanges = [];
        this.currentLabels = [];
        this.currentLabelDecorations = [];
    }
}
