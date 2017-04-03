(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.sx_L = factory());
}(this, (function () { 'use strict';

const STATUS_ADDED = "0";
const STATUS_RUNNING = "1";
const STATUS_ABORTING = "2";
const STATUS_ABORTED = "3";
const STATUS_FINISH = "4";
const OPERATION_ADD = "5";
const OPERATION_REMOVE = "6";
function SmartQueue() {
	this.iterator = 0;
	this.queue = [];
	this.updating = false;
	this.isLog = true;
}
SmartQueue.prototype._iteratorNext = function() {
	return this.iterator++;
};
function getHumanStatus(status) {
	var mes;
	switch (status) {
		case STATUS_ADDED:
			mes = "Status adding";
			break;
		case STATUS_RUNNING:
			mes = "Status running";
			break;
		case STATUS_ABORTING:
			mes = "Status aborting";
			break;
		case STATUS_ABORTED:
			mes = "Status aborted";
			break;
		case STATUS_FINISH:
			mes = "Status finish";
			break;
		case OPERATION_ADD:
			mes = "Operation add";
			break;
		case OPERATION_REMOVE:
			mes = "Operation remove";
			break;
	}
	return mes;
}
SmartQueue.prototype.log = function() {
	var args = ["[SmartQueue] "];
	for (var i = 0; i < arguments.length; i++) {
		args.push(arguments[i]);
	}
	if (this.isLog) {
		console.log.apply(this, args);
	}
};
SmartQueue.prototype._changeStatus = function(obj, STATUS, dontUpdate) {
	this.log("Change status queue - id: " + obj.id + " Desc: " + obj.desc + " Status: " + getHumanStatus(STATUS));
	obj.status = STATUS;
	if (!dontUpdate)
		this._update();
};
SmartQueue.prototype._changeQueue = function(options) {
	var operation = options && options.operation,
		obj = options && options.obj,
		id = options && options.id,
		index = options && options.index,
		dontUpdate = options && options.dontUpdate;
	switch (operation) {
		case OPERATION_ADD:
			this._changeStatus(obj, STATUS_ADDED, true);
			this.queue.push(obj);
			break;
		case OPERATION_REMOVE:
			this.queue.splice(index, 1);
			break;
	}
	if (!dontUpdate)
		this._update();
};
SmartQueue.prototype.getIterator = function() {
	return this.iterator;
};
SmartQueue.prototype.add = function(options) {
	var self = this,
		obj = {},
		fn = options && options.fn || (function() {}),
		resolve = options && options.resolve || (function() {}),
		desc = options && options.desc;
	obj.id = self._iteratorNext();
	obj.abort = null;
	obj.resolve = resolve;
	obj.desc = desc;
	obj.fn = function(opt) {
		return Promise.resolve().then(function() {
			self._changeStatus(obj, STATUS_RUNNING, true);
			return fn();
		}).then(function(res) {
			obj.resolve(res);
			return opt;
		});
	};
	self._changeQueue({
		operation: OPERATION_ADD,
		obj: obj
	});
	return obj.id;
};
SmartQueue.prototype._is = function(obj, status) {
	return (obj.status === status);
};
SmartQueue.prototype._isAdded = function(obj) {
	return this._is(obj, STATUS_ADDED);
};
SmartQueue.prototype.getChain = function(id) {
	for (var i = 0; i < this.queue.length; i++) {
		if (this.queue[i].id == id)
			return {
				obj: this.queue[i],
				index: i
			};
	}
};
SmartQueue.prototype._update = function() {
	var self = this,
		isRunChain = false;
	this.log("Queue start update ", this.updating);
	if (!this.updating) {
		this.updating = true;
		for (var i = 0; i < this.queue.length; i++) {
			if (this._isAdded(this.queue[i])) {
				isRunChain = true;
				this.queue[i].fn({id: this.queue[i].id}).then(function(opt) {
					var chain = self.getChain(opt.id);
					self._changeStatus(chain.obj, STATUS_FINISH, true);
					self.updating = false;
					self._changeQueue({
						operation: OPERATION_REMOVE,
						index: chain.index
					});
				}).catch(function(err) {
					self.updating = false;
					console.error("[SmartQueue] ", err);
					throw err;
				});
				break;
			}
		}
		if (!isRunChain) {
			self.updating = false;
		}
	}
};
SmartQueue.prototype.deffer = function(fn, desc) {
	var self = this;
	return new Promise(function(resolve, reject) {
		self.add({
			fn: fn,
			resolve: resolve,
			desc: desc
		});
	});
};

return SmartQueue;

})));
