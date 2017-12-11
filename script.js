function roundRect(x, y, width, height, radius, fill) {
	if (typeof radius === "undefined")
		radius = 5;
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (!fill) {
		ctx.fill();
	}
	else {
		ctx.stroke();
	}
};

var Ease = {
	easeInQuint: function(t, b, c, d) {
	  return c*(t /= d)*t*t*t*t + b;
	},
	easeInOutQuart: function(t, b, c, d) {
	  if ((t /= d/2) < 1) return c/2*t*t*t*t + b;
	  return -c/2 * ((t-=2)*t*t*t - 2) + b;
	}
};

function Color(r, g, b, a) {
	this.r = r || 0;
	this.g = g || 0;
	this.b = b || 0;
	this.a = a || 1;
	this.c = 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')';

	this.dark = function(percent) {
		var r = ~~Math.max(0, Math.min(255, this.r * percent));
		var g = ~~Math.max(0, Math.min(255, this.g * percent));
		var b = ~~Math.max(0, Math.min(255, this.b * percent));
		return 'rgba(' + r + ',' + g + ',' + b + ', 1)';
	}
}

function collide(o1, o2) {
	return o1.x < o2.x + o2.w &&
		   o1.x + o1.w > o2.x &&
		   o1.y < o2.y + o2.h &&
		   o1.y + o1.h > o2.y;
}

function indexCollide(o1, o2) {
	return o1.x == o2.x &&
		   o1.y == o2.y;
}

function Block(opts) {
	this.x = opts.x || 0;
	this.y = opts.y || 0;
	this.w = opts.w || 0;
	this.h = opts.h || 0;
	this.offsetX = opts.offsetX || 0;
	this.offsetY = opts.offsetY || 0;
	this.hidden = opts.hidden || false;
	this.timer = opts.timer || 0;
	this.maxTime = opts.maxTime || 10;
	this.ready = false;
	var shadow = this.h * 0.4;
	var color = new Color(241, 241, 241); //157, 202, 106

	var offY = H + this.offsetY;

	this.show = function() {
		this.timer += 0.5;
		if (this.timer < this.maxTime) return;

		if (Math.abs(this.offsetY - offY) != 0 && Math.abs(this.offsetY - offY) > 0.25) {
			var vx = (this.offsetY - offY) * 0.07;
			offY += vx;
		} else {
			offY = this.offsetY;
			this.timer = opts.timer;
			this.ready = true;
			this.offsetY -= H;
		}
	};

	// function(t, b, c, d)

	this.hide = function() {
		this.timer += 0.5;
		if (this.timer < this.maxTime) return;

		// if (Math.abs(this.offsetY - offY) != 0 && Math.abs(this.offsetY - offY) > 0.1) {
		// 	var dx = this.offsetY - offY < 0 ? -1 : 1;
		// 	var vx = (dd - Math.abs(this.offsetY - offY)) * 0.03;
		// 	offY += dx * vx;
		// } else {
		// 	offY = this.offsetY;
		// }

		offY = Ease.easeInOutQuart(Timer, offY, this.offsetY, 1500);

		if (Math.abs(this.offsetY - offY) < 0.25) {
			this.ready = false;
		}
	};

	this.update = function() {
		if (blocksState.state == 'show' && !this.ready) {
			this.show();
		}
		else if (blocksState.state == 'hide') {
			this.hide();
		}
	};

	this.render = function() {
		if (this.hidden) return;
		ctx.fillStyle = color.dark(0.7);
		roundRect(this.offsetX + this.x, offY + this.y + this.h - 5, this.w, shadow, 5);
		ctx.fillStyle = color.c;
		roundRect(this.offsetX + this.x, offY + this.y, this.w, this.h, 5);
	};
}

function Entity(opts) {
	this.x = opts.x || 0;
	this.y = opts.y || 0;
	this.w = opts.w || 0;
	this.h = opts.h || 0;
	this.offsetX = opts.offsetX || 0;
	this.offsetY = opts.offsetY || 0;
	this.type = opts.type = "entity";
	var shadow = this.h * 0.7;
	var color = new Color(122, 189, 154); // 106, 193, 201

	this.init = opts.init;

	if (typeof this.init == 'function') this.init();

	this.update = opts.update || function() {

	};

	this.render = function() {
		ctx.fillStyle = color.dark(0.7);
		let b = blocks[this.y][this.x];
		roundRect(b.x + this.offsetX, b.y + this.h - 5 + this.offsetY, this.w, shadow, 5);
		ctx.fillStyle = color.c;
		roundRect(b.x + this.offsetX, b.y + this.offsetY, this.w, this.h, 5);
	};
}

