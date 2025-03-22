import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { AlertHistoryService } from '../AlertHistoryService';

interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  sns?: {
    enabled: boolean;
    topicArn: string;
    region: string;
  };
}

export interface PerformanceAlert {
  type: 'regression' | 'violation' | 'warning';
  metric: string;
  value: number;
  threshold?: number;
  percentChange?: number;
  baselineValue?: number;
  timestamp: string;
}

export class PerformanceNotificationService {
  private config: NotificationConfig;
  private emailTransporter: nodemailer.Transporter | null = null;
  private slackClient: WebClient | null = null;
  private snsClient: SNSClient | null = null;
  private alertHistoryService: AlertHistoryService;

  constructor(config: NotificationConfig, alertHistoryService: AlertHistoryService) {
    this.config = config;
    this.alertHistoryService = alertHistoryService;
    this.initializeClients();
  }

  private async initializeClients() {
    // Initialize email client
    if (this.config.email?.enabled && this.config.email.smtpConfig) {
      this.emailTransporter = nodemailer.createTransport(this.config.email.smtpConfig);
    }

    // Initialize Slack client
    if (this.config.slack?.enabled) {
      this.slackClient = new WebClient(this.config.slack.webhookUrl);
    }

    // Initialize SNS client
    if (this.config.sns?.enabled) {
      this.snsClient = new SNSClient({
        region: this.config.sns.region
      });
    }
  }

  private formatAlertMessage(alert: PerformanceAlert): string {
    let message = `🚨 Performance Alert: ${alert.type.toUpperCase()}\n`;
    message += `Metric: ${alert.metric}\n`;
    message += `Current Value: ${alert.value.toFixed(2)}ms\n`;

    if (alert.threshold) {
      message += `Threshold: ${alert.threshold.toFixed(2)}ms\n`;
    }

    if (alert.percentChange && alert.baselineValue) {
      message += `Change: ${alert.percentChange.toFixed(2)}% slower\n`;
      message += `Baseline: ${alert.baselineValue.toFixed(2)}ms\n`;
    }

    message += `Timestamp: ${new Date(alert.timestamp).toLocaleString()}\n`;
    return message;
  }

  private async sendEmailAlert(alert: PerformanceAlert): Promise<void> {
    if (!this.emailTransporter || !this.config.email?.recipients.length) return;

    const message = this.formatAlertMessage(alert);
    await this.emailTransporter.sendMail({
      from: this.config.email.smtpConfig?.auth.user,
      to: this.config.email.recipients,
      subject: `Performance Alert: ${alert.type.toUpperCase()} - ${alert.metric}`,
      text: message,
      html: message.replace(/\n/g, '<br>')
    });
  }

  private async sendSlackAlert(alert: PerformanceAlert): Promise<void> {
    if (!this.slackClient || !this.config.slack?.channel) return;

    const message = this.formatAlertMessage(alert);
    await this.slackClient.chat.postMessage({
      channel: this.config.slack.channel,
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    });
  }

  private async sendSNSAlert(alert: PerformanceAlert): Promise<void> {
    if (!this.snsClient || !this.config.sns?.topicArn) return;

    const message = this.formatAlertMessage(alert);
    const command = new PublishCommand({
      TopicArn: this.config.sns.topicArn,
      Subject: `Performance Alert: ${alert.type.toUpperCase()} - ${alert.metric}`,
      Message: message
    });

    await this.snsClient.send(command);
  }

  public async sendAlert(alert: PerformanceAlert): Promise<void> {
    const notificationsSent = {
      email: false,
      slack: false,
      sns: false
    };

    const promises: Promise<void>[] = [];

    if (this.config.email?.enabled) {
      promises.push(
        this.sendEmailAlert(alert)
          .then(() => { notificationsSent.email = true; })
          .catch(error => {
            console.error('Failed to send email alert:', error);
          })
      );
    }

    if (this.config.slack?.enabled) {
      promises.push(
        this.sendSlackAlert(alert)
          .then(() => { notificationsSent.slack = true; })
          .catch(error => {
            console.error('Failed to send Slack alert:', error);
          })
      );
    }

    if (this.config.sns?.enabled) {
      promises.push(
        this.sendSNSAlert(alert)
          .then(() => { notificationsSent.sns = true; })
          .catch(error => {
            console.error('Failed to send SNS alert:', error);
          })
      );
    }

    await Promise.all(promises);

    // Store alert in history
    try {
      await this.alertHistoryService.createAlert(alert, notificationsSent);
    } catch (error) {
      console.error('Failed to store alert in history:', error);
    }
  }

  public async sendBatchAlerts(alerts: PerformanceAlert[]): Promise<void> {
    await Promise.all(alerts.map(alert => this.sendAlert(alert)));
  }
} 