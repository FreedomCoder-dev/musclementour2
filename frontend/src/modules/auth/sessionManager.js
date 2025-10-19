const DEFAULT_STORAGE_KEY = 'mm-auth';
const DEFAULT_MAX_RETRIES = 4;
const DEFAULT_BASE_DELAY = 250; // ms

function delay(ms, scheduler) {
  return new Promise((resolve) => scheduler(resolve, ms));
}

function isRetryableError(error) {
  if (!error) return false;
  if (typeof error.status === 'number') {
    return error.status >= 500;
  }
  return true;
}

export class AuthSessionManager {
  constructor({
    api,
    storage = typeof window !== 'undefined' ? window.localStorage : null,
    storageKey = DEFAULT_STORAGE_KEY,
    now = () => Date.now(),
    isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine),
    scheduler = (fn, timeout) => setTimeout(fn, timeout),
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY
  } = {}) {
    if (!api) {
      throw new Error('AuthSessionManager requires an api instance');
    }
    this.api = api;
    this.storage = storage;
    this.storageKey = storageKey;
    this.now = now;
    this.isOnline = isOnline;
    this.scheduler = scheduler;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;

    this.state = {
      user: null,
      tokens: null,
      loading: true,
      lastError: null
    };
    this.subscribers = new Set();
    this.refreshPromise = null;
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    listener(this.state);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.subscribers.forEach((listener) => listener(this.state));
  }

  persist(user, tokens) {
    this.state = {
      ...this.state,
      user,
      tokens,
      lastError: null
    };
    if (this.storage) {
      if (user && tokens) {
        const payload = { user, tokens, savedAt: this.now() };
        this.storage.setItem(this.storageKey, JSON.stringify(payload));
      } else {
        this.storage.removeItem(this.storageKey);
      }
    }
    this.subscribers.forEach((listener) => listener(this.state));
  }

  clear(error = null) {
    this.persist(null, null);
    if (error) {
      this.setState({ lastError: error });
    }
  }

  hydrate() {
    if (!this.storage) {
      this.setState({ loading: false });
      return;
    }
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      this.setState({ loading: false });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      this.state = {
        ...this.state,
        user: parsed.user || null,
        tokens: parsed.tokens || null,
        loading: false
      };
      this.subscribers.forEach((listener) => listener(this.state));
    } catch (error) {
      this.storage.removeItem(this.storageKey);
      this.setState({ loading: false, lastError: error });
    }
  }

  async initialize({ attemptRefresh = true } = {}) {
    this.hydrate();
    if (!attemptRefresh) {
      this.setState({ loading: false });
      return;
    }
    if (!this.state.tokens?.refreshToken) {
      this.setState({ loading: false });
      return;
    }
    try {
      await this.refresh();
    } catch (error) {
      // keep user logged out on unrecoverable errors
      if (error?.status === 401) {
        this.clear(error);
      } else {
        this.setState({ lastError: error });
      }
    } finally {
      this.setState({ loading: false });
    }
  }

  async login(email, password) {
    const response = await this.api.login(email, password);
    this.persist(response.user, response.tokens);
    return response.user;
  }

  async register(email, password) {
    const response = await this.api.register(email, password);
    this.persist(response.user, response.tokens);
    return response.user;
  }

  async logout() {
    const refreshToken = this.state.tokens?.refreshToken;
    this.clear();
    if (!refreshToken || !this.isOnline()) {
      return;
    }
    try {
      await this.api.logout(refreshToken);
    } catch (error) {
      this.setState({ lastError: error });
    }
  }

  async refresh() {
    if (!this.state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }
    if (!this.isOnline()) {
      const offlineError = new Error('Offline, cannot refresh token');
      offlineError.status = 0;
      throw offlineError;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.performRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async performRefresh() {
    let attempt = 0;
    let lastError = null;
    while (attempt <= this.maxRetries) {
      try {
        const response = await this.api.refresh(this.state.tokens.refreshToken);
        this.persist(response.user, response.tokens);
        return response.tokens;
      } catch (error) {
        lastError = error;
        if (error?.status === 401) {
          this.clear(error);
          throw error;
        }
        if (!isRetryableError(error) || attempt === this.maxRetries) {
          this.setState({ lastError: error });
          throw error;
        }
        const delayMs = this.baseDelay * Math.pow(2, attempt);
        await delay(delayMs, this.scheduler);
        attempt += 1;
      }
    }
    throw lastError;
  }

  async callWithAuth(fn, ...args) {
    const accessToken = this.state.tokens?.accessToken;
    if (!accessToken) {
      throw new Error('Not authenticated');
    }
    try {
      return await fn(accessToken, ...args);
    } catch (error) {
      if (error?.status === 401) {
        try {
          const tokens = await this.refresh();
          if (!tokens?.accessToken) {
            throw error;
          }
          return await fn(tokens.accessToken, ...args);
        } catch (refreshError) {
          this.clear(refreshError);
          throw refreshError;
        }
      }
      throw error;
    }
  }
}

export function createAuthSessionManager(options) {
  return new AuthSessionManager(options);
}