/* Variables on map */

var blocks = [];
var blocksState = {
	state: "show",
	ready: false
};
var player = null;
var Timer = 0;

function generateBoard() {
	blocks = [];
	blocksState.state = "show";
	var cellW = 70,
		cellH = 40
		cols = 7,
		rows = 5;

	var offsetX = (W - cols * (cellW + 2)) / 2,
		offsetY = (H - rows * (cellH + 2)) / 2;

	var hidden = {
		x: ~~(Math.random() * cols),
		y: ~~(Math.random() * rows)
	}

	for (let i = 0; i < rows; i++) {
		blocks[i] = [];
		for (let j = 0; j < cols; j++) {
			let hide = hidden.x == j && hidden.y == i ? true : false;
			blocks[i].push(new Block({
				x: j * (cellW + 2),
				y: i * (cellH + 2),
				offsetX: offsetX,
				offsetY: offsetY,
				w: cellW,
				h: cellH,
				hidden: hide,
				timer: (-(rows + i) - j) * 4
			}));
		}
	}

	// for (let i = 0; i < blocks.length; i++) {
	// 	for (let j = 0; j < blocks[i].length; j++) {
	// 		let b  = blocks[i][j];
	// 		console.log(b.timer);
	// 	}
	// }

	var entityW = 40,
		entityH = 30;

	player = new Entity({
		x: 0,
		y: 0,
		offsetX: offsetX + (cellW - entityW) / 2,
		offsetY: offsetY - entityH / 2,
		w: entityW,
		h: entityH,
		init: function() {
			this.pressed = false;
		},
		update: function() {
			let x = this.x,
				y = this.y;
			if (keys[key.LEFT] && !this.pressed) {
				x--;
				this.pressed = true;
			} else if (keys[key.RIGHT] && !this.pressed) {
				x++;
				this.pressed = true;
			} else if (keys[key.UP] && !this.pressed) {
				y--;
				this.pressed = true;
			} else if (keys[key.DOWN] && !this.pressed) {
				y++;
				this.pressed = true;
			}

			this.x = Math.max(0, Math.min(x, cols - 1));
			this.y = Math.max(0, Math.min(y, rows - 1));

			if (!keys[key.LEFT] && !keys[key.RIGHT] && !keys[key.UP] && !keys[key.DOWN]) {
				this.pressed = false;
			}
		}
	});
}

/* Variables global */
var keys = [];
var key = {
	RIGHT: 39,
	LEFT: 37,
	UP: 38,
	DOWN: 40
};
// RIGHT 39
// LEFT  37
// UP    38
// DOWN  40

function init() {
	window.canvas = document.createElement('canvas');
	window.W = canvas.width = 800;
	window.H = canvas.height = 480;
	window.ctx = canvas.getContext('2d');
	document.body.appendChild(canvas);

	window.addEventListener('keydown', function(e) {
		keys[e.keyCode] = true;
	});

	window.addEventListener('keyup', function(e) {
		keys[e.keyCode] = false;
	});

	generateBoard();

	(function() {
		loop();
	})();
}

function loop() {
	Timer++;
	update();
	render();

	window.requestAnimationFrame(loop);
}

function update() {
	for (let i = 0; i < blocks.length; i++) {
		for (let j = 0; j < blocks[i].length; j++) {
			let b  = blocks[i][j];
			b.update();
		}
	}

	if (!blocksState.ready) {
		let b = blocks[blocks.length - 1][blocks[0].length - 1];
		blocksState.ready = b.ready;
		if (blocksState.ready && blocksState.state == 'show') {
			blocksState.state = "hide";
			console.log(blocksState.state);
		}
		return;
	}

	if (blocksState.state == 'hide') {
		let b = blocks[blocks.length - 1][blocks[0].length - 1];
		blocksState.ready = b.ready;
		if (!blocksState.ready)
			generateBoard();
	}

	player.update();
}

function render() {
	ctx.fillStyle = "#362c42";
	ctx.fillRect(0, 0, W, H);

	for (let i = 0; i < blocks.length; i++) {
		for (let j = 0; j < blocks[i].length; j++) {
			let b  = blocks[i][j];
			b.render();
		}
	}

	// player.render();
}

window.onload = init;