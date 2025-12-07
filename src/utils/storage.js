const memoryStore = {};

function isLocalStorageAvailable() {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return false;
		const key = '__storage_test__';
		window.localStorage.setItem(key, key);
		window.localStorage.removeItem(key);
		return true;
	} catch (e) {
		return false;
	}
}

const hasLocal = isLocalStorageAvailable();

export function safeGetItem(key) {
	if (hasLocal) {
		try {
			return window.localStorage.getItem(key);
		} catch (e) {
			// fall through to memory fallback
		}
	}
	return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
}

export function safeSetItem(key, value) {
	if (hasLocal) {
		try {
			window.localStorage.setItem(key, value);
			return;
		} catch (e) {
			// fall back to memory
		}
	}
	memoryStore[key] = String(value);
}

export function safeRemoveItem(key) {
	if (hasLocal) {
		try {
			window.localStorage.removeItem(key);
			return;
		} catch (e) {
			// fall back to memory
		}
	}
	delete memoryStore[key];
}

export function safeGetJSON(key) {
	const v = safeGetItem(key);
	if (v === null || v === undefined) return null;
	try {
		return JSON.parse(v);
	} catch {
		return null;
	}
}

export function safeSetJSON(key, obj) {
	try {
		safeSetItem(key, JSON.stringify(obj));
	} catch {
		// ignore
	}
}
