// @ts-ignore
import { diesel } from '../../diesel-facade/dist/diesel-facade';

export const DieselParsers = {
	bmdParser(): DieselParserFacade {
		return diesel.bmdParser() as DieselParserFacade;
	},
	createParseRequest(text: string): ParseRequest {
		console.log("diesel", diesel);
		return diesel.createParseRequest(text) as ParseRequest;
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

export interface DieselMarker extends HasRange {
	readonly severity: string;
	getMessage(locale: string): string;
}

export interface DieselStyle extends HasRange {
	readonly style: string;
}

export interface DieselParseResult {
	readonly success: boolean;
	readonly error?: string; 
	readonly markers: ReadonlyArray<DieselMarker>;
	readonly styles: ReadonlyArray<DieselStyle>;
}

export interface DieselParserFacade {
	parse(request: ParseRequest): DieselParseResult;
	createParseRequest(text: string): ParseRequest;
}