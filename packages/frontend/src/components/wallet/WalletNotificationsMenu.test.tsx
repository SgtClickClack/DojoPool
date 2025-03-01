import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import WalletNotificationsMenu from './WalletNotificationsMenu';
import * as walletNotifications from '../../utils/walletNotifications';

// Mock the walletNotifications module
jest.mock('../../utils/walletNotifications', () => ({
  subscribeToNotifications: jest.fn(),
  getRecentNotifications: jest.fn(),
  getUnreadNotificationCount: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  WalletNotificationType: {
    CONNECTION_SUCCESS: 'CONNECTION_SUCCESS',
    DISCONNECTION_SUCCESS: 'DISCONNECTION_SUCCESS',
    TRANSACTION_PENDING: 'TRANSACTION_PENDING',
    TRANSACTION_SUCCESS: 'TRANSACTION_SUCCESS',
    TRANSACTION_FAILURE: 'TRANSACTION_FAILURE',
    SIGNATURE_SUCCESS: 'SIGNATURE_SUCCESS',
    SIGNATURE_FAILURE: 'SIGNATURE_FAILURE',
    ACCOUNT_CHANGED: 'ACCOUNT_CHANGED',
    CHAIN_CHANGED: 'CHAIN_CHANGED',
    BALANCE_UPDATE: 'BALANCE_UPDATE',
    ERROR: 'ERROR'
  }
}));

describe('WalletNotificationsMenu', () => {
  const mockNotifications = [
    {
      type: walletNotifications.WalletNotificationType.CONNECTION_SUCCESS,
      walletType: 'ethereum',
      title: 'Wallet Connected',
      message: 'Your Ethereum wallet has been connected',
      timestamp: Date.now() - 5000, // 5 seconds ago
      read: false
    },
    {
      type: walletNotifications.WalletNotificationType.TRANSACTION_SUCCESS,
      walletType: 'ethereum',
      title: 'Transaction Successful',
      message: 'Your transaction has been confirmed',
      txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      timestamp: Date.now() - 3600000, // 1 hour ago
      read: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (walletNotifications.getRecentNotifications as jest.Mock).mockReturnValue(mockNotifications);
    (walletNotifications.getUnreadNotificationCount as jest.Mock).mockReturnValue(1);
    
    // Mock the subscription
    let callback: ((notifications: any[]) => void) | null = null;
    (walletNotifications.subscribeToNotifications as jest.Mock).mockImplementation((cb) => {
      callback = cb;
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('renders the notification icon with badge', () => {
    render(<WalletNotificationsMenu />);
    
    // Check notification icon is rendered
    const notificationButton = screen.getByLabelText('show wallet notifications');
    expect(notificationButton).toBeInTheDocument();
    
    // Check unread badge is displayed
    const badge = document.querySelector('.MuiBadge-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('1');
  });

  it('displays notifications when icon is clicked', () => {
    render(<WalletNotificationsMenu />);
    
    // Open the menu
    fireEvent.click(screen.getByLabelText('show wallet notifications'));
    
    // Check that notifications are displayed
    expect(screen.getByText('Wallet Notifications')).toBeInTheDocument();
    expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
    expect(screen.getByText('Your Ethereum wallet has been connected')).toBeInTheDocument();
    expect(screen.getByText('Transaction Successful')).toBeInTheDocument();
    expect(screen.getByText('Your transaction has been confirmed')).toBeInTheDocument();
    expect(screen.getByText(/TX: 12345678.../)).toBeInTheDocument();
  });

  it('marks notifications as read when opened', () => {
    render(<WalletNotificationsMenu />);
    
    // Open the menu
    fireEvent.click(screen.getByLabelText('show wallet notifications'));
    
    // Check if markAllNotificationsAsRead was called
    expect(walletNotifications.markAllNotificationsAsRead).toHaveBeenCalledTimes(1);
  });

  it('shows empty state when no notifications', () => {
    // Mock empty notifications
    (walletNotifications.getRecentNotifications as jest.Mock).mockReturnValue([]);
    
    render(<WalletNotificationsMenu />);
    
    // Open the menu
    fireEvent.click(screen.getByLabelText('show wallet notifications'));
    
    // Check empty state is shown
    expect(screen.getByText('No wallet notifications')).toBeInTheDocument();
  });

  it('calls onViewAllClick when View All is clicked', () => {
    // Create many notifications to trigger View All
    const manyNotifications = Array(10).fill(null).map((_, i) => ({
      type: walletNotifications.WalletNotificationType.CONNECTION_SUCCESS,
      walletType: 'ethereum',
      title: `Notification ${i}`,
      message: `Message ${i}`,
      timestamp: Date.now() - i * 1000,
      read: false
    }));
    
    (walletNotifications.getRecentNotifications as jest.Mock).mockReturnValue(manyNotifications);
    
    const onViewAllClick = jest.fn();
    render(<WalletNotificationsMenu maxItems={5} onViewAllClick={onViewAllClick} />);
    
    // Open the menu
    fireEvent.click(screen.getByLabelText('show wallet notifications'));
    
    // Click View All button
    fireEvent.click(screen.getByText(/View All/));
    
    // Check callback was called
    expect(onViewAllClick).toHaveBeenCalledTimes(1);
  });

  it('updates when new notifications arrive', () => {
    // Setup the test
    (walletNotifications.getRecentNotifications as jest.Mock).mockReturnValue([]);
    let subscribeCallback: Function | null = null;
    
    (walletNotifications.subscribeToNotifications as jest.Mock).mockImplementation((callback) => {
      subscribeCallback = callback;
      return () => {}; // Return unsubscribe function
    });
    
    render(<WalletNotificationsMenu />);
    
    // Open the menu - should show empty state
    fireEvent.click(screen.getByLabelText('show wallet notifications'));
    expect(screen.getByText('No wallet notifications')).toBeInTheDocument();
    
    // Simulate new notification arriving
    act(() => {
      if (subscribeCallback) {
        subscribeCallback([{
          type: walletNotifications.WalletNotificationType.CONNECTION_SUCCESS,
          walletType: 'solana',
          title: 'New Notification',
          message: 'This is a new notification',
          timestamp: Date.now(),
          read: false
        }]);
      }
    });
    
    // Check that the new notification is displayed
    expect(screen.getByText('New Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a new notification')).toBeInTheDocument();
  });
}); 