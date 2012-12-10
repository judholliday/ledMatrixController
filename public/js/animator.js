(function(){

	var numRows;
	var numColumns;
	var rows = [];
	var savedData = [];
	var frameIndex = 0;
	var playbackToken;

	var socket;


	initMatrix(8,8);

	function initMatrix(rows, columns){

		var isMouseDown = false;

		numRows = rows || 8;
		numColumns = columns || 8;

		var size = numRows * numColumns;
		var str = "";
		for (var i=0; i<size; i++){
			str += "<li><div class='led'></div></li>";
		}
		$("#matrix").append(str);


		$("body").mousedown(function(e){
		    isMouseDown = true;
		}).mouseup(function(e){
		    isMouseDown = false;
		});

		//prevent dragging from selecting page elements
		$("#matrix").mousedown(function(e){
		    e.preventDefault();
		}).mouseup(function(e){
		    e.preventDefault();
		});


		$("#matrix>li").on('mouseenter', function(e){

			if (isMouseDown) {
				$(this).find("div").toggleClass('on');
			}
		});

		$("#matrix>li").on('mousedown', function(){
			$(this).find("div").toggleClass('on');
		});

		$("#save").on("click", saveFrame);
		$("#clear").on("click", clearDisplay);
		$("#play").on("click", startPlayback);
		$("#pause").on("click", pausePlayback);
		$("#clearAllFrames").on("click", clearSavedData);
		$("#tempo").on("change", updateSpeed);

		socket = io.connect('http://localhost:8124');
		socket.on('init', socketDataHandler);
		socket.on('msg',socketDataHandler);
	}

	

	function socketDataHandler(data){
		$("#outputVal").val(data.msg);
	}

	function saveFrame(e){
		saveDisplayAsBytes();
	}

	function clearDisplay(){
		$("li>div.on").each(function(index, el){
			$(el).removeClass("on");
		});
	}

	function saveDisplayAsBytes(){

		var data = [];
		var val = 0;
		$(".led").each(function(index, el){

			var rowNum = Math.floor(index/numRows);
			var colNum = index%numRows;
			
			if ($(el).hasClass("on")){
				
				// val |= 1 << ((numColumns-1) - colNum); //reverse order of bits
				val |= 1 << colNum;

			}
			if (colNum === numColumns-1){
				data.push(val);
				val = 0;
			}

		});

		console.log("data", data);
		savedData.push(data);
		displayBits(data);
		console.log("savedData", savedData);
	}

	function displayBits(dataArr){
		var output = "";
		for (var i = 0; i < dataArr.length; i++) {
			var byteStr = dataArr[i].toString(2) + "\n";
			while(byteStr.length <= 8) {
				byteStr = "0" + byteStr;
			}
			output += byteStr;
		};
		console.log(output);
		// $("#outputVal").val(output);
	}

	function startPlayback(){
		if (savedData.length > 0) {
			playbackToken = setInterval(sendToDisplay, $('#tempo').val());
		} else {
			alert("There are currently no frames to display.");
		}
		
	}

	function pausePlayback(){
		clearInterval(playbackToken);
	}

	function updateSpeed(e){
		// console.log( $(this).val() );
		pausePlayback();
		startPlayback();
	}

	function sendToDisplay(){
		socket.emit('message', { msg: savedData[frameIndex] });
		displayBits(savedData[frameIndex]);

		frameIndex++;
		if (frameIndex === savedData.length){
			frameIndex = 0;
		}

	}

	function clearSavedData(){

		var doClear = confirm("Are you sure you want to remove all frames?");
		if (doClear) {
			pausePlayback();
			savedData = [];
			frameIndex = 0;
		}
		
	}

	// function render(){

	// }

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

})();