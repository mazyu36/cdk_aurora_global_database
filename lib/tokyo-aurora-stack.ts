import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';

interface TokyoAuroraStackProps extends cdk.StackProps {
  globalClusterIdentifier: string
}

export class TokyoAuroraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TokyoAuroraStackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'PrimaryVPC',
      {
        natGateways: 0,
        maxAzs: 2,
        enableDnsHostnames: true,
        enableDnsSupport: true,
      }
    )

    // Primary Cluster
    const dbCluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_06_0
      }),
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }),
      writer: rds.ClusterInstance.serverlessV2('Writer', {}),
      readers: [],
      defaultDatabaseName: 'test',
      backup: {
        retention: cdk.Duration.days(1)
      },
      storageEncrypted: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    // Global Database
    const globalClusterIdentifier = new rds.CfnGlobalCluster(this, 'GlobalDatabase', {
      deletionProtection: false,
      globalClusterIdentifier: props.globalClusterIdentifier,
      sourceDbClusterIdentifier: dbCluster.clusterIdentifier
    })


    new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
      value: globalClusterIdentifier.globalClusterIdentifier!,
      exportName: 'GlobalClusterIdentifier',
      key: 'GlobalClusterIdentifier'
    })

    new cdk.CfnOutput(this, 'ClusterIdentifier', {
      value: dbCluster.clusterArn,
      exportName: 'ClusterIdentifier',
      key: 'ClusterIdentifier'
    })
  }
}
