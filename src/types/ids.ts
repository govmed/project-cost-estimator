/**
 * Branded ID types.
 *
 * At runtime these are just strings. At compile time, TypeScript treats them
 * as distinct types — so passing a ResourceId where a ScenarioId is expected
 * is a type error. Zero runtime cost, catches a real class of bugs.
 */

declare const __brand: unique symbol;
type Brand<T, B> = T & { readonly [__brand]: B };

export type ProjectId = Brand<string, 'ProjectId'>;
export type ScenarioId = Brand<string, 'ScenarioId'>;
export type PhaseId = Brand<string, 'PhaseId'>;
export type ResourceId = Brand<string, 'ResourceId'>;
export type CloudLineItemId = Brand<string, 'CloudLineItemId'>;
export type OtherCostLineItemId = Brand<string, 'OtherCostLineItemId'>;
export type RateCardId = Brand<string, 'RateCardId'>;
export type AssumptionId = Brand<string, 'AssumptionId'>;
export type AuditEntryId = Brand<string, 'AuditEntryId'>;
export type UserId = Brand<string, 'UserId'>;
export type OrgId = Brand<string, 'OrgId'>;

// Constructor helpers. These are no-ops at runtime but force you to be
// explicit at the seam where a raw string becomes a typed ID.
export const ProjectId = (s: string): ProjectId => s as ProjectId;
export const ScenarioId = (s: string): ScenarioId => s as ScenarioId;
export const PhaseId = (s: string): PhaseId => s as PhaseId;
export const ResourceId = (s: string): ResourceId => s as ResourceId;
export const CloudLineItemId = (s: string): CloudLineItemId => s as CloudLineItemId;
export const OtherCostLineItemId = (s: string): OtherCostLineItemId =>
  s as OtherCostLineItemId;
export const RateCardId = (s: string): RateCardId => s as RateCardId;
export const AssumptionId = (s: string): AssumptionId => s as AssumptionId;
export const AuditEntryId = (s: string): AuditEntryId => s as AuditEntryId;
export const UserId = (s: string): UserId => s as UserId;
export const OrgId = (s: string): OrgId => s as OrgId;
