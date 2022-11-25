/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	SemanticTokens,
	SemanticTokensRequest,
	SemanticTokensParams,
	SemanticTokensBuilder,
	SemanticTokenTypes
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { BMD_PARSER, DieselCompletionProposal, DieselMarker, DieselParsers } from './typed-facade';
import { start } from 'repl';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

const allTokenTypes: readonly SemanticTokenTypes[] = [
	SemanticTokenTypes.keyword,
	SemanticTokenTypes.string,
	SemanticTokenTypes.enum,
];

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			},
			semanticTokensProvider: {
				legend: {
					tokenTypes: allTokenTypes.map((t) => t.toString()),
					tokenModifiers: [],
				},
				full: true,
			},
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

const DIAG_SOURCE = "my diesel";

function createDiagnostic(textDocument: TextDocument, severity: DiagnosticSeverity, start: number, end: number, message: string): Diagnostic {
	const diagnostic: Diagnostic = {
		severity,
		range: {
			start: textDocument.positionAt(start),
			end: textDocument.positionAt(end),
		},
		message,
		source: DIAG_SOURCE
	};
	return diagnostic;
}


const SEV_MAP: { [key: string]: DiagnosticSeverity } = {
	"info": DiagnosticSeverity.Information,
	"warning": DiagnosticSeverity.Warning,
	"error": DiagnosticSeverity.Error
};


function createDiagnosticFromDieselMarker(textDocument: TextDocument, m: DieselMarker): Diagnostic {
	return createDiagnostic(
		textDocument,
		SEV_MAP[m.severity] ?? "error",
		m.offset,
		m.offset + m.length,
		m.getMessage("en")
	);
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {

	const text = textDocument.getText();
	const parseRequest = DieselParsers.createParseRequest(text);
	const parseResult = BMD_PARSER.parse(parseRequest);
	const diagnostics: Diagnostic[] = [];
	if (parseResult.success) {
		// it's ok, look for markers
		parseResult.markers.forEach(marker => {
			diagnostics.push(
				createDiagnosticFromDieselMarker(textDocument, marker)
			);
		});
	} else {
		// parsing error
		// TODO better logging
		diagnostics.push(createDiagnostic(textDocument, DiagnosticSeverity.Error, 0, text.length, parseResult.error ?? "Unhandled parsing error :/"));
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

// async function validateTextDocument(textDocument: TextDocument): Promise<void> {
// 	// In this simple example we get the settings for ev	ery validate run.
// 	const settings = await getDocumentSettings(textDocument.uri);

// 	// The validator creates diagnostics for all uppercase words length 2 and more
// 	const text = textDocument.getText();
// 	const pattern = /\b[A-Z]{2,}\b/g;
// 	let m: RegExpExecArray | null;

// 	let problems = 0;
// 	const diagnostics: Diagnostic[] = [];
// 	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
// 		problems++;
// 		const diagnostic: Diagnostic = {
// 			severity: DiagnosticSeverity.Warning,
// 			range: {
// 				start: textDocument.positionAt(m.index),
// 				end: textDocument.positionAt(m.index + m[0].length)
// 			},
// 			message: `${m[0]} is all uppercase.`,
// 			source: 'diesel'
// 		};
// 		if (hasDiagnosticRelatedInformationCapability) {
// 			diagnostic.relatedInformation = [
// 				{
// 					location: {
// 						uri: textDocument.uri,
// 						range: Object.assign({}, diagnostic.range)
// 					},
// 					message: 'Spelling matters'
// 				},
// 				{
// 					location: {
// 						uri: textDocument.uri,
// 						range: Object.assign({}, diagnostic.range)
// 					},
// 					message: 'Particularly for names'
// 				}
// 			];
// 		}
// 		diagnostics.push(diagnostic);
// 	}

// 	// Send the computed diagnostics to VSCode.
// 	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
// }

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {

		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (!document) {
			return [];
		}

		const offset = document.offsetAt(_textDocumentPosition.position);
		const predictRequest = DieselParsers.createPredictRequest(document.getText(), offset);
		const predictResult = BMD_PARSER.predict(predictRequest);
		if (!predictResult.success) {
			connection.console.error(predictResult.error ?? "Failed to parse, cannot predict");
			return [];
		}

		return predictResult.proposals.map(p => {
			return {
				label: p.text,
				kind: CompletionItemKind.Text,
				data: p,
			};
		}); 
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		const d = item.data as DieselCompletionProposal;
		if (d) {
			item.detail = d.text;
		} 
		return item;
	}
);

function getBmdTokenType(styleName: string): number {
	switch (styleName) {
		case "keyword":
			return allTokenTypes.indexOf(SemanticTokenTypes.keyword);
		case "builtin-type":
			return allTokenTypes.indexOf(SemanticTokenTypes.string);
		case "domain-value":
			return allTokenTypes.indexOf(SemanticTokenTypes.enum);
	}
	return 0;
}

connection.onRequest(
	SemanticTokensRequest.type,
	(params: SemanticTokensParams) => {
		const document = documents.get(params.textDocument.uri);
		if (!document) {
			return null;
		}
		const parseRequest = DieselParsers.createParseRequest(document.getText());
		const parseResult = BMD_PARSER.parse(parseRequest);
		const builder = new SemanticTokensBuilder();
		if (parseResult.success) {
			// it's ok, look for styles
			parseResult.styles.forEach(style => {
				const { line, character } = document.positionAt(style.offset);
				const length = style.length;
				const tokenType = getBmdTokenType(style.name);
				builder.push(line, character, length, tokenType, 0);
			});
		} else {
			// parsing error
			connection.console.error("Unhandled parsing error, styles will not be available");
		}
		return builder.build();
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
