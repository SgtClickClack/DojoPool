import { SetMetadata } from '@nestjs/common';

export const POLICY_KEY = 'policy';
export const USE_POLICY_KEY = 'usePolicy';

/**
 * Enable policy-based access control for this endpoint
 * When applied, the PolicyGuard will evaluate policies instead of just roles
 */
export const UsePolicy = () => SetMetadata(USE_POLICY_KEY, true);

/**
 * Specify a specific policy to evaluate for this endpoint
 * @param policyName - Name of the policy to evaluate
 */
export const Policy = (policyName: string) =>
  SetMetadata(POLICY_KEY, policyName);

/**
 * Combined decorator that enables policy evaluation and specifies a policy
 * @param policyName - Name of the policy to evaluate
 */
export const UsePolicyWith = (policyName: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(USE_POLICY_KEY, true)(target, propertyKey, descriptor);
    SetMetadata(POLICY_KEY, policyName)(target, propertyKey, descriptor);
  };
};
