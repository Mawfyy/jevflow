import { mock, restore } from "@faker-js/faker"
import * as Zod from 'zod'
import { zodResolver } from "zod";
import { expect } from 'expect-extend'
import { JevProvider } from './provider"

/** @type {string} */
let systemOneId = mock().text()

beforeEach(() => {
  systemOneId = mock().text()
})

describe("evaluate", () => {
  beforeEach(() => {
    MockProvider.fails = []
  })

  it("evaluates a single decision", async () => {
    const mockDecision = decision.noul({ instructions: "Test Decision" });
    const mockInput = mock().object();
    const result = await runBatch([mockDecision], mockInput);
    expect(result.length).toEqual(1);
    expect(result[0].provider).toEqual("mock");
  })

  it("evaluates multiple decisions in a batch", async () => {
    const mockDecisions = [decision.noul({ instructions: "Test Decision 1" }), decision.noul({ instructions: "Test Decision 2" })];
    const mockInput = mock().object();
    const result = await runBatch(mockDecisions, mockInput);
    expect(result.length).toEqual(2);
    expect(result[0].provider).toEqual("mock");
  })

  it("evaluates decisions with fallback", async () => {
    const mockDecision = decision.noul({ instructions: "Test Decision" });
    mockDecision.output.type = 'choice'; // TODO: make this test pass. Mock doesn't know how to produce choice yet.
    MockProvider.fails = [{ name: 'test', message: 'mock failure' }];
    const mockInput = mock().object();
    const result = await runBatch([mockDecision], mockInput);
    expect(result.length).toEqual(1);
    expect(result[0].provider).toEqual("mock");
  })
})

describe("provider", () => {
  // TODO: implement
})
