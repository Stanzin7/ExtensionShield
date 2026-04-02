"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    void context;
    vscode.window.showInformationMessage('ExtensionShield is active!');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map