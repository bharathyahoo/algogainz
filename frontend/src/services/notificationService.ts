/**
 * Notification Service
 * Handles browser notifications and notification permissions
 */

export type NotificationPermission = 'granted' | 'denied' | 'default';

class NotificationService {
  private permissionStatus: NotificationPermission = 'default';
  private soundEnabled: boolean = true;
  private notificationSound: HTMLAudioElement | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize notification service
   */
  private init(): void {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return;
    }

    // Get current permission status
    this.permissionStatus = Notification.permission as NotificationPermission;

    // Load sound preference from localStorage
    const savedSoundPref = localStorage.getItem('algogainz_notification_sound');
    this.soundEnabled = savedSoundPref !== 'false'; // Default to true

    console.log(`[NotificationService] Initialized - Permission: ${this.permissionStatus}, Sound: ${this.soundEnabled}`);
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (this.permissionStatus === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionStatus = permission as NotificationPermission;
      console.log(`[NotificationService] Permission ${permission}`);
      return this.permissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   */
  showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
    }
  ): Notification | null {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return null;
    }

    if (this.permissionStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: options.icon || '/logo192.png',
        badge: options.badge || '/logo192.png',
        body: options.body,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: false,
      });

      // Play sound if enabled
      if (this.soundEnabled) {
        this.playNotificationSound();
      }

      // Auto-close after 10 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show alert notification (for trading alerts)
   */
  showAlertNotification(
    type: 'PROFIT_TARGET' | 'STOP_LOSS',
    stockSymbol: string,
    companyName: string,
    message: string,
    data?: any
  ): Notification | null {
    const isProfitTarget = type === 'PROFIT_TARGET';

    const title = isProfitTarget
      ? `🎯 Profit Target Reached - ${stockSymbol}`
      : `🛑 Stop Loss Hit - ${stockSymbol}`;

    return this.showNotification(title, {
      body: message,
      tag: `alert-${data?.holdingId || stockSymbol}`,
      data: {
        type,
        stockSymbol,
        companyName,
        ...data,
      },
      requireInteraction: !isProfitTarget, // Stop loss requires interaction
    });
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create audio element if not exists
      if (!this.notificationSound) {
        // Use a simple beep sound data URI (440Hz tone)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 440; // A4 note
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        return;
      }

      this.notificationSound.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.permissionStatus;
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permissionStatus === 'granted';
  }

  /**
   * Enable/disable notification sound
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('algogainz_notification_sound', enabled.toString());
    console.log(`[NotificationService] Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Test notification
   */
  showTestNotification(): Notification | null {
    return this.showNotification('AlgoGainz Test', {
      body: 'Notifications are working! You will receive alerts when profit targets or stop losses are hit.',
      requireInteraction: false,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
