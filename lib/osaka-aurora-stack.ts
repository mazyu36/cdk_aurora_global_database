import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';

interface OsakaAuroraStackProps extends cdk.StackProps {
  globalClusterIdentifier: string
}

export class OsakaAuroraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OsakaAuroraStackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC',
      {
        natGateways: 0,
        maxAzs: 2,
        enableDnsHostnames: true,
        enableDnsSupport: true,
      }
    )

    // Secondary Cluster
    const dbCluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_06_0
      }),
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }),
      writer: rds.ClusterInstance.serverlessV2('Writer', {}),
      readers: [],
      backup: {
        retention: cdk.Duration.days(1)
      },
      storageEncrypted: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })


    // Set global database configuration
    const cfnCluster = dbCluster.node.defaultChild as rds.CfnDBCluster;

    cfnCluster.globalClusterIdentifier = props.globalClusterIdentifier

    // Credentials will be inherited from the primary cluster
    cfnCluster.masterUsername = undefined
    cfnCluster.masterUserPassword = undefined

    new cdk.CfnOutput(this, 'ClusterIdentifier', {
      value: dbCluster.clusterArn,
      exportName: 'ClusterIdentifier',
      key: 'ClusterIdentifier'
    })
  }
}
