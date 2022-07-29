import { Chess } from "./chess.js";

(async () => {
// default error handler
window.onerror = (msg, src, lineno, colno, e) => {
	alert(msg, "Error");
};

const board = Chessboard("board", {
	draggable: true,
	position: "start",
	onDragStart,
	onDrop,
	onMouseoverSquare,
	onMouseoutSquare,
	onSnapEnd
});
const game = new Chess();
const whiteSquareGrey = "#a9a9a9";
const blackSquareGrey = "#696969";
const STACK_SIZE = 100;
const stockfish = await Stockfish();


/*
 * Piece Square Tables, adapted from Sunfish.py:
 * https://github.com/thomasahle/sunfish/blob/master/sunfish.py
 */
const weights = {
	p: 100,
	n: 280,
	b: 320,
	r: 479,
	q: 929,
	k: 60000,
	k_e: 60000
};
const pst_w = {
	p: [
		[100, 100, 100, 100, 105, 100, 100, 100],
		[78, 83, 86, 73, 102, 82, 85, 90],
		[7, 29, 21, 44, 40, 31, 44, 7],
		[-17, 16, -2, 15, 14, 0, 15, -13],
		[-26, 3, 10, 9, 6, 1, 0, -23],
		[-22, 9, 5, -11, -10, -2, 3, -19],
		[-31, 8, -7, -37, -36, -14, 3, -31],
		[0, 0, 0, 0, 0, 0, 0, 0]
	],
	n: [
		[-66, -53, -75, -75, -10, -55, -58, -70],
		[-3, -6, 100, -36, 4, 62, -4, -14],
		[10, 67, 1, 74, 73, 27, 62, -2],
		[24, 24, 45, 37, 33, 41, 25, 17],
		[-1, 5, 31, 21, 22, 35, 2, 0],
		[-18, 10, 13, 22, 18, 15, 11, -14],
		[-23, -15, 2, 0, 2, 0, -23, -20],
		[-74, -23, -26, -24, -19, -35, -22, -69]
	],
	b: [
		[-59, -78, -82, -76, -23, -107, -37, -50],
		[-11, 20, 35, -42, -39, 31, 2, -22],
		[-9, 39, -32, 41, 52, -10, 28, -14],
		[25, 17, 20, 34, 26, 25, 15, 10],
		[13, 10, 17, 23, 17, 16, 0, 7],
		[14, 25, 24, 15, 8, 25, 20, 15],
		[19, 20, 11, 6, 7, 6, 20, 16],
		[-7, 2, -15, -12, -14, -15, -10, -10]
	],
	r: [
		[35, 29, 33, 4, 37, 33, 56, 50],
		[55, 29, 56, 67, 55, 62, 34, 60],
		[19, 35, 28, 33, 45, 27, 25, 15],
		[0, 5, 16, 13, 18, -4, -9, -6],
		[-28, -35, -16, -21, -13, -29, -46, -30],
		[-42, -28, -42, -25, -25, -35, -26, -46],
		[-53, -38, -31, -26, -29, -43, -44, -53],
		[-30, -24, -18, 5, -2, -18, -31, -32]
	],
	q: [
		[6, 1, -8, -104, 69, 24, 88, 26],
		[14, 32, 60, -10, 20, 76, 57, 24],
		[-2, 43, 32, 60, 72, 63, 43, 2],
		[1, -16, 22, 17, 25, 20, -13, -6],
		[-14, -15, -2, -5, -1, -10, -20, -22],
		[-30, -6, -13, -11, -16, -11, -16, -27],
		[-36, -18, 0, -19, -15, -15, -21, -38],
		[-39, -30, -31, -13, -31, -36, -34, -42]
	],
	k: [
		[4, 54, 47, -99, -99, 60, 83, -62],
		[-32, 10, 55, 56, 56, 55, 10, 3],
		[-62, 12, -57, 44, -67, 28, 37, -31],
		[-55, 50, 11, -4, -19, 13, 0, -49],
		[-55, -43, -52, -28, -51, -47, -8, -50],
		[-47, -42, -43, -79, -64, -32, -29, -32],
		[-4, 3, -14, -50, -57, -18, 13, 4],
		[17, 30, -3, -14, 6, -1, 40, 18]
	],
	k_e: [
		[-50, -40, -30, -20, -20, -30, -40, -50],
		[-30, -20, -10, 0, 0, -10, -20, -30],
		[-30, -10, 20, 30, 30, 20, -10, -30],
		[-30, -10, 30, 40, 40, 30, -10, -30],
		[-30, -10, 30, 40, 40, 30, -10, -30],
		[-30, -10, 20, 30, 30, 20, -10, -30],
		[-30, -30, 0, 0, 0, 0, -30, -30],
		[-50, -30, -30, -30, -30, -30, -30, -50]
	]
};
const pst_b = {
	p: pst_w.p.slice().reverse(),
	n: pst_w.n.slice().reverse(),
	b: pst_w.b.slice().reverse(),
	r: pst_w.r.slice().reverse(),
	q: pst_w.q.slice().reverse(),
	k: pst_w.k.slice().reverse(),
	k_e: pst_w.k_e.slice().reverse(),
};
const pstOpponent = {
	w: pst_b,
	b: pst_w
};
const pstSelf = {
	w: pst_w,
	b: pst_b
};

let globalSum = 0;
let squareToHighlight;
let colorToHighlight;
let undoStack = [];
let playerColor = "w";

let reader = (() => {
	let messages = [];

	stockfish.addMessageListener((msg) => {
		// always log output messages for debugging
		console.log(msg);

		messages.push(msg);
	});

	function read() {
		if (messages.length > 0) {
			let msg = messages[0];
			messages.splice(0, 1);
			return msg;
		}
		return null;
	}

	function grep(text) {
		return new Promise((resolve) => {
			let to = () => {
				let msg = read();
				if (msg != null && msg.includes(text))
					resolve(msg);
				else setTimeout(to, 50);
			}
			to();
		});
	}

	function write(msg) {
		stockfish.postMessage(msg);
	}

	return {
		read,
		grep,
		write
	};
})();

// engine init
reader.read();
reader.write("uci");
reader.write("setoption name Threads value 4");
reader.write("setoption name Hash value 128");
reader.write("setoption name UCI_Elo value 2500");
await reader.grep("uciok");
reader.write("isready");
await reader.grep("readyok");
reader.write("ucinewgame");

// event listeners
$("#sicilianDefenseBtn").on("click", () => startPos("rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"));
$("#frenchDefenseBtn").on("click", () => startPos("rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"));
$("#ruyLopezBtn").on("click", () => startPos("r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1"));
$("#caroKannDefenseBtn").on("click", () => startPos("rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"));
$("#italianGameBtn").on("click", () => startPos("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1"));
$("#undoBtn").on("click", function () {
	if (game.history().length >= 2) {
		$("#board").find(".square-55d63").removeClass("highlight-white");
		$("#board").find(".square-55d63").removeClass("highlight-black");
		$("#board").find(".square-55d63").removeClass("highlight-hint");
		
		undo();
		undo();
	} else alert("Nothing to undo.");
});
$("#redoBtn").on("click", function () {
	if (undoStack.length >= 2) {
		redo();
		redo();
	} else alert("Nothing to redo.");
});
$("#chcolorBtn").on("click", () => {
	reset();
	if (playerColor == "w") {
		playerColor = "b";
		board.orientation("black");
		makeBestMove("w");
	} else {
		playerColor = "w";
		board.orientation("white");
	}
});
$("#resetBtn").on("click", () => {
	reset();
	if (playerColor != "w")
		makeBestMove("w");
});
$("#showHint").change(() => {
	showHint();
});

function reset() {
	game.reset();
	reader.write("ucinewgame");
	globalSum = 0;
	$("#board").find(".square-55d63").removeClass("highlight-white");
	$("#board").find(".square-55d63").removeClass("highlight-black");
	$("#board").find(".square-55d63").removeClass("highlight-hint");
	board.position(game.fen());
	$("#advantageColor").text("Neither side");
	$("#advantageNumber").text(globalSum);
}

function undo() {
	let move = game.undo();
	undoStack.push(move);
	if (undoStack.length > STACK_SIZE)
	  undoStack.shift();
	board.position(game.fen());
	showHint();
}

function redo() {
	game.move(undoStack.pop());
	board.position(game.fen());
	showHint();
}

function startPos(fen) {
	reset();
	game.load(fen);
	board.position(fen);
	let color = fen.split(" ")[1];
	if (color != playerColor)
		makeBestMove(color);
}

function evaluateBoard(move, prevSum, color) {
	if (game.in_checkmate()) {
	  	if (move.color === color)
			return 10 ** 10;
		else
			return -(10 ** 10);
	}
  
	if (game.in_draw() || game.in_threefold_repetition() || game.in_stalemate())
		return 0;
  
	if (game.in_check()) {
	  	if (move.color === color)
			prevSum += 50;
	  	else
			prevSum -= 50;
	}
  
	const from = [
		8 - parseInt(move.from[1]),
		move.from.charCodeAt(0) - "a".charCodeAt(0)
	];
	const to = [
		8 - parseInt(move.to[1]),
		move.to.charCodeAt(0) - "a".charCodeAt(0)
	];
  
	if (prevSum < -1500) {
	  	if (move.piece === "k") {
			move.piece = "k_e";
		}
	}
  
	if ("captured" in move) {
	  	if (move.color === color)
			prevSum += weights[move.captured] + pstOpponent[move.color][move.captured][to[0]][to[1]];
	  	else
			prevSum -= weights[move.captured] + pstSelf[move.color][move.captured][to[0]][to[1]];
	}
  
	if (move.flags.includes("p")) {
		move.promotion = "q";
		
		if (move.color === color) {
			prevSum -= weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
			prevSum += weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]];
	  	} else {
			prevSum += weights[move.piece] + pstSelf[move.color][move.piece][from[0]][from[1]];
			prevSum -= weights[move.promotion] + pstSelf[move.color][move.promotion][to[0]][to[1]];
	  	}
	} else {
	  	if (move.color !== color) {
			prevSum += pstSelf[move.color][move.piece][from[0]][from[1]];
			prevSum -= pstSelf[move.color][move.piece][to[0]][to[1]];
	  	} else {
			prevSum -= pstSelf[move.color][move.piece][from[0]][from[1]];
			prevSum += pstSelf[move.color][move.piece][to[0]][to[1]];
	  	}
	}

	return prevSum;
}

