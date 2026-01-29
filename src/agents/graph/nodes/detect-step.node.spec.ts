import { detectStepNode } from "./detect-step.node";
import { ConversationState } from "../../state/conversation-state";
import { FunnelStep } from "@prisma/client";

describe("detectStepNode", () => {
  it("should return qualified when qualified is true", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: "John",
      birthDate: "1990-01-01",
      weightLossReason: "Health",
      qualified: true,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.qualified);
  });

  it("should return rejected when qualified is false", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: "John",
      birthDate: "1990-01-01",
      weightLossReason: "Beauty",
      qualified: false,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.rejected);
  });

  it("should return collect_name when name is missing", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: null,
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_name);
  });

  it("should return collect_birth_date when name exists but birthDate is missing", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: "John",
      birthDate: null,
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_name,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_birth_date);
  });

  it("should return collect_weight_loss_reason when name and birthDate exist but reason is missing", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: "John",
      birthDate: "1990-01-01",
      weightLossReason: null,
      qualified: null,
      funnelStep: FunnelStep.collect_birth_date,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_weight_loss_reason);
  });

  it("should return current funnelStep when all data is collected but not qualified", () => {
    const state: ConversationState = {
      phoneNumber: "5511999999999",
      messages: [],
      name: "John",
      birthDate: "1990-01-01",
      weightLossReason: "Health",
      qualified: null,
      funnelStep: FunnelStep.collect_weight_loss_reason,
    };

    const result = detectStepNode(state);

    expect(result.funnelStep).toBe(FunnelStep.collect_weight_loss_reason);
  });
});
