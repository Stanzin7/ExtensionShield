import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  void context;
  vscode.window.showInformationMessage('ExtensionShield is active!');
}

export function deactivate() {}
