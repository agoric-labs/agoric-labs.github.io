// @ts-check

/**
 * Reusable controller for Enhanced Dark Mode support via `prefers-color-scheme` media queries.
 *
 * @see https://github.com/SMotaal/markup/blame/e922e34487a7c02e13167b4b7527ec846170f3da/packages/tokenizer/examples/browser/api.js#L54
 *
 * @typedef {PointerEvent|MouseEvent} DarkModeController.handleEvent.TogglerEvent
 * @typedef {MediaQueryListEvent} DarkModeController.handleEvent.SystemEvent
 * @typedef {Readonly<Partial<Record<string, MediaQueryList>>>} DarkModeController.MediaQueries
 * @typedef {WeakMap<typeof DarkModeController | document, DarkModeController.MediaQueries>} DarkModeController.MediaQueriesCache
 * @typedef {'auto'|'enabled'|'disabled'} DarkModeController.State
 * @typedef {'light'|'dark'} DarkModeController.ColorScheme
 * @typedef {{id?: string, scope?: string, localStorage?: Storage, longPressTimeout?: number}} DarkModeController.Options
 *
 * @license MIT
 */
class DarkModeController {
  /** @param {HTMLElement} [container] @param {DarkModeController.Options} [options] */
  constructor(container, options) {
    container == null &&
      (container =
        (typeof window === 'object' && window.self === window && window.document && window.document.body) || undefined);

    const ownerDocument = new.target.getValidDocumentFrom(/** @type {any} */ (container));

    if (!container || !ownerDocument) {
      if (typeof window === 'object' && window.self === window) {
        throw TypeError(`DarkModeController constructed with an invalid container.`);
      } else {
        // This is used for mocking purposes
        return Object.preventExtensions(
          Object.defineProperties(this, Object.getOwnPropertyDescriptors(Object.freeze({...new.target.prototype}))),
        );
      }
    }

    let {
      // Those options will likely change
      localStorage,
      scope,
      id,
      longPressTimeout,
    } = /** @type {DarkModeController.Options} */ ({...options});

    id = (id && new.target.matchID(id)) || '';
    scope =
      typeof URL === 'function'
        ? new URL(
            scope || './',
            (ownerDocument && ownerDocument.location && ownerDocument.location.href) || 'http://0.0.0.0/',
          ).pathname
        : `/${(scope && new.target.matchScope(scope)) || ''}/`;

    // let handleEvent = this.handleEvent.bind(this);
    let mediaQueries = new.target.getMediaQueriesFromContainer(container);
    let key = `dark-mode-state@${scope}${id ? `#${id}` : ''}`;

    localStorage = localStorage || new.target.getLocalStorageFromContainer(container);

    // Round, NaN or throw TypeError for invalid types
    ((longPressTimeout = Math.round(/** @type {any} */ (longPressTimeout))) > 0 &&
      (longPressTimeout <= 10000 || (longPressTimeout = 10000)) &&
      (longPressTimeout >= 1500 || (longPressTimeout = 1500))) ||
      (longPressTimeout = 2000);

    Object.defineProperties(this, {
      // Immutables
      id: {value: id, writable: false},
      scope: {value: scope, writable: false},
      container: {value: container || document.body, writable: false},
      key: {value: key, writable: false},
      localStorage: {value: localStorage, writable: false},
      mediaQueries: {value: mediaQueries, writable: false},
      longPressTimeout: {value: longPressTimeout, writable: false},
      // Properties
      state: {writable: true},
      prefers: {writable: true},
      // Methods
      handleEvent: {value: this.handleEvent.bind(this), writable: false},
      enable: {value: this.toggle.bind(this, true), writable: false},
      disable: {value: this.toggle.bind(this, false), writable: false},
      toggle: {value: this.toggle.bind(this), writable: false},
    });

    if (localStorage) {
      localStorage[key] === 'enabled'
        ? ((this.state = 'enabled'), this.enable())
        : localStorage[key] === 'disabled'
        ? ((this.state = 'disabled'), this.disable())
        : this.toggle(
            !mediaQueries ||
              (mediaQueries.prefersDarkMode && mediaQueries.prefersDarkMode.matches) === true ||
              (mediaQueries.prefersLightMode && mediaQueries.prefersLightMode.matches) !== true,
            !!(localStorage[key] = this.state = 'auto'),
          );
      if (mediaQueries) {
        mediaQueries.prefersDarkMode && mediaQueries.prefersDarkMode.addListener(this.handleEvent);
        mediaQueries.prefersLightMode && mediaQueries.prefersLightMode.addListener(this.handleEvent);
      }
    }

    // @ts-ignore
    key = localStorage = mediaQueries = undefined;

    Object.preventExtensions(this);
  }

