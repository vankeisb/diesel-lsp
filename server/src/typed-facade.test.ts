import exp = require('constants');
import { DieselParseResult, DieselParsers } from './typed-facade';

function doParseBmd(text: string): DieselParseResult {
	const bmdParser = DieselParsers.bmdParser();
	expect(bmdParser).toBeDefined();
	const pr = DieselParsers.createParseRequest(text);
	const res = bmdParser.parse(pr);
	expect(res).toBeDefined();
	return res;
}

describe("typed facade", () => {
	it("should create a parse request", () => {
		const pr = DieselParsers.createParseRequest("yalla");
		expect(pr.text).toBe("yalla");
		expect(pr.axiom).toBeUndefined();
	});

	it("should parse valid bmd", () => {
		const result = doParseBmd("a person is a concept.");
		expect(result.success).toBe(true);
		expect(result.error).toBeUndefined();
		expect(result.markers.length).toBe(0);
	});

	it("should parse bmd with errors", () => {
		const result = doParseBmd("a person is a concept");
		expect(result.success).toBe(true);
		expect(result.error).toBeUndefined();
		expect(result.markers.length).toBe(1);
		const m = result.markers[0];
		expect(m.offset).toBe(21);
		expect(m.length).toBe(0);
		expect(m.severity).toBe("error");
		expect(m.getMessage("en")).toBe("The word '.' is missing.");
	});
});