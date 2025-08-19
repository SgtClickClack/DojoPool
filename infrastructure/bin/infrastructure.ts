#!/usr/bin/env node;
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();
new InfrastructureStack(app, 'DojoPoolInfrastructureStack', {
  env: {
    account: '558721173871',
    region: 'ap-southeast-2',
  },
});