  detach() {
    const {targets} = this.handleEvent[Symbol.for('dark-mode.toggler.handler.state')];
    if (!(targets && targets.size > 0)) return;
    for (const target of targets) {
      targets.delete(target);
      target.removeEventListener('onmousedown', this.handleEvent);
      target.removeEventListener('onmouseup', this.handleEvent);
      target.removeEventListener('onpointerdown', this.handleEvent);
      target.removeEventListener('onpointerup', this.handleEvent);
    }
  }

  /// Mutables ///

  get state() {
    return /** @type {DarkModeController.State|undefined} */ (undefined);
  }

  set state(value) {}

  get prefers() {
    return /** @type {DarkModeController.ColorScheme|undefined} */ (undefined);
  }

  set prefers(value) {}

  /// Immutables ///

  get localStorage() {
    return /** @type {Storage|undefined} */ (undefined);
  }

  get mediaQueries() {
    return /** @type {Record<string, MediaQueryList>|undefined} */ (undefined);
  }

  get onPointerDown() {
    return /** @type {(event: PointerEvent) => void} */ (this.handleEvent);
  }

  get onPointerUp() {
    return /** @type {(event: PointerEvent) => void} */ (this.handleEvent);
  }

  get scope() {
    return /** @type {string|undefined} */ (undefined);
  }

  get id() {
    return /** @type {string|undefined} */ (undefined);
  }

  get key() {
    return /** @type {string|undefined} */ (undefined);
  }

  get container() {
    return /** @type {HTMLElement|undefined} */ (undefined);
  }

  get longPressTimeout() {
    return 2000;
  }

  /// Methods ///

