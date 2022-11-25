import exp = require('constants');
import { BMD_PARSER, DieselParseResult, DieselParsers } from './typed-facade';
import { expect, assert } from 'chai';

function doParseBmd(text: string): DieselParseResult {
	const pr = DieselParsers.createParseRequest(text);
	const res = BMD_PARSER.parse(pr);
	assert(res != undefined);
	return res;
}

describe("typed facade", () => {
	it("should create a parse request", () => {
		const pr = DieselParsers.createParseRequest("yalla");
		assert(pr.text === "yalla");
		assert(pr.axiom === undefined);
	});

	it("should parse valid bmd", () => {
		const result = doParseBmd("a person is a concept.");
		expect(result.success).to.be.true;
		expect(result.error).to.be.undefined;
		expect(result.markers.length).to.equal(0);
	});

	it("should parse bmd with errors", () => {
		const result = doParseBmd("a person is a concept");
		expect(result.success).to.be.true;
		expect(result.error).to.be.undefined;
		expect(result.markers.length).to.equal(1);
		const m = result.markers[0];
		expect(m.offset).to.equal(21);
		expect(m.length).to.equal(0);
		expect(m.severity).to.equal("error");
		expect(m.getMessage("en")).to.equal("The word '.' is missing.");
	});

	it("should return styles", () => {
		const result = doParseBmd("a person is a concept.");
		expect(result.success).to.be.true;
		expect(result.error).to.be.undefined;
		expect(result.markers.length).to.equal(0);
		expect(result.styles.length).to.equal(1);
		const s = result.styles[0];
		expect(s.name).to.equal("keyword");
		expect(s.length).to.equal(7);
		expect(s.offset).to.equal(14);
	});

	it("should predict", () => {
		const predictRequest = DieselParsers.createPredictRequest("a x", 3);
		const predictResult = BMD_PARSER.predict(predictRequest);
		expect(predictResult.success).to.be.true;
		expect(predictResult.error).to.be.undefined;
		expect(predictResult.proposals.length).to.equal(5);
		const p0 = predictResult.proposals[1].text;
		expect(p0).to.equal("has");
	});
});