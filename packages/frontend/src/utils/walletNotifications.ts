import { toast, ToastOptions } from 'react-toastify';
import React from 'react';

// Define notification types
export enum WalletNotificationType {
  CONNECTION_SUCCESS = 'CONNECTION_SUCCESS',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  DISCONNECTION = 'DISCONNECTION',
  TRANSACTION_PENDING = 'TRANSACTION_PENDING',
  TRANSACTION_SUCCESS = 'TRANSACTION_SUCCESS',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  BALANCE_UPDATE = 'BALANCE_UPDATE',
  CHAIN_CHANGED = 'CHAIN_CHANGED',
  ACCOUNT_CHANGED = 'ACCOUNT_CHANGED',
  SIGNATURE_SUCCESS = 'SIGNATURE_SUCCESS',
  SIGNATURE_ERROR = 'SIGNATURE_ERROR'
}

// Interface for notification data
export interface WalletNotificationData {
  walletType: 'ethereum' | 'solana';
  title: string;
  message: string;
  txHash?: string;
  amount?: string;
  address?: string;
  chainId?: string;
  timestamp: number;
  read: boolean;
}

// Store for recent notifications
const MAX_NOTIFICATIONS = 50;
let recentNotifications: WalletNotificationData[] = [];
let notificationListeners: ((notifications: WalletNotificationData[]) => void)[] = [];

// Add new notification to store
const addNotification = (notification: WalletNotificationData) => {
  recentNotifications = [notification, ...recentNotifications].slice(0, MAX_NOTIFICATIONS);
  // Notify all listeners
  notificationListeners.forEach(listener => listener(recentNotifications));
  return notification;
};

// Get unread notification count
export const getUnreadNotificationCount = (): number => {
  return recentNotifications.filter(notification => !notification.read).length;
};

// Mark notifications as read
export const markAllNotificationsAsRead = (): void => {
  if (recentNotifications.some(notification => !notification.read)) {
    recentNotifications = recentNotifications.map(notification => ({
      ...notification,
      read: true
    }));
    notificationListeners.forEach(listener => listener(recentNotifications));
  }
};

// Mark a specific notification as read
export const markNotificationAsRead = (timestamp: number): void => {
  const index = recentNotifications.findIndex(notification => notification.timestamp === timestamp);
  if (index !== -1 && !recentNotifications[index].read) {
    recentNotifications[index] = {
      ...recentNotifications[index],
      read: true
    };
    notificationListeners.forEach(listener => listener(recentNotifications));
  }
};

// Get recent notifications
export const getRecentNotifications = (): WalletNotificationData[] => {
  return [...recentNotifications];
};

// Subscribe to notification updates
export const subscribeToNotifications = (
  callback: (notifications: WalletNotificationData[]) => void
): () => void => {
  notificationListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    notificationListeners = notificationListeners.filter(listener => listener !== callback);
  };
};