  /**
   * Returns a single bindable event handler for toggler element(s).
   *
   * @template {DarkModeController.handleEvent.TogglerEvent|DarkModeController.handleEvent.SystemEvent} E @param {E} [event]
   * @readonly
   * @memberof DarkModeController
   */
  handleEvent(event) {
    /** @type {{action?: string, committed?:boolean, target?: Element, timeout?: number, targets: Set<Document>}} */
    const handlerState =
      this &&
      this.handleEvent &&
      (this.handleEvent[Symbol.for('dark-mode.toggler.handler.state')] ||
        (this.container &&
          this.container.ownerDocument &&
          this.handleEvent !== DarkModeController.prototype.handleEvent &&
          (this.container.ownerDocument.addEventListener(
            'onmouseup' in this.container ? 'mouseup' : 'pointerup',
            this.handleEvent,
            true,
          ),
          (this.handleEvent[Symbol.for('dark-mode.toggler.handler.state')] = {
            targets: new Set([this.container.ownerDocument]),
          }))));

    if (!handlerState || !this.container) {
      throw ReferenceError('DarkModeController.prototype.handleEvent invalidly invoked');
    }

    const target = /** @type {Element} */ (event && event.target) || undefined;
    const trigger =
      (event || undefined) &&
      DarkModeController.matchTrigger(
        // Safer bet event.media implies
        /** @type {MediaQueryListEvent} */ (event).media ||
          // Only then do we consider
          /** @type {PointerEvent} */ (event).type,
      );

    const ownerDocument = (target && target.ownerDocument) || undefined;
    if (handlerState.timeout !== undefined) {
      clearTimeout(handlerState.timeout);
      handlerState.timeout = undefined;
    }

    !ownerDocument ||
      ownerDocument === this.container.ownerDocument ||
      handlerState.targets.has(ownerDocument) ||
      (handlerState.targets.add(ownerDocument),
      ownerDocument.addEventListener('onmouseup' in this.container ? 'mouseup' : 'pointerup', this.handleEvent, true));

    switch (trigger) {
      case 'dark':
      case 'light':
        /** @type {MediaQueryListEvent} */ (event).matches === true && this.toggle(trigger === 'dark', true);
        handlerState.committed = undefined;
        handlerState.target = undefined;
        break;
      case undefined:
        if (handlerState.target !== undefined && handlerState.committed === false) {
          handlerState.action = 'auto';
          handlerState.committed = true;
          this.toggle('auto');
        } else {
          handlerState.action = 'ignore';
        }
        break;
      case 'mouseup':
      case 'pointerup':
        if (handlerState.target === undefined) {
          handlerState.action = 'ignore';
        } else if (handlerState.target === target && handlerState.committed === false) {
          handlerState.action = 'toggle';
          this.toggle();
          handlerState.committed = undefined;
          handlerState.target = undefined;
        } else {
          handlerState.action = 'release';
          handlerState.committed = undefined;
          handlerState.target = undefined;
        }
        break;
      case 'mousedown':
      case 'pointerdown':
        if (!target || !ownerDocument) {
          if (handlerState.target === undefined) {
            handlerState.action = 'ignore';
          } else {
            handlerState.action = 'release';
            handlerState.committed = undefined;
            handlerState.target = undefined;
          }
        } else {
          handlerState.action = 'capture';
          handlerState.target = target;
          handlerState.committed = false;
          handlerState.timeout = /** @type {Window['setTimeout']} */ (setTimeout)(
            this.handleEvent,
            this.longPressTimeout,
          );
        }
        break;
      default:
        console.warn(`DarkModeController.handleEvent invoked invalidly (event = ${event})`);
        break;
    }
    // console.log('%s:%o', trigger, handlerState.action, {...handlerState});
  }

  /**
   * @param {DarkModeController.State|boolean} [state]
   * @param {boolean} [auto]
   */
  async toggle(state, auto) {
    if (auto === true) {
      if (state === true) this.prefers = 'dark';
      else if (state === false) this.prefers = 'light';
      if (this.state !== 'auto') return;
    }

    const nextState =
      state === 'auto'
        ? this.prefers !== 'light'
        : state != null
        ? !!state
        : !this.container
        ? this.state !== 'enabled'
        : !this.container.classList.contains('dark-mode');

    this.state = state === 'auto' || auto ? 'auto' : nextState ? 'enabled' : 'disabled';

    this.localStorage && this.key && (this.localStorage[this.key] = this.state);

    if (!this.container) return;

    const classList = this.container.classList;

    classList.add(nextState ? 'dark-mode' : 'light-mode');
    classList.remove(nextState ? 'light-mode' : 'dark-mode');

    // TODO: Consider exposing prefers-color later on
    // this.state !== 'auto'
    //   ? classList.remove('prefers-dark', 'prefers-light')
    //   : classList.add(nextState ? 'prefers-dark' : 'prefers-light'),
    //   classList.remove(nextState ? 'prefers-light' : 'prefers-dark');
  }

  /** @param {boolean} [auto] */
  enable(auto) {}

  /** @param {boolean} [auto] */
  disable(auto) {}

  /// Static Methods ///

  /** @param {HTMLElement|Document} node */
  static getValidDocumentFrom(node) {
    return (
      /** @type {Document} */ ((node &&
        (!node.ownerDocument || (node = node.ownerDocument)) &&
        node.nodeType === node.DOCUMENT_NODE &&
        /** @type {any} */ (node).defaultView &&
        /** @type {any} */ (node).defaultView.document === node &&
        node) ||
      undefined)
    );
  }

