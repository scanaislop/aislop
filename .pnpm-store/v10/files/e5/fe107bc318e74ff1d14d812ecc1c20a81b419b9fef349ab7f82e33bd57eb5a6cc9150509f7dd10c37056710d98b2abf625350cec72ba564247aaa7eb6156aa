Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region ../node_modules/@emnapi/core/dist/plugins/async-work.js
function asyncWork(emnapiPluginCtx) {
	const { emnapiCtx, emnapiNodeBinding, emnapiAsyncWorkPoolSize } = emnapiPluginCtx;
	var mod = (function(exports, emnapi_shared, emscripten_runtime) {
		/**
		* @__deps $emnapiCtx
		* @__deps $emnapiEnv
		* @__deps $emnapiNodeBinding
		* @__deps $emnapiAsyncWorkPoolSize
		* @__postset
		* ```
		* emnapiAWST.init();
		* ```
		*/
		var emnapiAWST = {
			idGen: {},
			values: [void 0],
			queued: /* @__PURE__ */ new Set(),
			pending: [],
			pendingHead: 0,
			init: function() {
				const idGen = {
					nextId: 1,
					list: [],
					listHead: 0,
					generate: function() {
						let id;
						if (idGen.listHead < idGen.list.length) {
							id = idGen.list[idGen.listHead++];
							if (idGen.listHead === idGen.list.length) {
								idGen.list.length = 0;
								idGen.listHead = 0;
							}
						} else {
							id = idGen.nextId;
							idGen.nextId++;
						}
						return id;
					},
					reuse: function(id) {
						idGen.list.push(id);
					}
				};
				emnapiAWST.idGen = idGen;
				emnapiAWST.values = [void 0];
				emnapiAWST.queued = /* @__PURE__ */ new Set();
				emnapiAWST.pending = [];
				emnapiAWST.pendingHead = 0;
			},
			create: function(env, resource, resourceName, execute, complete, data) {
				let asyncId = 0;
				let triggerAsyncId = 0;
				if (emnapiNodeBinding) {
					const asyncContext = emnapiNodeBinding.node.emitAsyncInit(resource, resourceName, -1);
					asyncId = asyncContext.asyncId;
					triggerAsyncId = asyncContext.triggerAsyncId;
				}
				const id = emnapiAWST.idGen.generate();
				emnapiAWST.values[id] = {
					env,
					id,
					resource,
					asyncId,
					triggerAsyncId,
					status: 0,
					execute,
					complete,
					data
				};
				return id;
			},
			callComplete: function(work, status) {
				const complete = work.complete;
				const env = work.env;
				const data = work.data;
				const callback = () => {
					if (!complete) return;
					const envObject = emnapi_shared.emnapiEnv;
					const scope = emnapiCtx.openScope(envObject);
					try {
						envObject.callbackIntoModule(true, () => {
							emnapiPluginCtx.wasmTable.get(complete)(env, status, data);
						});
					} finally {
						emnapiCtx.closeScope(envObject, scope);
					}
				};
				if (emnapiNodeBinding) emnapiNodeBinding.node.makeCallback(work.resource, callback, [], {
					asyncId: work.asyncId,
					triggerAsyncId: work.triggerAsyncId
				});
				else callback();
			},
			queue: function(id) {
				const work = emnapiAWST.values[id];
				if (!work) return;
				if (work.status === 0) {
					work.status = 1;
					if (emnapiAWST.queued.size >= (Math.abs(emnapiAsyncWorkPoolSize) || 4)) {
						if (emnapiAWST.pendingHead >= 1024 && emnapiAWST.pendingHead * 2 >= emnapiAWST.pending.length) {
							emnapiAWST.pending.splice(0, emnapiAWST.pendingHead);
							emnapiAWST.pendingHead = 0;
						}
						emnapiAWST.pending.push(id);
						return;
					}
					emnapiAWST.queued.add(id);
					const env = work.env;
					const data = work.data;
					const execute = work.execute;
					work.status = 2;
					emnapiCtx.features.setImmediate(() => {
						emnapiPluginCtx.wasmTable.get(execute)(env, data);
						emnapiAWST.queued.delete(id);
						work.status = 3;
						emnapiCtx.features.setImmediate(() => {
							emnapiAWST.callComplete(work, 0);
						});
						if (emnapiAWST.pendingHead < emnapiAWST.pending.length) {
							const nextWorkId = emnapiAWST.pending[emnapiAWST.pendingHead++];
							if (emnapiAWST.pendingHead === emnapiAWST.pending.length) {
								emnapiAWST.pending.length = 0;
								emnapiAWST.pendingHead = 0;
							}
							emnapiAWST.values[nextWorkId].status = 0;
							emnapiAWST.queue(nextWorkId);
						}
					});
				}
			},
			cancel: function(id) {
				const index = emnapiAWST.pending.indexOf(id, emnapiAWST.pendingHead);
				if (index !== -1) {
					const work = emnapiAWST.values[id];
					if (work && work.status === 1) {
						work.status = 4;
						emnapiAWST.pending.splice(index, 1);
						if (emnapiAWST.pendingHead === emnapiAWST.pending.length) {
							emnapiAWST.pending.length = 0;
							emnapiAWST.pendingHead = 0;
						}
						emnapiCtx.features.setImmediate(() => {
							emnapiAWST.callComplete(work, 11);
						});
						return 0;
					} else return 9;
				}
				return 9;
			},
			remove: function(id) {
				const work = emnapiAWST.values[id];
				if (!work) return;
				if (emnapiNodeBinding) emnapiNodeBinding.node.emitAsyncDestroy({
					asyncId: work.asyncId,
					triggerAsyncId: work.triggerAsyncId
				});
				emnapiAWST.values[id] = void 0;
				emnapiAWST.idGen.reuse(id);
			}
		};
		const { _emnapi_node_emit_async_init, _emnapi_node_emit_async_destroy, _emnapi_runtime_keepalive_pop, _emnapi_runtime_keepalive_push } = emnapiPluginCtx;
		var emnapiAWMT = {
			pool: [],
			workerReady: null,
			globalAddress: 0,
			globalOffset: {
				idle_threads: 0,
				q: 4,
				next: 4,
				prev: 8,
				mutex: 12,
				cond: 16,
				exit_message: 20,
				end: 28
			},
			offset: {
				resource: 0,
				async_id: 8,
				trigger_async_id: 16,
				env: 24,
				status: 28,
				queue: 32,
				queue_next: 32,
				queue_prev: 36,
				data: 40,
				execute: 44,
				complete: 48,
				end: 52
			},
			/**
			* When another thread grows the shared WebAssembly.Memory, this agent's
			* cached `wasmMemory.buffer` may still have the old shorter length
			* (V8 refreshes it lazily). If a pointer derived from shared memory lies
			* beyond the cached length, `wasmMemory.grow(0)` forces the agent to
			* observe the current memory size and refreshes the buffer.
			*/
			ensureBufferFor(end) {
				let buffer = emscripten_runtime.wasmMemory.buffer;
				if (end > buffer.byteLength) {
					emscripten_runtime.wasmMemory.grow(0);
					buffer = emscripten_runtime.wasmMemory.buffer;
				}
				return buffer;
			},
			init() {
				emnapiAWMT.pool = [];
				emnapiAWMT.workerReady = null;
				if (typeof emscripten_runtime.PThread !== "undefined") {
					emscripten_runtime.PThread.unusedWorkers.forEach(emnapiAWMT.addListener);
					Object.values(emscripten_runtime.PThread.pthreads).forEach(emnapiAWMT.addListener);
					const __original_getNewWorker = emscripten_runtime.PThread.getNewWorker;
					emscripten_runtime.PThread.getNewWorker = function() {
						const r = __original_getNewWorker.apply(this, arguments);
						emnapiAWMT.addListener(r);
						return r;
					};
				}
			},
			addListener(worker) {
				if (!worker) return false;
				if (worker._emnapiAWMTListener) return true;
				const handler = function(e) {
					const __emnapi__ = (emscripten_runtime.ENVIRONMENT_IS_NODE ? e : e.data).__emnapi__;
					if (__emnapi__) {
						const type = __emnapi__.type;
						const payload = __emnapi__.payload;
						if (type === "async-work-complete") emnapiAWMT.callComplete(payload.work, 0);
					}
				};
				const dispose = function() {
					if (emscripten_runtime.ENVIRONMENT_IS_NODE) worker.off("message", handler);
					else worker.removeEventListener("message", handler, false);
					delete worker._emnapiAWMTListener;
				};
				worker._emnapiAWMTListener = {
					handler,
					dispose
				};
				if (emscripten_runtime.ENVIRONMENT_IS_NODE) worker.on("message", handler);
				else worker.addEventListener("message", handler, false);
				return true;
			},
			initGlobal() {
				if (!emnapiAWMT.globalAddress) {
					emnapiAWMT.globalAddress = emscripten_runtime._malloc(emnapiAWMT.globalOffset.end);
					emnapiAWMT.globalAddress >>>= 0;
					const size = emnapiAWMT.globalOffset.end;
					const addr = emnapiAWMT.globalAddress;
					new Uint8Array(emnapiAWMT.ensureBufferFor(addr + size), addr, size).fill(0);
					emnapiAWMT.queueInit(emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.q);
					emnapiAWMT.queueInit(emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.exit_message);
				}
			},
			terminateWorkers() {
				emnapiAWMT.pool.forEach((w) => {
					w._emnapiAWMTListener?.dispose();
					w._emnapiTSFNListener?.dispose();
					w.terminate();
				});
				emnapiAWMT.pool.length = 0;
			},
			initWorkers(n) {
				if (emscripten_runtime.ENVIRONMENT_IS_PTHREAD) return emnapiAWMT.workerReady || (emnapiAWMT.workerReady = Promise.resolve());
				if (emnapiAWMT.workerReady) return emnapiAWMT.workerReady;
				if (!("emnapi_async_worker_create" in emscripten_runtime.wasmInstance.exports)) throw new TypeError("`emnapi_async_worker_create` is not exported, please try to add `--export=emnapi_async_worker_create` to linker flags");
				const emnapi_async_worker_create = emscripten_runtime.wasmInstance.exports.emnapi_async_worker_create;
				const args = [];
				emnapiAWMT.initGlobal();
				for (let i = 0; i < n; ++i) args.push(emnapi_async_worker_create(1, emnapiAWMT.globalAddress));
				const promises = args.map((index) => {
					if (index === 0) return Promise.reject(/* @__PURE__ */ new Error("Failed to create async worker"));
					let worker;
					if (index < 0) {
						worker = emnapiAWMT.pool[-index - 1];
						if (worker) return worker.whenLoaded;
					}
					index >>>= 0;
					const tidOffset = 20;
					const tid = new DataView(emnapiAWMT.ensureBufferFor(index + tidOffset + 4)).getInt32(index + tidOffset, true);
					worker = emscripten_runtime.PThread.pthreads[tid];
					return worker.whenLoaded;
				});
				emnapiAWMT.workerReady = Promise.all(promises);
				return emnapiAWMT.workerReady;
			},
			getResource(work) {
				emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.resource + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return GET_HEAP_DATA_VIEW().getUint32(work + emnapiAWMT.offset.resource, true);
			},
			getExecute(work) {
				emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.execute + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return GET_HEAP_DATA_VIEW().getUint32(work + emnapiAWMT.offset.execute, true);
			},
			getComplete(work) {
				emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.complete + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return GET_HEAP_DATA_VIEW().getUint32(work + emnapiAWMT.offset.complete, true);
			},
			getEnv(work) {
				emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.env + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return GET_HEAP_DATA_VIEW().getUint32(work + emnapiAWMT.offset.env, true);
			},
			getData(work) {
				emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.data + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return GET_HEAP_DATA_VIEW().getUint32(work + emnapiAWMT.offset.data, true);
			},
			getMutex() {
				const index = emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.mutex;
				const mutex = {
					lock() {
						const isBrowserMain = typeof window !== "undefined" && typeof document !== "undefined" && !emscripten_runtime.ENVIRONMENT_IS_NODE;
						const i32a = new Int32Array(emnapiAWMT.ensureBufferFor(index + 4), index, 1);
						if (isBrowserMain) {
							while (true) if (Atomics.compareExchange(i32a, 0, 0, 10) === 0) return;
						} else while (true) {
							if (Atomics.compareExchange(i32a, 0, 0, 10) === 0) return;
							Atomics.wait(i32a, 0, 10);
						}
					},
					unlock() {
						const i32a = new Int32Array(emnapiAWMT.ensureBufferFor(index + 4), index, 1);
						if (Atomics.compareExchange(i32a, 0, 10, 0) !== 10) throw new Error("Tried to unlock while not holding the mutex");
						Atomics.notify(i32a, 0, 1);
					},
					execute(fn) {
						mutex.lock();
						try {
							return fn();
						} finally {
							mutex.unlock();
						}
					}
				};
				return mutex;
			},
			getCond() {
				const index = emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.cond;
				const mutex = emnapiAWMT.getMutex();
				return {
					wait() {
						const i32a = new Int32Array(emnapiAWMT.ensureBufferFor(index + 4), index, 1);
						const value = Atomics.load(i32a, 0);
						mutex.unlock();
						Atomics.wait(i32a, 0, value);
						mutex.lock();
					},
					signal() {
						const i32a = new Int32Array(emnapiAWMT.ensureBufferFor(index + 4), index, 1);
						Atomics.add(i32a, 0, 1);
						Atomics.notify(i32a, 0, 1);
					}
				};
			},
			queueInit(q) {
				emnapiAWMT.ensureBufferFor(q + 4 + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				GET_HEAP_DATA_VIEW().setUint32(q, q, true);
				GET_HEAP_DATA_VIEW().setUint32(q + 4, q, true);
			},
			queueInsertTail(h, q) {
				emnapiAWMT.ensureBufferFor(h + 4 + 4);
				emnapiAWMT.ensureBufferFor(q + 4 + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				GET_HEAP_DATA_VIEW().setUint32(q, h, true);
				const tempValue = GET_HEAP_DATA_VIEW().getUint32(h + 4, true);
				GET_HEAP_DATA_VIEW().setUint32(q + 4, tempValue, true);
				const qprev = GET_HEAP_DATA_VIEW().getUint32(q + 4, true);
				GET_HEAP_DATA_VIEW().setUint32(qprev, q, true);
				GET_HEAP_DATA_VIEW().setUint32(h + 4, q, true);
			},
			queueRemove(q) {
				emnapiAWMT.ensureBufferFor(q + 4 + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				const qprev = GET_HEAP_DATA_VIEW().getUint32(q + 4, true);
				const qnext = GET_HEAP_DATA_VIEW().getUint32(q, true);
				GET_HEAP_DATA_VIEW().setUint32(qprev, qnext, true);
				GET_HEAP_DATA_VIEW().setUint32(qnext + 4, qprev, true);
			},
			queueEmpty(q) {
				emnapiAWMT.ensureBufferFor(q + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				return q == GET_HEAP_DATA_VIEW().getUint32(q, true);
			},
			scheduleWork: function(work) {
				if (!emnapiAWMT.workerReady?.ready) emnapiAWMT.initWorkers(emnapi_shared._emnapi_async_work_pool_size()).then(() => {
					emnapiAWMT.workerReady.ready = true;
				}).catch((err) => {
					emnapiAWMT.workerReady = null;
					throw err;
				});
				_emnapi_runtime_keepalive_push();
				emnapiCtx.increaseWaitingRequestCounter();
				const statusBuffer = new Int32Array(emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.status + 4), work + emnapiAWMT.offset.status, 1);
				Atomics.store(statusBuffer, 0, 0);
				const mutex = emnapiAWMT.getMutex();
				const cond = emnapiAWMT.getCond();
				mutex.lock();
				try {
					emnapiAWMT.queueInsertTail(emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.q, work + emnapiAWMT.offset.queue);
				} catch (err) {
					_emnapi_runtime_keepalive_pop();
					emnapiCtx.decreaseWaitingRequestCounter();
					mutex.unlock();
					throw err;
				}
				emnapiAWMT.ensureBufferFor(emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.idle_threads + 4);
				var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
				if (GET_HEAP_DATA_VIEW().getUint32(emnapiAWMT.globalAddress + emnapiAWMT.globalOffset.idle_threads, true) > 0) cond.signal();
				mutex.unlock();
			},
			cancelWork(work) {
				let cancelled = false;
				emnapiAWMT.getMutex().execute(() => {
					emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.status + 4);
					var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
					cancelled = !emnapiAWMT.queueEmpty(work + emnapiAWMT.offset.queue) && GET_HEAP_DATA_VIEW().getInt32(work + emnapiAWMT.offset.status, true) !== 2;
					if (cancelled) emnapiAWMT.queueRemove(work + emnapiAWMT.offset.queue);
				});
				if (!cancelled) return 9;
				if (Atomics.compareExchange(new Int32Array(emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.status + 4), work + emnapiAWMT.offset.status, 1), 0, 0, 1) !== 0) return 9;
				emnapiCtx.features.setImmediate(() => {
					emnapiAWMT.callComplete(work, 11);
				});
				return 0;
			},
			callComplete: function(work, status) {
				_emnapi_runtime_keepalive_pop();
				emnapiCtx.decreaseWaitingRequestCounter();
				const complete = emnapiAWMT.getComplete(work);
				const env = emnapiAWMT.getEnv(work);
				const data = emnapiAWMT.getData(work);
				const envObject = emnapi_shared.emnapiEnv;
				const scope = emnapiCtx.openScope(envObject);
				const callback = () => {
					if (!complete) return;
					envObject.callbackIntoModule(true, () => {
						emnapiPluginCtx.wasmTable.get(complete)(env, status, data);
					});
				};
				try {
					if (emnapiNodeBinding) {
						const resource = emnapiAWMT.getResource(work);
						const resource_value = emnapiCtx.getRef(resource).get();
						const resourceObject = emnapiCtx.jsValueFromNapiValue(resource_value);
						const view = new DataView(emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.trigger_async_id + 8));
						const asyncId = view.getFloat64(work + emnapiAWMT.offset.async_id, true);
						const triggerAsyncId = view.getFloat64(work + emnapiAWMT.offset.trigger_async_id, true);
						emnapiNodeBinding.node.makeCallback(resourceObject, callback, [], {
							asyncId,
							triggerAsyncId
						});
					} else callback();
				} finally {
					emnapiCtx.closeScope(envObject, scope);
				}
			}
		};
		emnapiAWST.init();
		emnapiAWMT.init();
		/** @__sig ippppppp */
		var napi_create_async_work = emnapi_shared.singleThreadAsyncWork ? function(env, resource, resource_name, execute, complete, data, result) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			envObject.checkGCAccess();
			if (!execute) return envObject.setLastError(1);
			if (!result) return envObject.setLastError(1);
			let resourceObject;
			if (resource) resourceObject = Object(emnapiCtx.jsValueFromNapiValue(resource));
			else resourceObject = {};
			if (!resource_name) return envObject.setLastError(1);
			const resourceName = String(emnapiCtx.jsValueFromNapiValue(resource_name));
			const id = emnapiAWST.create(env, resourceObject, resourceName, execute, complete, data);
			result >>>= 0;
			var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
			GET_HEAP_DATA_VIEW().setUint32(result, id, true);
			return envObject.clearLastError();
		} : function(env, resource, resource_name, execute, complete, data, result) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			envObject.checkGCAccess();
			if (!execute) return envObject.setLastError(1);
			if (!result) return envObject.setLastError(1);
			let resourceObject;
			if (resource) resourceObject = Object(emnapiCtx.jsValueFromNapiValue(resource));
			else resourceObject = {};
			if (!resource_name) return envObject.setLastError(1);
			const sizeofAW = emnapiAWMT.offset.end;
			let aw = emscripten_runtime._malloc(sizeofAW);
			if (!aw) return envObject.setLastError(9);
			aw >>>= 0;
			new Uint8Array(emnapiAWMT.ensureBufferFor(aw + sizeofAW)).subarray(aw, aw + sizeofAW).fill(0);
			const s = emnapiCtx.napiValueFromJsValue(resourceObject);
			const resource_ = emnapiCtx.createReference(envObject, s, 1, 1).id;
			var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
			GET_HEAP_DATA_VIEW().setUint32(aw, resource_, true);
			_emnapi_node_emit_async_init(s, resource_name, -1, aw + emnapiAWMT.offset.async_id);
			GET_HEAP_DATA_VIEW().setUint32(aw + emnapiAWMT.offset.env, env, true);
			GET_HEAP_DATA_VIEW().setUint32(aw + emnapiAWMT.offset.execute, execute, true);
			GET_HEAP_DATA_VIEW().setUint32(aw + emnapiAWMT.offset.complete, complete, true);
			GET_HEAP_DATA_VIEW().setUint32(aw + emnapiAWMT.offset.data, data, true);
			emnapiAWMT.queueInit(aw + emnapiAWMT.offset.queue);
			result >>>= 0;
			GET_HEAP_DATA_VIEW().setUint32(result, aw, true);
			return envObject.clearLastError();
		};
		/** @__sig ipp */
		var napi_delete_async_work = emnapi_shared.singleThreadAsyncWork ? function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			envObject.checkGCAccess();
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			emnapiAWST.remove(work);
			return envObject.clearLastError();
		} : function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			envObject.checkGCAccess();
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			const resource = emnapiAWMT.getResource(work);
			emnapiCtx.getRef(resource).dispose();
			if (emnapiNodeBinding) {
				const view = new DataView(emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.trigger_async_id + 8));
				const asyncId = view.getFloat64(work + emnapiAWMT.offset.async_id, true);
				const triggerAsyncId = view.getFloat64(work + emnapiAWMT.offset.trigger_async_id, true);
				_emnapi_node_emit_async_destroy(asyncId, triggerAsyncId);
			}
			emscripten_runtime._free(work);
			return envObject.clearLastError();
		};
		/** @__sig ipp */
		var napi_queue_async_work = emnapi_shared.singleThreadAsyncWork ? function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			emnapiAWST.queue(work);
			return envObject.clearLastError();
		} : function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			emnapiAWMT.scheduleWork(work);
			return envObject.clearLastError();
		};
		/** @__sig ipp */
		var napi_cancel_async_work = emnapi_shared.singleThreadAsyncWork ? function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			const status = emnapiAWST.cancel(work);
			if (status === 0) return envObject.clearLastError();
			return envObject.setLastError(status);
		} : function(env, work) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			if (!work) return envObject.setLastError(1);
			work >>>= 0;
			const status = emnapiAWMT.cancelWork(work);
			if (status === 0) return envObject.clearLastError();
			return envObject.setLastError(status);
		};
		/** @__sig pp */
		function _emnapi_async_worker(globalAddress) {
			globalAddress >>>= 0;
			emnapiAWMT.globalAddress = globalAddress;
			const mutex = emnapiAWMT.getMutex();
			const cond = emnapiAWMT.getCond();
			mutex.lock();
			const exitMessageAddr = globalAddress + emnapiAWMT.globalOffset.exit_message;
			const idleThreadsAddr = globalAddress + emnapiAWMT.globalOffset.idle_threads;
			const workerQueueAddr = globalAddress + emnapiAWMT.globalOffset.q;
			var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
			for (;;) {
				emnapiAWMT.ensureBufferFor(workerQueueAddr + 4);
				while (emnapiAWMT.queueEmpty(workerQueueAddr)) {
					Atomics.add(new Int32Array(emnapiAWMT.ensureBufferFor(idleThreadsAddr + 4), idleThreadsAddr, 1), 0, 1);
					cond.wait();
					Atomics.sub(new Int32Array(emnapiAWMT.ensureBufferFor(idleThreadsAddr + 4), idleThreadsAddr, 1), 0, 1);
				}
				const q = GET_HEAP_DATA_VIEW().getUint32(workerQueueAddr, true);
				if (q === exitMessageAddr) {
					cond.signal();
					mutex.unlock();
					break;
				}
				const work = q - emnapiAWMT.offset.queue;
				emnapiAWMT.queueRemove(q);
				emnapiAWMT.queueInit(q);
				mutex.unlock();
				const statusBuffer = new Int32Array(emnapiAWMT.ensureBufferFor(work + emnapiAWMT.offset.status + 4), work + emnapiAWMT.offset.status, 1);
				if (Atomics.load(statusBuffer, 0) === 1) emscripten_runtime.abort("unreachable");
				const execute = emnapiAWMT.getExecute(work);
				const env = emnapiAWMT.getEnv(work);
				const data = emnapiAWMT.getData(work);
				emnapiPluginCtx.wasmTable.get(execute)(env, data);
				Atomics.store(statusBuffer, 0, 2);
				const postMessage = emnapi_shared.napiModule.postMessage;
				postMessage({ __emnapi__: {
					type: "async-work-complete",
					payload: { work }
				} });
				mutex.lock();
			}
			return 0;
		}
		/** @__sig ipp */
		function _emnapi_spawn_worker(f, globalAddress) {
			if (typeof emnapi_shared.onCreateWorker !== "function") throw new TypeError("`options.onCreateWorker` is not a function");
			const promises = [];
			const args = [];
			if (!("emnapi_async_worker_create" in emscripten_runtime.wasmInstance.exports)) throw new TypeError("`emnapi_async_worker_create` is not exported, please try to add `--export=emnapi_async_worker_create` to linker flags");
			args.push(emscripten_runtime.wasmInstance.exports.emnapi_async_worker_create(0, 0));
			const handleError = (e) => {
				if ("message" in e && (e.message.indexOf("RuntimeError") !== -1 || e.message.indexOf("unreachable") !== -1)) emnapiAWMT.terminateWorkers();
			};
			let ret;
			try {
				const worker = emnapi_shared.onCreateWorker({
					type: "async-work",
					name: "emnapi-async-worker"
				});
				const p = emscripten_runtime.PThread.loadWasmModuleToWorker(worker);
				if (emscripten_runtime.ENVIRONMENT_IS_NODE) worker.on("error", handleError);
				else worker.addEventListener("error", handleError, false);
				emnapiAWMT.addListener(worker);
				if (typeof emnapiPluginCtx.emnapiTSFN !== "undefined") emnapiPluginCtx.emnapiTSFN.addListener(worker);
				promises.push(p.then(() => {
					if (typeof worker.unref === "function") worker.unref();
				}));
				ret = emnapiAWMT.pool.push(worker) - 1;
				const arg = args[0];
				worker.threadBlockBase = arg;
				worker.postMessage({ __emnapi__: {
					type: "async-worker-init",
					payload: {
						arg,
						func: [f, globalAddress]
					}
				} });
			} catch (err) {
				const arg = args[0];
				emscripten_runtime._free(arg);
				throw err;
			}
			return ret;
		}
		function initWorker(startArg, func) {
			if (emnapi_shared.napiModule.childThread) {
				if (typeof emscripten_runtime.wasmInstance.exports.emnapi_async_worker_init !== "function") throw new TypeError("`emnapi_async_worker_init` is not exported, please try to add `--export=emnapi_async_worker_init` to linker flags");
				emscripten_runtime.wasmInstance.exports.emnapi_async_worker_init(startArg);
				emnapiPluginCtx.wasmTable.get(func[0])(func[1]);
			} else throw new Error("startThread is only available in child threads");
		}
		emnapi_shared.napiModule.initWorker = initWorker;
		exports._emnapi_async_worker = _emnapi_async_worker;
		exports._emnapi_spawn_worker = _emnapi_spawn_worker;
		exports.napi_cancel_async_work = napi_cancel_async_work;
		exports.napi_create_async_work = napi_create_async_work;
		exports.napi_delete_async_work = napi_delete_async_work;
		exports.napi_queue_async_work = napi_queue_async_work;
		return exports;
	})({}, emnapiPluginCtx, emnapiPluginCtx);
	return { importObject: (original) => {
		Object.keys(mod).forEach((key) => {
			if (key.startsWith("napi_") || key.startsWith("node_api_")) original.napi[key] = mod[key];
			else original.env[key] = mod[key];
		});
	} };
}
//#endregion
//#region ../node_modules/@emnapi/core/dist/plugins/threadsafe-function.js
function threadsafeFunction(emnapiPluginCtx) {
	const { emnapiCtx, emnapiNodeBinding, _emnapi_node_emit_async_destroy: __emnapi_node_emit_async_destroy, _emnapi_node_emit_async_init: __emnapi_node_emit_async_init, _emnapi_runtime_keepalive_pop: __emnapi_runtime_keepalive_pop, _emnapi_runtime_keepalive_push: __emnapi_runtime_keepalive_push } = emnapiPluginCtx;
	var mod = (function(exports, emnapi_shared, emscripten_runtime) {
		/**
		* @__deps malloc
		* @__deps free
		* @__deps $emnapiCtx
		* @__deps $emnapiEnv
		* @__deps $emnapiNodeBinding
		* @__deps _emnapi_node_emit_async_destroy
		* @__deps _emnapi_runtime_keepalive_pop
		* @__postset
		* ```
		* emnapiTSFN.init();
		* ```
		*/
		const emnapiTSFN = {
			_liveSet: {},
			offset: {
				__size__: 0,
				resource: 0,
				async_id: 0,
				trigger_async_id: 0,
				queue_size: 0,
				is_some: 0,
				queue: 0,
				async_pending: 0,
				async_u_fd: 0,
				thread_count: 0,
				state: 0,
				dispatch_state: 0,
				context: 0,
				max_queue_size: 0,
				ref: 0,
				env: 0,
				finalize_data: 0,
				finalize_cb: 0,
				call_js_cb: 0,
				handles_closing: 0,
				async_ref: 0,
				mutex: 0,
				cond: 0
			},
			init() {
				emnapiTSFN._liveSet = /* @__PURE__ */ new Set();
				emnapiTSFN.offset.__size__ = 184;
				emnapiTSFN.offset.resource = 0;
				emnapiTSFN.offset.async_id = 8;
				emnapiTSFN.offset.trigger_async_id = 16;
				emnapiTSFN.offset.queue_size = 60;
				emnapiTSFN.offset.is_some = 24;
				emnapiTSFN.offset.queue = 64;
				emnapiTSFN.offset.async_pending = 132;
				emnapiTSFN.offset.async_u_fd = 96;
				emnapiTSFN.offset.thread_count = 136;
				emnapiTSFN.offset.state = 140;
				emnapiTSFN.offset.dispatch_state = 144;
				emnapiTSFN.offset.context = 148;
				emnapiTSFN.offset.max_queue_size = 152;
				emnapiTSFN.offset.ref = 156;
				emnapiTSFN.offset.env = 160;
				emnapiTSFN.offset.finalize_data = 164;
				emnapiTSFN.offset.finalize_cb = 168;
				emnapiTSFN.offset.call_js_cb = 172;
				emnapiTSFN.offset.handles_closing = 176;
				emnapiTSFN.offset.async_ref = 180;
				emnapiTSFN.offset.mutex = 32;
				emnapiTSFN.offset.cond = 56;
				emnapiTSFN.offset.mutex = emnapiTSFN.offset.mutex + 4;
				if (typeof emscripten_runtime.PThread !== "undefined") {
					emscripten_runtime.PThread.unusedWorkers.forEach(emnapiTSFN.addListener);
					Object.values(emscripten_runtime.PThread.pthreads).forEach(emnapiTSFN.addListener);
					const __original_getNewWorker = emscripten_runtime.PThread.getNewWorker;
					emscripten_runtime.PThread.getNewWorker = function() {
						const r = __original_getNewWorker.apply(this, arguments);
						emnapiTSFN.addListener(r);
						return r;
					};
				}
			},
			addListener(worker) {
				if (!worker) return false;
				if (worker._emnapiTSFNListener) return true;
				const handler = function(e) {
					const __emnapi__ = (emscripten_runtime.ENVIRONMENT_IS_NODE ? e : e.data).__emnapi__;
					if (__emnapi__) {
						const type = __emnapi__.type;
						const payload = __emnapi__.payload;
						if (type === "tsfn-send") {
							const pendng = payload.tsfn + emnapiTSFN.offset.async_pending;
							if (Atomics.load(new Int32Array(emnapiTSFN.ensureBufferFor(pendng + 4)), pendng >>> 2) !== 0) emnapiTSFN.enqueue(payload.tsfn);
						}
					}
				};
				const dispose = function() {
					if (emscripten_runtime.ENVIRONMENT_IS_NODE) worker.off("message", handler);
					else worker.removeEventListener("message", handler, false);
					delete worker._emnapiTSFNListener;
				};
				worker._emnapiTSFNListener = {
					handler,
					dispose
				};
				if (emscripten_runtime.ENVIRONMENT_IS_NODE) worker.on("message", handler);
				else worker.addEventListener("message", handler, false);
				return true;
			},
			/**
			* When another thread grows the shared WebAssembly.Memory, this agent's
			* cached `wasmMemory.buffer` may still have the old shorter length
			* (V8 refreshes it lazily). If a pointer derived from shared memory lies
			* beyond the cached length, `wasmMemory.grow(0)` forces the agent to
			* observe the current memory size and refreshes the buffer.
			*/
			ensureBufferFor(end) {
				let buffer = emscripten_runtime.wasmMemory.buffer;
				if (end > buffer.byteLength) {
					emscripten_runtime.wasmMemory.grow(0);
					buffer = emscripten_runtime.wasmMemory.buffer;
				}
				return buffer;
			},
			initQueue(func) {
				const size = 8;
				let queue = emscripten_runtime._malloc(size);
				if (!queue) return false;
				queue >>>= 0;
				new Uint8Array(emnapiTSFN.ensureBufferFor(queue + size), queue, size).fill(0);
				emnapiTSFN.storeSizeTypeValue(func + emnapiTSFN.offset.queue, queue, false);
				return true;
			},
			destroyQueue(func) {
				const queue = emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.queue, false);
				if (queue) {
					let node = emnapiTSFN.loadSizeTypeValue(queue, false);
					while (node !== 0) {
						const next = emnapiTSFN.loadSizeTypeValue(node + 4, false);
						emscripten_runtime._free(node);
						node = next;
					}
					emscripten_runtime._free(queue);
				}
			},
			pushQueue(func, data) {
				const queue = emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.queue, false);
				const head = emnapiTSFN.loadSizeTypeValue(queue, false);
				const tail = emnapiTSFN.loadSizeTypeValue(queue + 4, false);
				let node = emscripten_runtime._malloc(8);
				if (!node) throw new Error("OOM");
				node >>>= 0;
				emnapiTSFN.storeSizeTypeValue(node, data, false);
				emnapiTSFN.storeSizeTypeValue(node + 4, 0, false);
				if (head === 0 && tail === 0) {
					emnapiTSFN.storeSizeTypeValue(queue, node, false);
					emnapiTSFN.storeSizeTypeValue(queue + 4, node, false);
				} else {
					emnapiTSFN.storeSizeTypeValue(tail + 4, node, false);
					emnapiTSFN.storeSizeTypeValue(queue + 4, node, false);
				}
				emnapiTSFN.addQueueSize(func);
			},
			shiftQueue(func) {
				const queue = emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.queue, false);
				const head = emnapiTSFN.loadSizeTypeValue(queue, false);
				if (head === 0) return 0;
				const node = head;
				const next = emnapiTSFN.loadSizeTypeValue(head + 4, false);
				emnapiTSFN.storeSizeTypeValue(queue, next, false);
				if (next === 0) emnapiTSFN.storeSizeTypeValue(queue + 4, 0, false);
				emnapiTSFN.storeSizeTypeValue(node + 4, 0, false);
				const value = emnapiTSFN.loadSizeTypeValue(node, false);
				emscripten_runtime._free(node);
				emnapiTSFN.subQueueSize(func);
				return value;
			},
			push(func, data, mode) {
				const mutex = emnapiTSFN.getMutex(func);
				const cond = emnapiTSFN.getCond(func);
				const waitCondition = () => {
					const queueSize = emnapiTSFN.getQueueSize(func);
					const maxSize = emnapiTSFN.getMaxQueueSize(func);
					return queueSize >= maxSize && maxSize > 0 && emnapiTSFN.getState(func) === 0;
				};
				const isBrowserMain = typeof window !== "undefined" && typeof document !== "undefined" && !emscripten_runtime.ENVIRONMENT_IS_NODE;
				let shouldDelete = false;
				const ret = mutex.execute(() => {
					while (waitCondition()) {
						if (mode === 0) return 15;
						/**
						* Browser JS main thread can not use `Atomics.wait`
						*
						* Related:
						* https://github.com/nodejs/node/pull/32689
						* https://github.com/nodejs/node/pull/33453
						*/
						if (isBrowserMain) return 21;
						cond.wait();
					}
					if (emnapiTSFN.getState(func) === 0) {
						emnapiTSFN.pushQueue(func, data);
						emnapiTSFN.send(func);
						return 0;
					}
					if (emnapiTSFN.getThreadCount(func) === 0) return 1;
					emnapiTSFN.subThreadCount(func);
					if (!(emnapiTSFN.getState(func) === 2 && emnapiTSFN.getThreadCount(func) === 0)) return 16;
					shouldDelete = true;
					return 16;
				});
				if (shouldDelete) emnapiTSFN.destroy(func);
				return ret;
			},
			getMutex(func) {
				const index = func + emnapiTSFN.offset.mutex;
				const mutex = {
					lock() {
						const isBrowserMain = typeof window !== "undefined" && typeof document !== "undefined" && !emscripten_runtime.ENVIRONMENT_IS_NODE;
						const i32a = new Int32Array(emnapiTSFN.ensureBufferFor(index + 4), index, 1);
						if (isBrowserMain) {
							while (true) if (Atomics.compareExchange(i32a, 0, 0, 10) === 0) return;
						} else while (true) {
							if (Atomics.compareExchange(i32a, 0, 0, 10) === 0) return;
							Atomics.wait(i32a, 0, 10);
						}
					},
					unlock() {
						const i32a = new Int32Array(emnapiTSFN.ensureBufferFor(index + 4), index, 1);
						if (Atomics.compareExchange(i32a, 0, 10, 0) !== 10) throw new Error("Tried to unlock while not holding the mutex");
						Atomics.notify(i32a, 0, 1);
					},
					execute(fn) {
						mutex.lock();
						try {
							return fn();
						} finally {
							mutex.unlock();
						}
					}
				};
				return mutex;
			},
			getCond(func) {
				const index = func + emnapiTSFN.offset.cond;
				const mutex = emnapiTSFN.getMutex(func);
				return {
					wait() {
						const i32a = new Int32Array(emnapiTSFN.ensureBufferFor(index + 4), index, 1);
						const value = Atomics.load(i32a, 0);
						mutex.unlock();
						Atomics.wait(i32a, 0, value);
						mutex.lock();
					},
					signal() {
						const i32a = new Int32Array(emnapiTSFN.ensureBufferFor(index + 4), index, 1);
						Atomics.add(i32a, 0, 1);
						Atomics.notify(i32a, 0, 1);
					}
				};
			},
			getQueueSize(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.queue_size, true);
			},
			addQueueSize(func) {
				const offset = emnapiTSFN.offset.queue_size;
				let arr, index;
				arr = new Uint32Array(emnapiTSFN.ensureBufferFor(func + offset + 4));
				index = func + offset >>> 2;
				Atomics.add(arr, index, 1);
			},
			subQueueSize(func) {
				const offset = emnapiTSFN.offset.queue_size;
				let arr, index;
				arr = new Uint32Array(emnapiTSFN.ensureBufferFor(func + offset + 4));
				index = func + offset >>> 2;
				Atomics.sub(arr, index, 1);
			},
			getThreadCount(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.thread_count, true);
			},
			addThreadCount(func) {
				const offset = emnapiTSFN.offset.thread_count;
				let arr, index;
				arr = new Uint32Array(emnapiTSFN.ensureBufferFor(func + offset + 4));
				index = func + offset >>> 2;
				Atomics.add(arr, index, 1);
			},
			subThreadCount(func) {
				const offset = emnapiTSFN.offset.thread_count;
				let arr, index;
				arr = new Uint32Array(emnapiTSFN.ensureBufferFor(func + offset + 4));
				index = func + offset >>> 2;
				Atomics.sub(arr, index, 1);
			},
			getState(func) {
				return Atomics.load(new Int32Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.state + 4)), func + emnapiTSFN.offset.state >>> 2);
			},
			setState(func, value) {
				Atomics.store(new Int32Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.state + 4)), func + emnapiTSFN.offset.state >>> 2, value);
			},
			getHandlesClosing(func) {
				return Atomics.load(new Int8Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.handles_closing + 1)), func + emnapiTSFN.offset.handles_closing);
			},
			setHandlesClosing(func, value) {
				Atomics.store(new Int8Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.handles_closing + 1)), func + emnapiTSFN.offset.handles_closing, value);
			},
			getDispatchState(func) {
				return Atomics.load(new Uint32Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.dispatch_state + 4)), func + emnapiTSFN.offset.dispatch_state >>> 2);
			},
			getContext(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.context, false);
			},
			getMaxQueueSize(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.max_queue_size, true);
			},
			getEnv(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.env, false);
			},
			getCallJSCb(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.call_js_cb, false);
			},
			getRef(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.ref, false);
			},
			getResource(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.resource, false);
			},
			getFinalizeCb(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.finalize_cb, false);
			},
			getFinalizeData(func) {
				return emnapiTSFN.loadSizeTypeValue(func + emnapiTSFN.offset.finalize_data, false);
			},
			loadSizeTypeValue(offset, unsigned) {
				let ret;
				let arr;
				if (unsigned) {
					arr = new Uint32Array(emnapiTSFN.ensureBufferFor(offset + 4));
					ret = Atomics.load(arr, offset >>> 2);
					return ret;
				} else {
					arr = new Int32Array(emnapiTSFN.ensureBufferFor(offset + 4));
					ret = Atomics.load(arr, offset >>> 2);
					return ret;
				}
			},
			storeSizeTypeValue(offset, value, unsigned) {
				let arr;
				if (unsigned) {
					arr = new Uint32Array(emnapiTSFN.ensureBufferFor(offset + 4));
					Atomics.store(arr, offset >>> 2, value);
					return;
				} else {
					arr = new Int32Array(emnapiTSFN.ensureBufferFor(offset + 4));
					Atomics.store(arr, offset >>> 2, value >>> 0);
					return;
				}
			},
			releaseResources(func) {
				if (emnapiTSFN.getState(func) !== 2) {
					emnapiTSFN.setState(func, 2);
					emnapiTSFN.getEnv(func);
					const envObject = emnapi_shared.emnapiEnv;
					const ref = emnapiTSFN.getRef(func);
					if (ref) emnapiCtx.getRef(ref).dispose();
					const resource = emnapiTSFN.getResource(func);
					emnapiCtx.getRef(resource).dispose();
					emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.is_some + 1);
					var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
					GET_HEAP_DATA_VIEW().setInt8(func + emnapiTSFN.offset.is_some, 0, true);
					emnapiCtx.removeCleanupHook(envObject, emnapiTSFN.cleanup, func);
					envObject.unref();
					const asyncRefAddress = func + emnapiTSFN.offset.async_ref;
					const asyncRefOffset = asyncRefAddress >>> 2;
					const arr = new Uint32Array(emnapiTSFN.ensureBufferFor(asyncRefAddress + 4));
					if (Atomics.load(arr, asyncRefOffset) > 0) {
						Atomics.store(arr, asyncRefOffset, 0);
						__emnapi_runtime_keepalive_pop();
						emnapiCtx.decreaseWaitingRequestCounter();
					}
					if (emnapiNodeBinding) {
						const view = new DataView(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.trigger_async_id + 8));
						const asyncId = view.getFloat64(func + emnapiTSFN.offset.async_id, true);
						const triggerAsyncId = view.getFloat64(func + emnapiTSFN.offset.trigger_async_id, true);
						__emnapi_node_emit_async_destroy(asyncId, triggerAsyncId);
					}
				}
			},
			destroy(func) {
				emnapiTSFN._liveSet.delete(func);
				emnapiTSFN.destroyQueue(func);
				emnapiTSFN.releaseResources(func);
				emscripten_runtime._free(func);
			},
			emptyQueue(func) {
				const drainQueue = [];
				emnapiTSFN.getMutex(func).execute(() => {
					while (emnapiTSFN.getQueueSize(func) > 0) drainQueue.push(emnapiTSFN.shiftQueue(func));
				});
				const callJsCb = emnapiTSFN.getCallJSCb(func);
				const context = emnapiTSFN.getContext(func);
				let data;
				for (let i = 0; i < drainQueue.length; i++) {
					data = drainQueue[i];
					if (callJsCb) emnapiPluginCtx.wasmTable.get(callJsCb)(0, 0, context, data);
				}
			},
			maybeDelete(func) {
				let shouldDelete = false;
				emnapiTSFN.getMutex(func).execute(() => {
					if (emnapiTSFN.getThreadCount(func) > 0) emnapiTSFN.releaseResources(func);
					else shouldDelete = true;
				});
				if (shouldDelete) emnapiTSFN.destroy(func);
			},
			finalize(func) {
				emnapiTSFN.getEnv(func);
				const envObject = emnapi_shared.emnapiEnv;
				emnapiCtx.openScope(envObject);
				const finalize = emnapiTSFN.getFinalizeCb(func);
				const data = emnapiTSFN.getFinalizeData(func);
				const context = emnapiTSFN.getContext(func);
				const f = () => {
					envObject.callFinalizerInternal(0, finalize, data, context);
				};
				try {
					emnapiTSFN.emptyQueue(func);
					if (finalize) {
						if (emnapiNodeBinding) {
							const resource = emnapiTSFN.getResource(func);
							const resource_value = emnapiCtx.getRef(resource).get();
							const resourceObject = emnapiCtx.jsValueFromNapiValue(resource_value);
							const view = new DataView(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.trigger_async_id + 8));
							const asyncId = view.getFloat64(func + emnapiTSFN.offset.async_id, true);
							const triggerAsyncId = view.getFloat64(func + emnapiTSFN.offset.trigger_async_id, true);
							emnapiNodeBinding.node.makeCallback(resourceObject, f, [], {
								asyncId,
								triggerAsyncId
							});
						} else f();
					}
					emnapiTSFN.maybeDelete(func);
				} finally {
					emnapiCtx.closeScope(envObject);
				}
			},
			cleanup(func) {
				emnapiTSFN.closeHandlesAndMaybeDelete(func, 1);
			},
			closeHandlesAndMaybeDelete(func, set_closing) {
				emnapiTSFN.getEnv(func);
				const envObject = emnapi_shared.emnapiEnv;
				emnapiCtx.openScope(envObject);
				try {
					if (set_closing) emnapiTSFN.getMutex(func).execute(() => {
						emnapiTSFN.setState(func, 1);
						if (emnapiTSFN.getMaxQueueSize(func) > 0) emnapiTSFN.getCond(func).signal();
					});
					if (emnapiTSFN.getHandlesClosing(func)) return;
					emnapiTSFN.setHandlesClosing(func, 1);
					Atomics.store(new Int32Array(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.async_pending + 4)), func + emnapiTSFN.offset.async_pending >>> 2, 1);
					emnapiCtx.features.setImmediate(() => {
						emnapiTSFN.finalize(func);
					});
				} finally {
					emnapiCtx.closeScope(envObject);
				}
			},
			dispatchOne(func) {
				let data = 0;
				let popped_value = false;
				let has_more = false;
				const mutex = emnapiTSFN.getMutex(func);
				const cond = emnapiTSFN.getCond(func);
				mutex.execute(() => {
					if (emnapiTSFN.getState(func) === 0) {
						let size = emnapiTSFN.getQueueSize(func);
						if (size > 0) {
							data = emnapiTSFN.shiftQueue(func);
							popped_value = true;
							const maxQueueSize = emnapiTSFN.getMaxQueueSize(func);
							if (size === maxQueueSize && maxQueueSize > 0) cond.signal();
							size--;
						}
						if (size === 0) {
							if (emnapiTSFN.getThreadCount(func) === 0) {
								emnapiTSFN.setState(func, 1);
								if (emnapiTSFN.getMaxQueueSize(func) > 0) cond.signal();
								emnapiTSFN.closeHandlesAndMaybeDelete(func, 0);
							}
						} else has_more = true;
					} else emnapiTSFN.closeHandlesAndMaybeDelete(func, 0);
				});
				if (popped_value) {
					const env = emnapiTSFN.getEnv(func);
					const envObject = emnapi_shared.emnapiEnv;
					emnapiCtx.openScope(envObject);
					const f = () => {
						envObject.callbackIntoModule(false, () => {
							const callJsCb = emnapiTSFN.getCallJSCb(func);
							const ref = emnapiTSFN.getRef(func);
							const js_callback = ref ? emnapiCtx.getRef(ref).get() : 0;
							if (callJsCb) {
								const context = emnapiTSFN.getContext(func);
								emnapiPluginCtx.wasmTable.get(callJsCb)(env, js_callback, context, data);
							} else {
								const jsCallback = js_callback ? emnapiCtx.jsValueFromNapiValue(js_callback) : null;
								if (typeof jsCallback === "function") jsCallback();
							}
						});
					};
					try {
						if (emnapiNodeBinding) {
							const resource = emnapiTSFN.getResource(func);
							const resource_value = emnapiCtx.getRef(resource).get();
							const resourceObject = emnapiCtx.jsValueFromNapiValue(resource_value);
							const view = new DataView(emnapiTSFN.ensureBufferFor(func + emnapiTSFN.offset.trigger_async_id + 8));
							emnapiNodeBinding.node.makeCallback(resourceObject, f, [], {
								asyncId: view.getFloat64(func + emnapiTSFN.offset.async_id, true),
								triggerAsyncId: view.getFloat64(func + emnapiTSFN.offset.trigger_async_id, true)
							});
						} else f();
					} finally {
						emnapiCtx.closeScope(envObject);
					}
				}
				return has_more;
			},
			dispatch(func) {
				let has_more = true;
				let iterations_left = 1e3;
				const dispatchStateAddress = func + emnapiTSFN.offset.dispatch_state;
				const index = dispatchStateAddress >>> 2;
				while (has_more && --iterations_left !== 0) {
					Atomics.store(new Uint32Array(emnapiTSFN.ensureBufferFor(dispatchStateAddress + 4)), index, 1);
					try {
						has_more = emnapiTSFN.dispatchOne(func);
					} catch (err) {
						if (emnapiTSFN._liveSet.has(func)) {
							Atomics.exchange(new Uint32Array(emnapiTSFN.ensureBufferFor(dispatchStateAddress + 4)), index, 0);
							emnapiTSFN.send(func);
						}
						throw err;
					}
					if (Atomics.exchange(new Uint32Array(emnapiTSFN.ensureBufferFor(dispatchStateAddress + 4)), index, 0) !== 1) has_more = true;
				}
				if (has_more) emnapiTSFN.send(func);
			},
			enqueue(func) {
				const pending = func + emnapiTSFN.offset.async_pending;
				const scheduled = func + emnapiTSFN.offset.async_u_fd;
				const end = Math.max(pending, scheduled) + 4;
				const state = () => new Int32Array(emnapiTSFN.ensureBufferFor(end));
				if (Atomics.exchange(state(), scheduled >>> 2, 1) !== 0) return;
				emnapiCtx.features.setImmediate(() => {
					if (!emnapiTSFN._liveSet.has(func)) return;
					if (Atomics.load(state(), pending >>> 2) === 0) {
						Atomics.store(state(), scheduled >>> 2, 0);
						return;
					}
					emnapiCtx.features.setImmediate(() => {
						if (!emnapiTSFN._liveSet.has(func)) return;
						try {
							if (Atomics.exchange(state(), pending >>> 2, 0) === 0) return;
							emnapiTSFN.dispatch(func);
						} finally {
							if (emnapiTSFN._liveSet.has(func)) {
								Atomics.store(state(), scheduled >>> 2, 0);
								if (Atomics.load(state(), pending >>> 2) !== 0) emnapiTSFN.enqueue(func);
							}
						}
					});
				});
			},
			send(func) {
				const dispatchStateAddress = func + emnapiTSFN.offset.dispatch_state;
				if ((Atomics.or(new Uint32Array(emnapiTSFN.ensureBufferFor(dispatchStateAddress + 4)), dispatchStateAddress >>> 2, 2) & 1) === 1) return;
				const pendng = func + emnapiTSFN.offset.async_pending;
				if (Atomics.load(new Int32Array(emnapiTSFN.ensureBufferFor(pendng + 4)), pendng >>> 2) !== 0) return;
				if (Atomics.exchange(new Int32Array(emnapiTSFN.ensureBufferFor(pendng + 4)), pendng >>> 2, 1) === 0) {
					if (typeof emscripten_runtime.ENVIRONMENT_IS_PTHREAD !== "undefined" && emscripten_runtime.ENVIRONMENT_IS_PTHREAD) postMessage({ __emnapi__: {
						type: "tsfn-send",
						payload: { tsfn: func }
					} });
					else emnapiTSFN.enqueue(func);
				}
			}
		};
		emnapiTSFN.init();
		emnapiPluginCtx.emnapiTSFN = emnapiTSFN;
		/**
		* @__deps _emnapi_node_emit_async_init
		* @__deps _emnapi_runtime_keepalive_push
		* @__sig ippppppppppp
		*/
		function napi_create_threadsafe_function(env, func, async_resource, async_resource_name, max_queue_size, initial_thread_count, thread_finalize_data, thread_finalize_cb, context, call_js_cb, result) {
			if (!env) return 1;
			const envObject = emnapi_shared.emnapiEnv;
			envObject.checkGCAccess();
			if (!async_resource_name) return envObject.setLastError(1);
			max_queue_size >>>= 0;
			initial_thread_count >>>= 0;
			env >>>= 0;
			thread_finalize_data >>>= 0;
			thread_finalize_cb >>>= 0;
			context >>>= 0;
			call_js_cb >>>= 0;
			max_queue_size = max_queue_size >>> 0;
			initial_thread_count = initial_thread_count >>> 0;
			if (initial_thread_count === 0) return envObject.setLastError(1);
			if (!result) return envObject.setLastError(1);
			let ref = 0;
			func >>>= 0;
			if (!func) {
				if (!call_js_cb) return envObject.setLastError(1);
			} else {
				if (typeof emnapiCtx.jsValueFromNapiValue(func) !== "function") return envObject.setLastError(1);
				ref = emnapiCtx.createReference(envObject, func, 1, 1).id;
			}
			let asyncResourceObject;
			if (async_resource) {
				asyncResourceObject = emnapiCtx.jsValueFromNapiValue(async_resource);
				if (asyncResourceObject == null) return envObject.setLastError(2);
				asyncResourceObject = Object(asyncResourceObject);
			} else asyncResourceObject = {};
			const resource = emnapiCtx.napiValueFromJsValue(asyncResourceObject);
			let asyncResourceName = emnapiCtx.jsValueFromNapiValue(async_resource_name);
			if (typeof asyncResourceName === "symbol") return envObject.setLastError(3);
			asyncResourceName = String(asyncResourceName);
			const resource_name = emnapiCtx.napiValueFromJsValue(asyncResourceName);
			const sizeofTSFN = emnapiTSFN.offset.__size__;
			let tsfn = emscripten_runtime._malloc(sizeofTSFN);
			if (!tsfn) return envObject.setLastError(9);
			tsfn >>>= 0;
			new Uint8Array(emnapiTSFN.ensureBufferFor(tsfn + sizeofTSFN)).subarray(tsfn, tsfn + sizeofTSFN).fill(0);
			const resourceRef = emnapiCtx.createReference(envObject, resource, 1, 1);
			const resource_ = resourceRef.id;
			var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.resource, resource_, true);
			if (!emnapiTSFN.initQueue(tsfn)) {
				emscripten_runtime._free(tsfn);
				resourceRef.dispose();
				return envObject.setLastError(9);
			}
			__emnapi_node_emit_async_init(resource, resource_name, -1, tsfn + emnapiTSFN.offset.async_id);
			GET_HEAP_DATA_VIEW().setInt8(tsfn + emnapiTSFN.offset.is_some, 1, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.thread_count, initial_thread_count, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.context, context, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.max_queue_size, max_queue_size, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.ref, ref, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.env, env, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.finalize_data, thread_finalize_data, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.finalize_cb, thread_finalize_cb, true);
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.call_js_cb, call_js_cb, true);
			emnapiCtx.addCleanupHook(envObject, emnapiTSFN.cleanup, tsfn);
			emnapiTSFN._liveSet.add(tsfn);
			envObject.ref();
			__emnapi_runtime_keepalive_push();
			emnapiCtx.increaseWaitingRequestCounter();
			GET_HEAP_DATA_VIEW().setUint32(tsfn + emnapiTSFN.offset.async_ref, 1, true);
			result >>>= 0;
			GET_HEAP_DATA_VIEW().setUint32(result, tsfn, true);
			return envObject.clearLastError();
		}
		/** @__sig ipp */
		function napi_get_threadsafe_function_context(func, result) {
			if (!func || !result) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			result >>>= 0;
			const context = emnapiTSFN.getContext(func);
			var HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer), GET_HEAP_DATA_VIEW = () => HEAP_DATA_VIEW.buffer === emnapiPluginCtx.wasmMemory.buffer ? HEAP_DATA_VIEW : HEAP_DATA_VIEW = new DataView(emnapiPluginCtx.wasmMemory.buffer);
			GET_HEAP_DATA_VIEW().setUint32(result, context, true);
			return 0;
		}
		/** @__sig ippi */
		function napi_call_threadsafe_function(func, data, mode) {
			if (!func) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			data >>>= 0;
			return emnapiTSFN.push(func, data, mode);
		}
		/** @__sig ip */
		function napi_acquire_threadsafe_function(func) {
			if (!func) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			return emnapiTSFN.getMutex(func).execute(() => {
				if (emnapiTSFN.getState(func) === 0) {
					emnapiTSFN.addThreadCount(func);
					return 0;
				}
				return 16;
			});
		}
		/** @__sig ipi */
		function napi_release_threadsafe_function(func, mode) {
			if (!func) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			const mutex = emnapiTSFN.getMutex(func);
			const cond = emnapiTSFN.getCond(func);
			let shouldDelete = false;
			const ret = mutex.execute(() => {
				if (emnapiTSFN.getThreadCount(func) === 0) return 1;
				emnapiTSFN.subThreadCount(func);
				if (emnapiTSFN.getThreadCount(func) === 0 || mode === 1) {
					if (emnapiTSFN.getState(func) === 0) {
						if (mode === 1) emnapiTSFN.setState(func, 1);
						if (emnapiTSFN.getState(func) === 1 && emnapiTSFN.getMaxQueueSize(func) > 0) cond.signal();
						emnapiTSFN.send(func);
					}
				}
				if (!(emnapiTSFN.getState(func) === 2 && emnapiTSFN.getThreadCount(func) === 0)) return 0;
				shouldDelete = true;
				return 0;
			});
			if (shouldDelete) emnapiTSFN.destroy(func);
			return ret;
		}
		/**
		* @__deps _emnapi_runtime_keepalive_pop
		* @__sig ipp
		*/
		function napi_unref_threadsafe_function(env, func) {
			if (!func) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			const asyncRefAddress = func + emnapiTSFN.offset.async_ref;
			const asyncRefOffset = asyncRefAddress >>> 2;
			const arr = new Uint32Array(emnapiTSFN.ensureBufferFor(asyncRefAddress + 4));
			const currentValue = Atomics.load(arr, asyncRefOffset);
			if (currentValue > 0) {
				Atomics.store(arr, asyncRefOffset, currentValue - 1);
				if (currentValue === 1) {
					__emnapi_runtime_keepalive_pop();
					emnapiCtx.decreaseWaitingRequestCounter();
				}
			}
			return 0;
		}
		/**
		* @__deps _emnapi_runtime_keepalive_push
		* @__sig ipp
		*/
		function napi_ref_threadsafe_function(env, func) {
			if (!func) {
				emscripten_runtime.abort();
				return 1;
			}
			func >>>= 0;
			const asyncRefAddress = func + emnapiTSFN.offset.async_ref;
			const asyncRefOffset = asyncRefAddress >>> 2;
			const arr = new Uint32Array(emnapiTSFN.ensureBufferFor(asyncRefAddress + 4));
			const currentValue = Atomics.load(arr, asyncRefOffset);
			if (!currentValue) {
				__emnapi_runtime_keepalive_push();
				emnapiCtx.increaseWaitingRequestCounter();
			}
			Atomics.store(arr, asyncRefOffset, currentValue + 1);
			return 0;
		}
		exports.napi_acquire_threadsafe_function = napi_acquire_threadsafe_function;
		exports.napi_call_threadsafe_function = napi_call_threadsafe_function;
		exports.napi_create_threadsafe_function = napi_create_threadsafe_function;
		exports.napi_get_threadsafe_function_context = napi_get_threadsafe_function_context;
		exports.napi_ref_threadsafe_function = napi_ref_threadsafe_function;
		exports.napi_release_threadsafe_function = napi_release_threadsafe_function;
		exports.napi_unref_threadsafe_function = napi_unref_threadsafe_function;
		return exports;
	})({}, emnapiPluginCtx, emnapiPluginCtx);
	return { importObject: (original) => {
		Object.assign(original.napi, mod);
	} };
}
//#endregion
exports.emnapiAsyncWorkPlugin = asyncWork;
exports.emnapiTSFNPlugin = threadsafeFunction;