// Default toast options
const defaultToastOptions: ToastOptions = {
  position: 'bottom-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Main notification function
export const showWalletNotification = (
  type: WalletNotificationType,
  walletType: 'ethereum' | 'solana',
  data?: {
    message?: string;
    txHash?: string;
    amount?: string;
    address?: string;
    chainId?: string;
    autoClose?: number;
  }
): WalletNotificationData => {
  const timestamp = Date.now();
  const walletName = walletType === 'ethereum' ? 'Ethereum' : 'Solana';
  let title = '';
  let message = '';
  let toastType: 'info' | 'success' | 'error' | 'warning' = 'info';
  
  switch (type) {
    case WalletNotificationType.CONNECTION_SUCCESS:
      title = `${walletName} Wallet Connected`;
      message = data?.message || `Your ${walletName} wallet has been successfully connected.`;
      toastType = 'success';
      break;
      
    case WalletNotificationType.CONNECTION_ERROR:
      title = `${walletName} Connection Failed`;
      message = data?.message || `Failed to connect to your ${walletName} wallet.`;
      toastType = 'error';
      break;
      
    case WalletNotificationType.DISCONNECTION:
      title = `${walletName} Wallet Disconnected`;
      message = data?.message || `Your ${walletName} wallet has been disconnected.`;
      toastType = 'info';
      break;
      
    case WalletNotificationType.TRANSACTION_PENDING:
      title = `${walletName} Transaction Pending`;
      message = data?.message || `Your transaction is being processed.`;
      toastType = 'info';
      break;
      
    case WalletNotificationType.TRANSACTION_SUCCESS:
      title = `${walletName} Transaction Successful`;
      message = data?.message || `Your transaction has been confirmed.`;
      toastType = 'success';
      break;
      
    case WalletNotificationType.TRANSACTION_ERROR:
      title = `${walletName} Transaction Failed`;
      message = data?.message || `Your transaction failed to process.`;
      toastType = 'error';
      break;
      
    case WalletNotificationType.BALANCE_UPDATE:
      title = `${walletName} Balance Updated`;
      message = data?.message || `Your ${walletName} wallet balance has been updated.`;
      toastType = 'info';
      break;
      
    case WalletNotificationType.CHAIN_CHANGED:
      title = `${walletName} Network Changed`;
      message = data?.message || `Your wallet network has been changed.`;
      toastType = 'info';
      break;
      
    case WalletNotificationType.ACCOUNT_CHANGED:
      title = `${walletName} Account Changed`;
      message = data?.message || `Your connected wallet account has changed.`;
      toastType = 'info';
      break;
      
    case WalletNotificationType.SIGNATURE_SUCCESS:
      title = `${walletName} Signature Completed`;
      message = data?.message || `Message signed successfully.`;
      toastType = 'success';
      break;
      
    case WalletNotificationType.SIGNATURE_ERROR:
      title = `${walletName} Signature Failed`;
      message = data?.message || `Failed to sign the message.`;
      toastType = 'error';
      break;
  }
  
  // Create notification object
  const notification: WalletNotificationData = {
    walletType,
    title,
    message,
    txHash: data?.txHash,
    amount: data?.amount,
    address: data?.address,
    chainId: data?.chainId,
    timestamp,
    read: false
  };
  
  // Format toast content
  let toastContent = `${title}\n${message}`;
  if (data?.txHash) {
    const shortTxHash = `${data.txHash.substring(0, 10)}...${data.txHash.substring(data.txHash.length - 8)}`;
    toastContent += `\nTX: ${shortTxHash}`;
  }
  
  // Show toast notification
  toast[toastType](
    toastContent, 
    {
      ...defaultToastOptions,
      autoClose: data?.autoClose || defaultToastOptions.autoClose
    }
  );
  
  // Add to notification store
  return addNotification(notification);
};

// Helper functions for common wallet notifications
export const notifyWalletConnected = (
  walletType: 'ethereum' | 'solana',
  address?: string
): WalletNotificationData => {
  const walletName = walletType === 'ethereum' ? 'Ethereum' : 'Solana';
  let message = `Your ${walletName} wallet has been successfully connected.`;
  
  if (address) {
    const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    message += ` Connected address: ${shortAddress}`;
  }
  
  return showWalletNotification(
    WalletNotificationType.CONNECTION_SUCCESS,
    walletType,
    { message, address }
  );
};

export const notifyWalletDisconnected = (
  walletType: 'ethereum' | 'solana'
): WalletNotificationData => {
  return showWalletNotification(
    WalletNotificationType.DISCONNECTION,
    walletType
  );
};

export const notifyTransactionSubmitted = (
  walletType: 'ethereum' | 'solana',
  txHash: string,
  amount?: string
): WalletNotificationData => {
  const walletName = walletType === 'ethereum' ? 'Ethereum' : 'Solana';
  const currency = walletType === 'ethereum' ? 'ETH' : 'SOL';
  let message = `Your transaction has been submitted and is being processed.`;
  
  if (amount) {
    message += ` Amount: ${amount} ${currency}`;
  }
  
  return showWalletNotification(
    WalletNotificationType.TRANSACTION_PENDING,
    walletType,
    { message, txHash, amount }
  );
};

export const notifyTransactionConfirmed = (
  walletType: 'ethereum' | 'solana',
  txHash: string,
  amount?: string
): WalletNotificationData => {
  const currency = walletType === 'ethereum' ? 'ETH' : 'SOL';
  let message = `Your transaction has been confirmed.`;
  
  if (amount) {
    message += ` Amount: ${amount} ${currency}`;
  }
  
  return showWalletNotification(
    WalletNotificationType.TRANSACTION_SUCCESS,
    walletType,
    { message, txHash, amount }
  );
};

export const notifyNetworkChanged = (
  walletType: 'ethereum' | 'solana',
  networkName: string
): WalletNotificationData => {
  return showWalletNotification(
    WalletNotificationType.CHAIN_CHANGED,
    walletType,
    { message: `Network changed to ${networkName}.` }
  );
};

export const notifyBalanceUpdated = (
  walletType: 'ethereum' | 'solana',
  newBalance: string
): WalletNotificationData => {
  const currency = walletType === 'ethereum' ? 'ETH' : 'SOL';
  return showWalletNotification(
    WalletNotificationType.BALANCE_UPDATE,
    walletType,
    { message: `Your wallet balance is now ${newBalance} ${currency}.` }
  );
}; 