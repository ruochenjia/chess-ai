import { game, evaluateBoard } from "./gamebase.js";

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
	onMoveEnd,
	onMouseoverSquare,
	onMouseoutSquare,
	onSnapEnd
});
const STACK_SIZE = 100;
const stockfish = await Stockfish();

let globalSum = 0;
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
$("#board").on("touchmove touchend touchstart", (e) => {
	// prevent scroll while dragging pieces
	e.preventDefault();
});
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
	checkStatus(color == "b" ? "black" : "white");
	highlightMove(move, color);
}

function highlightMove(move, color) {
	console.log(move);
	if (color == "b") {
		$("#board").find(".square-55d63").removeClass("highlight-black");
	  	$("#board").find(".square-" + move.from).addClass("highlight-black");
		$("#board").find(".square-" + move.to).addClass("highlight-black");
	} else {
		$("#board").find(".square-55d63").removeClass("highlight-white");
	  	$("#board").find(".square-" + move.from).addClass("highlight-white");
		$("#board").find(".square-" + move.to).addClass("highlight-white");
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
	highlightMove(move, playerColor);

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

function onMoveEnd() {
}

function removeGreySquares() {
	$("#board .square-55d63").removeClass("highlight-moveable")
}
  
function greySquare(square) {
	$("#board .square-" + square).addClass("highlight-moveable");
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

})();

export {};