function updateAdvantage() {
	if (globalSum > 0) {
		$("#advantageColor").text("Black");
		$("#advantageNumber").text(globalSum);
	} else if (globalSum < 0) {
		$("#advantageColor").text("White");
		$("#advantageNumber").text(-globalSum);
	} else {
		$("#advantageColor").text("Neither side");
		$("#advantageNumber").text(globalSum);
	}
	$("#advantageBar").attr({
		"aria-valuenow": `${-globalSum}`,
		style: `width: ${((-globalSum + 2000) / 4000) * 100}%`
	});
}

function checkStatus(color) {
	if (game.in_checkmate())
		$("#status").html(`<b>Checkmate!</b> Oops, <b>${color}</b> lost.`);
	else if (game.insufficient_material())
		$("#status").html(`It's a <b>draw!</b> (Insufficient Material)`);
	else if (game.in_threefold_repetition())
		$("#status").html(`It's a <b>draw!</b> (Threefold Repetition)`);
	else if (game.in_stalemate())
		$("#status").html(`It's a <b>draw!</b> (Stalemate)`);
	else if (game.in_draw())
		$("#status").html(`It's a <b>draw!</b> (50-move Rule)`);
	else if (game.in_check()) {
		$("#status").html(`Oops, <b>${color}</b> is in <b>check!</b>`);
		return false;
	} else {
		$("#status").html(`No check, checkmate, or draw.`);
		return false;
	}
	return true;
}

