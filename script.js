// Notification System
class NotificationManager {
  constructor() {
    this.container = document.getElementById('notification-container');
    this.notifications = new Map();
    this.nextId = 0;
  }

  show(options = {}) {
    const {
      title = 'Notification',
      message = '',
      type = 'info', // success, error, warning, info
      duration = 4000,
      icon = null
    } = options;

    const id = this.nextId++;
    const notificationEl = document.createElement('div');
    notificationEl.className = `notification ${type}`;
    notificationEl.setAttribute('role', 'alert');
    notificationEl.setAttribute('aria-live', 'polite');

    // Get default icon based on type
    const iconMap = {
      success: '✓',
      error: '⚠',
      warning: '!',
      info: 'ℹ'
    };
    const displayIcon = icon || iconMap[type] || 'ℹ';

    notificationEl.innerHTML = `
      <div class="notification-icon">${displayIcon}</div>
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        ${message ? `<div class="notification-message">${message}</div>` : ''}
      </div>
      <button class="notification-close" aria-label="Close notification">×</button>
      <div class="notification-progress"></div>
    `;

    const closeBtn = notificationEl.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.dismiss(id));

    this.container.appendChild(notificationEl);
    this.notifications.set(id, { element: notificationEl, timeout: null });

    if (duration > 0) {
      const timeout = setTimeout(() => this.dismiss(id), duration);
      this.notifications.get(id).timeout = timeout;
    }

    return id;
  }

  dismiss(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    const { element, timeout } = notification;
    if (timeout) clearTimeout(timeout);

    element.classList.add('exiting');
    setTimeout(() => {
      element.remove();
      this.notifications.delete(id);
    }, 300);
  }

  success(title, message = '', duration = 4000) {
    return this.show({ title, message, type: 'success', duration });
  }

  error(title, message = '', duration = 4000) {
    return this.show({ title, message, type: 'error', duration });
  }

  warning(title, message = '', duration = 4000) {
    return this.show({ title, message, type: 'warning', duration });
  }

  info(title, message = '', duration = 4000) {
    return this.show({ title, message, type: 'info', duration });
  }
}

const notifications = new NotificationManager();

const button = document.getElementById('demo-btn');

if (button) {
  button.addEventListener('click', () => {
    notifications.success(
      'Concept Ready',
      'Brickly concept is ready for your next iteration.'
    );
  });
}
