#!/usr/bin / env node
import { TokyoAuroraStack } from './../lib/tokyo-aurora-stack';
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OsakaAuroraStack } from '../lib/osaka-aurora-stack';

const globalClusterIdentifier = 'test-global-database'

const app = new cdk.App();

new TokyoAuroraStack(app, 'TokyoAuroraStack', {
  env: {
    region: 'ap-northeast-1'
  },
  globalClusterIdentifier: globalClusterIdentifier
})

new OsakaAuroraStack(app, 'OsakaAuroraStack', {
  env: {
    region: 'ap-northeast-3'
  },
  globalClusterIdentifier: globalClusterIdentifier
})