async function getBestMove(color) {
	let fen = game.fen().split(" ");
	fen[1] = color;
	fen = fen.join(" ");
	reader.write("position fen " + fen);

	let time = $("#search-time :selected").val();
	let depth = $("#search-depth :selected").val();
	let cmd = "go movetime " + time + "000";
	if (depth != "u")
		cmd += " depth " + depth;

	reader.write(cmd);
	let move = (await reader.grep("bestmove")).split(" ")[1];

	return {
		from: move[0] + move[1],
		to: move[2] + move[3],
		promotion: "q"
	};
}

async function showHint() {
	$("#board").find(".square-55d63").removeClass('highlight-hint');

	if ($("#showHint").is(":checked")) {
		let move = await getBestMove(playerColor);
		$("#board").find('.square-' + move.from).addClass('highlight-hint');
		$("#board").find('.square-' + move.to).addClass('highlight-hint');
	}
}

async function makeBestMove(color) {
	let move = await getBestMove(color);
	move = game.move(move);
	if (move == null) {
		console.warn("Internel error");
		alert("An unexpected error occurred while moving for " + color);
		
		return;
	}

	board.position(game.fen());
	globalSum = evaluateBoard(move, globalSum, "b");
	updateAdvantage();
  
	if (color === "b") {
		checkStatus("black");
	  	$("#board").find(".square-55d63").removeClass("highlight-black");
	  	$("#board").find(".square-" + move.from).addClass("highlight-black");
		squareToHighlight = move.to;
		colorToHighlight = "black";
		$("#board").find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight);
	} else {
		checkStatus("white");
		$("#board").find(".square-55d63").removeClass("highlight-white");
	  	$("#board").find(".square-" + move.from).addClass("highlight-white");
	  	squareToHighlight = move.to;
	  	colorToHighlight = "white";
		$("#board").find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight);
	}
}

