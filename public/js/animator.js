(function(){

	var numRows;
	var numColumns;
	var rows = [];
	var savedData = [];
	var savedText = [];
	var compactedText = [];
	var frameIndex = 0;
	var textIndex = 0;
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
		
		$("#clearAllFrames").on("click", clearSavedData);

		$("#scrollTextInput").on("keyup", printBytes);
		$("#saveText").on("click", function(){ saveText(); });

		$("#play").on("click", startPlayback);
		$("#playText").on("click", startTextPlayback);
		$("#pause").on("click", pausePlayback);
		$("#tempo").on("change", updateSpeed);


		socket = io.connect('http://localhost:8124');
		socket.on('init', socketDataHandler);
		socket.on('msg',socketDataHandler);
	}

	function printBytes(e){
		var str = $(this).val();
		if (str.length > 0){
			var charCode = str.charCodeAt(str.length-1);
			var fontChar = cp437_font[charCode];
			console.log(str.charAt(str.length-1), charCode, fontChar);
			$("#outputVal").val(str);
		}

	}

	function saveText(){
		savedText = [];

		var str = $("#scrollTextInput").val();
		var charCode;
		for (var i=0; i<str.length; i++){
			charCode = str.charCodeAt(i);
			savedText = savedText.concat(cp437_font[charCode]);
		}
		console.log("savedText: ", savedText);
		compactText();
	}

	function compactText(){

		compactedText = [];
		for (var i=0; i<savedText.length; i++){
			if (savedText[i] !== 0){
				compactedText.push(savedText[i]);
			} else {
				var blankCount = 0;
				var index = i;
				while (savedText[index] === 0){
					blankCount++;
					index++;
				}

				if (blankCount < 8){
					//reduce a few blank columns to a single blank column
					compactedText.push(0);
				} else {
					//convert a space to 3 blank columns
					compactedText = compactedText.concat([0,0,0]);
				}
				//jump forward in loop
				i += blankCount; 
			}
		}
		console.log("compactedText: ", compactedText);
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

		//clear the matrix
		$("#matrix>li").find("div").removeClass("on");


		var displayData = [];
		for (var i = 0; i < dataArr.length; i++) {
			var revByte = reverseBitOrder(dataArr[i]);
			var index, bitMask, isOn, ledIndex;
			
			for (bitMask = 128, index = 0; bitMask > 0; bitMask >>= 1, index++) {
				isOn = ( bitMask & revByte ) ? 1 : 0 ;
				if (isOn){
					ledIndex = (i*8) + index;
					var el = $("#matrix>li").get(ledIndex);
					$(el).find("div").addClass("on");
				} 
			}
			
		}

	}

	function reverseBitOrder(byteIn){

		// console.log("in: ", byteIn.toString(2));

		var result = 0,
			counter = 8;
	    while (counter-- > 0)
	    {
	        result <<= 1;
	        result |= (byteIn & 1);
	        byteIn = (byteIn >> 1);
	    }
	    
	    // console.log("out: ", result.toString(2));

	    return result;

	}


	function startPlayback(){
		pausePlayback();

		if (savedData.length > 0) {
			playbackToken = setInterval(sendFramesToDisplay, $('#tempo').val());
		} else {
			alert("There are currently no frames to display.");
		}
		
	}

	function startTextPlayback(){
		pausePlayback();

		if (compactedText.length > 0) {
			playbackToken = setInterval(sendTextToDisplay, $('#tempo').val());
		} else {
			alert("There is currently no text to display.");
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

	function sendFramesToDisplay(){
		socket.emit('message', { msg: savedData[frameIndex] });
		displayBits(savedData[frameIndex]);

		frameIndex++;
		if (frameIndex === savedData.length){
			frameIndex = 0;
		}

		displayBits(savedData[frameIndex]);
	}

	function sendTextToDisplay(){

		var out = [];
		var index = textIndex;
		for (var i=0; i<8; i++){
			out.push(compactedText[index]);
			index++;
			if (index === compactedText.length){
				index = 0;
			}
		}

		socket.emit('message', { msg: out});
		displayBits(out);

		textIndex++;
		if (textIndex === compactedText.length){
			textIndex = 0;
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

	function renderOnScreen(dataArr){

	}

	// /* bitwise helper methods */
	// function bitOn(r,c) {
	// 	rows[r] |= (1 << c);
	// }

	// function bitOff(r,c) {
	// 	rows[r] &= ~(1 << c);
	// }

	// function bitToggle(r,c) {
	// 	rows[r] ^= (1 << c);
	// }

})();