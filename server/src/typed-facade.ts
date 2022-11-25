// @ts-ignore
import { diesel } from '../../diesel-facade/dist/diesel-facade';

export const DieselParsers = {
	bmdParser(): DieselParserFacade {
		return diesel.bmdParser() as DieselParserFacade;
	},
	createParseRequest(text: string): ParseRequest {
		return diesel.createParseRequest(text) as ParseRequest;
	},
	createPredictRequest(text: string, offset: number): PredictRequest {
		return diesel.createPredictRequest(text, offset) as PredictRequest;
	}
};

export interface ParseRequest {
	readonly text: string;
	readonly axiom?: string;
}

export interface HasRange {
	readonly offset: number;
	readonly length: number;
}

export interface PredictRequest {
	readonly parseRequest: ParseRequest;
	readonly offset: number;
}

export interface DieselMarker extends HasRange {
	readonly severity: string;
	getMessage(locale: string): string;
}

export interface DieselStyle extends HasRange {
	readonly name: string;
}

export interface HasSuccessAndError {
	readonly success: boolean;
	readonly error?: string; 
}

export interface DieselParseResult extends HasSuccessAndError {
	readonly markers: ReadonlyArray<DieselMarker>;
	readonly styles: ReadonlyArray<DieselStyle>;
}

export interface DieselCompletionProposal {
	readonly text: string;
	readonly replace?: HasRange;
}

export interface DieselPredictResult extends HasSuccessAndError {
	readonly proposals: ReadonlyArray<DieselCompletionProposal>;
}

export interface DieselParserFacade {
	parse(request: ParseRequest): DieselParseResult;
	predict(request: PredictRequest): DieselPredictResult;
}