  /** @param {HTMLElement} container */
  static getLocalStorageFromContainer(container) {
    return (
      (container &&
        container.ownerDocument &&
        container.ownerDocument.defaultView &&
        container.ownerDocument.defaultView.localStorage) ||
      undefined
    );
  }

  /**
   * @typedef {DarkModeController.MediaQueries} MediaQueries
   * @typedef {Document | typeof DarkModeController} Owner
   * @param {HTMLElement} container
   */
  static getMediaQueriesFromContainer(container) {
    const cache =
      /** @type {DarkModeController.MediaQueriesCache} */ (DarkModeController[Symbol.for('dark-mode.toggler.queries')]);
    /** @type {Owner} */
    let owner;
    /** @type {MediaQueries|undefined} */
    let queries;
    try {
      owner =
        container &&
        container.ownerDocument &&
        container.ownerDocument.defaultView &&
        container.ownerDocument.defaultView.document === container.ownerDocument
          ? container.ownerDocument.defaultView.document
          : DarkModeController;

      queries = cache.get(owner);

      queries != null ||
        !owner ||
        !owner.defaultView ||
        (owner.defaultView.document !== owner
          ? (queries = Object.freeze(Object.create(null)))
          : cache.set(
              owner,
              (queries = Object.freeze(
                Object.setPrototypeOf(
                  {
                    prefersDarkMode: owner.defaultView.matchMedia('(prefers-color-scheme: dark)'),
                    prefersLightMode: owner.defaultView.matchMedia('(prefers-color-scheme: light)'),
                  },
                  null,
                ),
              )),
            ));
    } catch (exception) {}

    return queries || {};
  }

  /// Static Immutables ///

  static get [Symbol.for('dark-mode.toggler.queries')]() {
    const value = /** @type {DarkModeController.MediaQueriesCache} */ (new WeakMap());
    value.set(DarkModeController, Object.freeze(Object.create(null)));
    Object.defineProperty(DarkModeController, Symbol.for('dark-mode.toggler.queries'), {
      value,
      writable: false,
    });
    return value;
  }

  static get defaultView() {
    return /** @type {Window | undefined} */ (undefined);
  }

  static get createMatcher() {
    /** @type {(regexp: RegExp) => <T>(source: T) => string} */
    const value = Function.bind.bind(
      class Matcher extends RegExp {
        /** @template T @param {T} source @returns {string} */
        match(source) {
          // console.log('match', ...arguments);
          return ((this.exec(/** @type {any} */ (source)) || '')[1]);
        }
      }.prototype.match,
    );
    Object.defineProperty(DarkModeController, 'createMatcher', {
      value,
      writable: false,
    });
    return value;
  }

  static get matchTrigger() {
    // We want this to return undefined if it does not match
    const value = DarkModeController.createMatcher(
      /(^mouseup$|^mousedown$|^pointerup$|^pointerdown$|\blight\b|\bdark\b)|$/i,
    );
    Object.defineProperty(DarkModeController, 'matchTrigger', {
      value,
      writable: false,
    });
    return value;
  }

  static get matchID() {
    // We want this to return empty string if match
    const value = DarkModeController.createMatcher(/(^\S{2,}$|$)/);
    Object.defineProperty(DarkModeController, 'matchID', {
      value,
      writable: false,
    });
    return value;
  }

  static get matchScope() {
    // We want this to return empty string if match
    const value = DarkModeController.createMatcher(/(^\S{2,}$|$)/);
    Object.defineProperty(DarkModeController, 'matchScope', {
      value,
      writable: false,
    });
    return value;
  }
}

Object.freeze(Object.preventExtensions(DarkModeController).prototype);

/** @type {{enable(): void; disable(): void; toggle(state?: boolean | 'auto'): void;}} */
const darkMode =
	(typeof document === 'object' &&
		document &&
		//@ts-ignore
		(document.darkMode ||
			//@ts-ignore
			(document.darkMode = new (Object.preventExtensions(DarkModeController))(document.documentElement)))) ||
	undefined;

export { darkMode };
