/*
 * JavaScript tracker for Snowplow: lock.js
 *
 * Significant portions copyright 2010 Anthon Pang. Remainder copyright
 * 2012-2014 Snowplow Analytics Ltd. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 *
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * * Neither the name of Anthon Pang nor Snowplow Analytics Ltd nor the
 *   names of their contributors may be used to endorse or promote products
 *   derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var localStorageAccessible = require('./lib/detectors').localStorageAccessible;
var object = typeof exports !== 'undefined' ? exports : this;

/**
 * Create a lock using localStorage if possible.
 * Exists so that multiple tabs don't simultaneously interact with the out queue.
 *
 * @param string lockName Key used for the localStorage lock
 * @return object lock
 */
function lock(lockName) {

	// Fallback lock variable for when localStorage is unavailable
	var jsLocked = false;

	// If the lock is free, acquire it and return true; otherwise return false
	function attemptAcquire() {
		if (jsLocked) {
			return false;
		}

		var now = new Date().getTime();

		if (localStorageAccessible()) {
			var existingLock = localStorage.getItem(lockName);

			// If existingLock is not parseable, parseInt returns NaN
			// Comparisons with NaN always return false
			if (existingLock && parseInt(existingLock) > now - 10000) {
				return false;
			}

			localStorage.setItem(lockName, now);
		}
		jsLocked = true;
		return true;
	}

	// Release the localStorage lock but not the jsLock - used when unloading the page
	function releaseLocalStorage() {
		if (localStorageAccessible()) {
			localStorage.setItem(lockName, '0');
		}
	}

	// Release the lock
	function release() {
		releaseLocalStorage();
		jsLocked = false;
	}

	return {
		attemptAcquire: attemptAcquire,
		releaseLocalStorage: releaseLocalStorage,
		release: release
	};
}

object.lock = lock;