function onDrop(source, target) {
	undoStack = [];
	removeGreySquares();

	const move = game.move({
		from: source,
		to: target,
		promotion: "q"
	});

	if (move == null)
		return "snapback";
	
	globalSum = evaluateBoard(move, globalSum, "b");
	updateAdvantage();

	$("#board").find(".square-55d63").removeClass("highlight-white");
	$("#board").find(".square" + move.from).addClass("highlight-white");
	squareToHighlight = move.to;
	colorToHighlight = "white";
	$("#board").find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight);

	if (!checkStatus("black")) {
		makeBestMove(playerColor == "w" ? "b" : "w").then(() => {
			showHint();
		});
	}
}


/*
 * The remaining code is adapted from chessboard.js examples #5000 through #5005:
 * https://chessboardjs.com/examples#5000
 */

function onDragStart(source, piece, position, orientation) {
	if (game.game_over())
		return false;

	if (game.turn() != playerColor || piece[0] != playerColor)
		return false;

	return true;
}

function removeGreySquares() {
	$("#board .square-55d63").css("background", "");
}
  
function greySquare(square) {
	const sq = $("#board .square-" + square);
	const bg = sq.hasClass("black-3c85d") ? blackSquareGrey : whiteSquareGrey;
	sq.css("background", bg);
}

function onMouseoverSquare(square, piece) {
	if (game.game_over() || piece[0] != playerColor)
		return;

	const moves = game.moves({
		square,
		verbose: true
	});

	for (let i = 0; i < moves.length; i++) {
		greySquare(moves[i].to);
	}
}
  
function onMouseoutSquare(square, piece) {
	removeGreySquares();
}

function onSnapEnd() {
	board.position(game.fen());
}






// enable testing features for localhost
let host = new URL(window.location.href).hostname;
if (host === "localhost") {
	let b = Chessboard("free-board", {
		draggable: true,
		sparePieces: true,
		position: "start",
		dropOffBoard: "trash",
		onDrop: function() {
			$("#fen").html(b.fen());
		}
	});
} else {
	$("#cvc-block").remove();
}



})();

export {};
