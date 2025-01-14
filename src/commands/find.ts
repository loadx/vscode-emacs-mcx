import * as vscode from "vscode";
import { TextEditor } from "vscode";
import { EmacsCommand } from ".";
import { IEmacsController } from "../emulator";
import { MessageManager } from "../message";
import { revealPrimaryActive } from "./helpers/reveal";

export interface SearchState {
  startSelections: vscode.Selection[] | undefined;
}

abstract class IsearchCommand extends EmacsCommand {
  protected searchState: SearchState;

  public constructor(emacsController: IEmacsController, searchState: SearchState) {
    super(emacsController);

    this.searchState = searchState;
  }
}

export class IsearchForward extends IsearchCommand {
  public readonly id = "isearchForward";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("editor.actions.findWithArgs", {
        searchString: undefined,
        replaceString: undefined,
        isRegex: false,
        matchWholeWord: false,
        isCaseSensitive: false,
        preserveCase: false,
      })
      .then(() => vscode.commands.executeCommand<void>("editor.action.nextMatchFindAction"));
  }
}

export class IsearchBackward extends IsearchCommand {
  public readonly id = "isearchBackward";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("editor.actions.findWithArgs", {
        searchString: undefined,
        replaceString: undefined,
        isRegex: false,
        matchWholeWord: false,
        isCaseSensitive: false,
        preserveCase: false,
      })
      .then(() => vscode.commands.executeCommand<void>("editor.action.previousMatchFindAction"));
  }
}

export class IsearchForwardRegexp extends IsearchCommand {
  public readonly id = "isearchForwardRegexp";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("editor.actions.findWithArgs", {
        searchString: undefined,
        replaceString: undefined,
        isRegex: true,
        matchWholeWord: false,
        isCaseSensitive: false,
        preserveCase: false,
      })
      .then(() => vscode.commands.executeCommand<void>("editor.action.nextMatchFindAction"));
  }
}

export class IsearchBackwardRegexp extends IsearchCommand {
  public readonly id = "isearchBackwardRegexp";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    return vscode.commands
      .executeCommand("editor.actions.findWithArgs", {
        searchString: undefined,
        replaceString: undefined,
        isRegex: true,
        matchWholeWord: false,
        isCaseSensitive: false,
        preserveCase: false,
      })
      .then(() => vscode.commands.executeCommand<void>("editor.action.previousMatchFindAction"));
  }
}

export class QueryReplace extends IsearchCommand {
  public readonly id = "queryReplace";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    // I could not find a way to open the find widget with `editor.actions.findWithArgs`
    // revealing the replace input and restoring the both query and replace strings.
    // So `editor.action.startFindReplaceAction` is used here.
    return vscode.commands.executeCommand("editor.action.startFindReplaceAction");
  }
}

export class QueryReplaceRegexp extends IsearchCommand {
  public readonly id = "queryReplaceRegexp";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    this.searchState.startSelections = textEditor.selections;
    // Like `queryReplace` command, I could not find a way to open the find widget with the desired state.
    // In this command, setting `isRegex` is the priority and I gave up restoring the replace string by setting ´replaceString=undefined`.
    return vscode.commands.executeCommand("editor.actions.findWithArgs", {
      searchString: undefined,
      replaceString: "",
      isRegex: true,
      matchWholeWord: false,
      isCaseSensitive: false,
      preserveCase: false,
    });
  }
}

/**
 * C-g
 */
export class IsearchAbort extends IsearchCommand {
  public readonly id = "isearchAbort";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    if (this.searchState.startSelections) {
      textEditor.selections = this.searchState.startSelections;
    }
    MessageManager.showMessage("Quit");
    revealPrimaryActive(textEditor);
    return vscode.commands.executeCommand("closeFindWidget");
  }
}

/**
 * Enter, etc
 */
export class IsearchExit extends IsearchCommand {
  public readonly id = "isearchExit";

  public execute(textEditor: TextEditor, isInMarkMode: boolean, prefixArgument: number | undefined): Thenable<void> {
    if (this.searchState.startSelections) {
      this.emacsController.pushMark(this.searchState.startSelections.map((selection) => selection.anchor));
      MessageManager.showMessage("Mark saved where search started");
    }
    return vscode.commands
      .executeCommand("closeFindWidget")
      .then(() => vscode.commands.executeCommand("cancelSelection"));
  }
}
