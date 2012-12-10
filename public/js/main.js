(function() {

	var rows = [];
	var grid = [];
	var count = 0;
	var tempo = 100;
	var tempoControl;
	var pauseControl;
	var outputText;
	var renderTimer;
	var rowIndex = 0;
	var colIndex = 0;

	init();

	function init() {

		var el = document.getElementById("matrix");
		// var li = document.createElement("li");
		for (var i=0; i<64; i++){
			var li = document.createElement("li");
			el.appendChild(li);
		}

		// init bit array
		resetRows();

		// init element vars
		grid = document.getElementsByTagName('li');
		tempoControl = document.getElementById('tempo');
		pauseControl = document.getElementById('pause');
		outputText = document.getElementById('output');

		// handle tempo changes
		tempoControl.addEventListener("input", tempoChange, false);
		pauseControl.addEventListener("click", pauseTimer, false);
		tempoChange();
	}

	function loop() {
		// swap out render method below for different effects
		// randomToggle();
		runUp();

		
		render();
		emitValue(rows);
		// outputBits();
	}


	/* renders values from rows to screen */
	function render() {
		// console.log("");
		// console.log("rows: ", rows);
		for (var i=0; i<rows.length; i++){
			var tmp = rows[i].toString(2).split("");
			// console.log("tmp", tmp);

			for (var j=0; j<8; j++){
				var id = (i*8) + j;
				

				if(rows[i] & (1 << j)) {
					addClass(grid[id],'on');
				}
				else {
					removeClass(grid[id],'on');
				}

			}
		}	
	}

	/* render methods */
	function randomToggle() {
		bitToggle(randomInt(7),randomInt(7));
	}

	function countUp(i) {
		rows[i]++;
		if(rows[i]>=256) {
			rows[i] = 0;
			if(i < rows.length)
				countUp(i+1);
		}
	}

	function runUp() {
		bitToggle(rowIndex, colIndex);
		rowIndex++;
		if (rowIndex == 8){
			rowIndex = 0;
			colIndex++;
		}
		if (colIndex == 8){
			colIndex = 0;
		}
	}


	/* bitwise helper methods */
	function bitOn(r,c) {
		rows[r] |= (1 << c);
	}

	function bitOff(r,c) {
		rows[r] &= ~(1 << c);
	}

	function bitToggle(r,c) {
		rows[r] ^= (1 << c);
	}

	/* css utility methods */
	function hasClass(el, cls) {
	    return el.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
	}

	function addClass(el, cls) {
	    if (!hasClass(el, cls)) el.className += " " + cls;
	}

	function removeClass(el, cls) {
	    if (hasClass(el, cls)) {
	        var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
	        el.className = el.className.replace(reg, ' ');
	    }
	}

	function toggleClass(el, cls) {
	    if(hasClass(el, cls))
	        removeClass(el, cls);
	    else
	        addClass(el, cls);
	}

	/* misc functions */
	function resetRows() {
		rows = [0,0,0,0,0,0,0,0];
	}

	function tempoChange(e) {
		resetRows();
		render();
		clearInterval(renderTimer);
		tempo = tempoControl.value;
		renderTimer = setInterval(loop, tempo);
	}

	function pauseTimer(e) {
		console.log(renderTimer);
		if(renderTimer) {
			clearInterval(renderTimer);
			renderTimer = undefined;
		}
		else {
			renderTimer = setInterval(loop, tempo);
		}
	}

	function outputBits() {


		// var str = "";
		// outputText.value = "";

		// // console.log("rows length", rows.length);
		// for(var i = 0; i < rows.length; i++){
		// 	console.log("val: " + rows[i]);

		// 	str += String.fromCharCode(rows[i]);

		// 	// var b = rows[i].toString(2) + "\n";
		// 	// while(b.length <= 8) {
		// 	// 	b = "0" + b;
		// 	// }
		// 	// outputText.value += b;
			
		// }
		// console.log("string: '" + str + "'", str.length);
		
	}


	function randomInt(max) {
		return Math.round(Math.random() * max); 
	}

	var socket = io.connect('http://localhost:8124');

	socket.on('init', function (data) {
		var html = '<p>' + data.msg + '</p>';
		document.getElementById("output").innerHTML=html;
	});

	socket.on('msg', function (data) {
		var html = '<p>' + data.msg + '</p>';
		document.getElementById("output").innerHTML = html;

	});

	function emitValue(val){
		socket.emit('message', { msg: val });
	}


})();

