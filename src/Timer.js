class Timer {
	static start() {
		Timer.t0 = Date.now();
	}

	static stop() {
		var t1 = Date.now();
		var td = t1 - Timer.t0;
		Timer.t0 = t1;
		return td;
	}
}

Timer.t0 = 0;

exports = module.exports = Timer;
