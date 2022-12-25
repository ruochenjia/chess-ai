import { game, evaluateBoard } from "./gamebase.js";
import { io } from "./lib/socket.io.esm.min.js";
import { default as clientConfig } from "./config.js";
import UCIEngine from "./uci.js";

// default error handler
window.onerror = (message, src, lineno, colno, error) => {
	alert(`Error at "${src}", line ${lineno}:${colno}: \n${error}`, "Error");
};

const location = new URL(window.location.href);
const nsw = window.navigator.serviceWorker;

if (location.hostname != "localhost") {
	try {
		await nsw.register("/sw.js", {
			scope: "/",
			type: "classic",
			updateViaCache: "none"
		});
		await nsw.ready;
	} catch(err) {
		console.error(err);
	}
}

Array.prototype.remove = function(element) {
	for (let i = 0; i < this.length; i++) {
		if (this[i] == element)
			this.splice(i, 1);
	}
};

Array.prototype.last = function() {
	let len = this.length;
	if (len < 1)
		return null;
	return this[len - 1];
};

Object.clear = (obj) => {
	for (let k in obj)
		delete obj[k];
};

Object.merge = (a, b) => {
	for (let k in b)
		a[k] = b[k];
};

const engine = new UCIEngine();
const board = Chessboard("board", {
	draggable: true,
	position: "start",
	onDragStart,
	onDrop,
	onMouseoverSquare,
	onMouseoutSquare,
	onSnapEnd
});
const config = {};

// debug only
if (clientConfig.debug)
	window.game = game;

// engine init
await engine.init("stockfish");
engine.read();
engine.write("uci");
engine.write("setoption name Threads value 4");
engine.write("setoption name Hash value 128");
await engine.grep("uciok");
engine.write("isready");
engine.grep("readyok");

// storage init
const storage = (() => {
	const base = {
		/**
		 * @type {<E>(key: string, def: E) => E}
		 */
		getItem: function (key, def) {
			let item = this[key];
			if (item == null)
				return this[key] = def;
			return item;
		},
		save: () => { }
	};

	try {
		const data = localStorage.getItem("data") || "{}";
		Object.assign(base, JSON.parse(data));
		base.save = function () {
			localStorage.setItem("data", JSON.stringify(this));
		};

		// autosave
		setInterval(() => {
			base.save();
		}, 10000);
	} catch(err) {
		alert("Local storage is disabled by your browser, your browsing data will not be saved.", "Warning");
	}

	return base;
})();
window.onbeforeunload = window.onunload = () => storage.save();

// server init
const socket = io(clientConfig.server);
socket.on("register", () => {
	let clientId = storage.clientId;
	if (clientId == null)
		clientId = storage.clientId = genCliId();

	socket.emit("client_id", clientId);
});
socket.on("invalid_id", () => {
	let clientId = genCliId();
	storage.clientId = clientId;
	socket.emit("client_id", clientId);
});
socket.on("error_quick_match", (...args) => {
	alert(args[0], "Error");
	changeScreen("#menu-screen");
});
socket.on("match", (...args) => {
	config.mode = "online";
	let color = args[0].color;
	config.color = color;
	$("#local").css("display", "none");
	$("#sp").css("display", "none");
	$("#load").css("display", "none");
	changeScreen("#game-screen");
	newGame();
	if (color == "w") {
		board.orientation("white");
	} else board.orientation("black");

	alert("Your opponent: " + args[0].opponent.info.nickname, "Match Found");
});
socket.on("sync_move", (...args) => {
	let fen = args[0].fen;
	let pgn = args[0].pgn;
	game.load(fen);
	board.position(fen);
	$("#fen").text(fen);
	$("#pgn").text(pgn);
});
socket.on("move", (...args) => {
	let move = args[0];
	makeMove(move.from, move.to, move.promotion);
	board.position(game.fen());
});
socket.on("game_abort", () => {
	alert("Player disconnected", "Game Aborted");
	changeScreen("#menu-screen");
});


//  EVENT LISTENERS

// game
$("#board").on("touchmove touchend touchstart", (e) => {
	// prevent scroll while dragging pieces
	if (e.cancelable)
		e.preventDefault();
});

// menu
$("#continue").on("click", () => {
	let cfg = storage.savedGame;
	if (cfg == null) {
		alert("Internal error", "Error");
		$("#continue").css("display", "none");
	}

	Object.clear(config);
	Object.merge(config, cfg);

	switch (cfg.mode) {
		case "single":
			$("#local").css("display", "block");
			$("#show-hint").css("display", "inline-block");
			engine.write("setoption name Skill Level value " + storage.skillLevel);

			if (cfg.color == "w")
				board.orientation("white");
			else
				board.orientation("black");

			break;
		case "local":
			$("#local").css("display", "block");
			$("#show-hint").css("display", "none");
			board.orientation("white");
			break;
	}

	game.reset();
	engine.write("ucinewgame");
	for (let m of cfg.moves) {
		game.move(m);
	}

	board.position(game.fen(), false);
	removeHighlights();
	updateAdvantage();
	$("#status").html(`<b>${game.turn() == "w" ? "White": "Black"}</b> to move.`);
	$("#pgn").html(game.pgn());
	$("#fen").val(game.fen());
	changeScreen("#game-screen");

	if (cfg.mode == "single" && cfg.color != game.turn()) {
		makeBestMove();
	}
});
$("#single-player").on("click", () => {
	changeScreen("#option-screen");
	$(`input[type=\"radio\"][name=\"color\"][value=\"${storage.getItem("color", "r")}\"]`).prop("checked", true);
	$("#skill-level").val(storage.getItem("skillLevel", "1"));
	$("#search-time").val(storage.getItem("searchTime", "2"));
	$("#search-depth").val(storage.getItem("searchDepth", "0"));
});
$("#local-multiplayer").on("click", () => {
	config.mode = "local";
	$("#local").css("display", "block");
	$("#show-hint").css("display", "none");
	$("#load").css("display", "block");
	changeScreen("#game-screen");
	newGame();
	board.orientation("white");
});
$("#online-multiplayer").on("click", () => {
	changeScreen("#online-option-screen");
	$("#nickname").val(storage.getItem("nickname", "Player"));
	$("#player-id").text(storage.clientId);
});
$("#puzzles").on("click", () => {
	alert("Coming soon");
});

// single player option menu
$("input[type=\"radio\"][name=\"color\"]").on("change", () => {
	storage.color = $("input[type=\"radio\"][name=\"color\"]:checked").val();
});
$("#skill-level").on("change", () => {
	storage.skillLevel = $("#skill-level :selected").val();
});
$("#search-time").on("change", () => {
	storage.searchTime = $("#search-time :selected").val();
});
$("#search-depth").on("change", () => {
	storage.searchDepth = $("#search-depth :selected").val();
});
$("#nickname").on("change", () => {
	storage.nickname = $("#nickname").val();
});
$("#play").on("click", () => {
	let color = $("input[type=\"radio\"][name=\"color\"]:checked").val();
	if (color == "r")
		color = Math.random() > 0.5 ? "w" : "b";

	config.color = color;
	config.searchTime = $("#search-time :selected").val();
	config.searchDepth = $("#search-depth :selected").val();
	config.mode = "single";

	$("#local").css("display", "block");
	$("#show-hint").css("display", "inline-block");
	$("#load").css("display", "block");

	engine.write("setoption name Skill Level value " + $("#skill-level :selected").val());
	changeScreen("#game-screen");
	newGame();

	if (color == "w")
		board.orientation("white");
	else {
		board.orientation("black");
		makeBestMove();
	}
});

// online option menu
$("#quick-match").on("click", () => {
	if (!socket.connected) {
		alert("", "Server Connection Failure");
		changeScreen("#menu-screen");
		return;
	}

	socket.emit("req_quick_match", {
		nickname: $("#nickname").val()
	});

	changeScreen("#matching-screen");
});
$("#cancel").on("click", () => {
	socket.emit("cancel_quick_match");
	changeScreen("#menu-screen");
});

// game controls
$("#undo").on("click", () => {
	if (undo()) {
		removeHighlights();
		updateAdvantage();
		$("#pgn").text(game.pgn());
		$("#fen").val(game.fen());
	} else alert("Nothing to undo");
});
$("#redo").on("click", () => {
	if (redo()) {
		removeHighlights();
		updateAdvantage();
		$("#pgn").text(game.pgn());
		$("#fen").val(game.fen());
	} else alert("Nothing to redo");
});
$("#restart").on("click", () => {
	newGame();
	if (config.mode == "single" && config.color != "w") {
		makeBestMove();
	}
});
$("#show-hint").on("click", () => {
	showHint();
});
$("#menu-btn, #home").on("click", () => {
	changeScreen("#menu-screen");
	config.movingPiece = false;
	if (storage.savedGame != null)
		$("#continue").css("display", "block");
	else $("#continue").css("display", "none");

	if (config.mode == "online")
		socket.emit("req_disconnect");
});
$("#load").on("click", () => {
	let fen = $("#fen").val();

	if (game.load(fen) && !game.game_over()) {
		resetBoard();
		if (config.mode == "single" && config.color != game.turn()) {
			makeBestMove();
		}
	} else alert("Invalid FEN string", "Error");
});

// header buttons
$("#settings").on("click", () => {
	changeScreen("#settings-screen");

	$("#auto-flip-lm").prop("checked", storage.getItem("autoFlipLm", true));
});
$("#about").on("click", () => {
	alert(`ChessCheta version ${clientConfig.cacheVersion}, open source on <a href="https://www.github.com/ruochenjia/chesscheta" target="_blank">GitHub</a>.`, "About");
});

// settings menu
$("#dark-square-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.darkSquareColor = code.toString();
	$("#dark-square-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
	
});
$("#light-square-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.lightSquareColor = code.toString();
	$("#light-square-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
});
$("#move-white-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.moveWhiteColor = code.toString();
	$("#move-white-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
});
$("#move-black-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.moveBlackColor = code.toString();
	$("#move-black-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
});
$("#hint-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.hintColor = code.toString();
	$("#hint-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
});
$("#moveable-squares-color").on("blur", (e) => {
	let code = ColorCode.parse($(e.target).val());
	if (code == null) {
		alert("Invalid color code");
		return;
	}
	storage.moveableSquaresColor = code.toString();
	$("#moveable-squares-color-preview").css("background-color", code.cssString);
	applyBoardStyles();
});
$("#auto-flip-lm").on("change", (e) => {
	storage.autoFlipLm = $(e.target).is(":checked");
});

// chessboard resize handler
$(window).on("resize", resizeBoard);

function changeScreen(id) {
	$(".screen").css("visibility", "hidden");
	$(id).css("visibility", "visible");
}

function resizeBoard() {
	let width = $("#board").width();
	let height = $("#board").height();

	if (width != height)
		$("#board").height(width);

	board.resize();
}

resizeBoard();

if (storage.savedGame != null)
	$("#continue").css("display", "block");

function removeHighlights() {
	$("#board .square-55d63").removeClass("highlight-white");
	$("#board .square-55d63").removeClass("highlight-black");
	$("#board .square-55d63").removeClass("highlight-hint");
}

function newGame() {
	game.reset();
	resetBoard();
}

function resetBoard() {
	engine.write("ucinewgame");
	config.globalSum = 0;
	config.moves = [];
	config.undoStack = [];
	config.ponderMove = null;
	config.movingPiece = false;
	storage.savedGame = null;

	let fen = game.fen();
	let pgn = game.pgn();
	board.position(fen, false);
	removeHighlights();
	updateAdvantage();
	$("#status").html(`<b>${game.turn() == "w" ? "White": "Black"}</b> to move.`);
	$("#pgn").text(pgn);
	$("#fen").val(fen);
}

function undo() {
	let length = config.moves.length;
	if (length < 1)
		return false;

	switch (config.mode) {
		case "single":
			if (config.movingPiece) {
				config.movingPiece = false;
				_undo();
			} else {
				_undo();
				_undo();
			}
			return true;
		case "local":
			_undo();
			return true;
		default:
			return false;
	}
}

function redo() {
	let length = config.undoStack.length;
	if (length < 1)
		return false;

	switch (config.mode) {
		case "single":
			if (length >= 2) {
				_redo();
				_redo();
				return true;
			} else return false;
		case "local":
			_redo();
			return true;
		default:
			return false;
	}
}

function _undo() {
	game.undo();
	let move = config.moves.pop();
	let last = config.moves.last();
	config.globalSum = last == null ? 0 : last.sum;
	config.undoStack.push(move);
	// recalculation is required after undo
	config.ponderMove = null;
	board.position(game.fen());
}

function _redo() {
	let move = config.undoStack.pop();
	game.move(move);
	config.moves.push(move);
	config.globalSum = move.sum;
	board.position(game.fen());
}

function updateAdvantage() {
	let sum = config.globalSum;
	if (sum > 0) {
		$("#advantageColor").text("Black");
		$("#advantageNumber").text(sum);
	} else if (sum < 0) {
		$("#advantageColor").text("White");
		$("#advantageNumber").text(-sum);
	} else {
		$("#advantageColor").text("Neither side");
		$("#advantageNumber").text(sum);
	}
	$("#advantageBar").attr({
		"aria-valuenow": `${-sum}`,
		style: `width: ${(() => {
			let v = (-sum + 2000) / 40;
			if (v > 100)
				v = 100;
			if (v < 0)
				v = 0;
			return Math.round(v);
		})()}%`
	});
}

function checkStatus(color) {
	let current, next, msg, gameOver = false;

	if (color == "w") {
		current = "White";
		next = "Black";
	} else {
		current = "Black";
		next = "White";
	}

	// avoid using game.game_over() for performance reasons
	if (game.in_checkmate()) {
		msg = `<b>Checkmate!</b> <b>${current}</b> won.`
		gameOver = true;
	} else if (game.insufficient_material()) {
		msg = `<b>Draw!</b> (Insufficient Material)`;
		gameOver = true;
	} else if (game.in_threefold_repetition()) {
		msg = `<b>Draw!</b> (Threefold Repetition)`;
		gameOver = true;
	} else if (game.in_stalemate()) {
		msg = `<b>Draw!</b> (Stalemate)`;
		gameOver = true;
	} else if (game.in_draw()) {
		msg = `<b>Draw!</b> (50-move Rule)`;
		gameOver = true;
	} else if (game.in_check())
		msg = `<b>${next}</b> to move, and is in <b>check!</b>`;
	else
		msg = `<b>${next}</b> to move.`;

	$("#status").html(msg);

	if (gameOver) {
		alert(msg, "Game Over");
		return true;
	} else return false;
}

async function getBestMove() {
	engine.write(`position fen ${game.fen()}`);

	let cmd = `go movetime ${config.searchTime}000`;
	let depth = config.searchDepth;
	if (depth != "0")
		cmd += " depth " + depth;

	engine.write(cmd);
	let output = (await engine.grep("bestmove")).split(" ");
	let move = output[1];
	let moveObj = {
		from: move[0] + move[1],
		to: move[2] + move[3],
	};

	if (output.length == 4) {
		let ponder = output[3];
		let ponderObj = {
			from: ponder[0] + ponder[1],
			to: ponder[2] + ponder[3]
		};
		moveObj.ponder = ponderObj;
	}

	return moveObj;
}

async function showHint() {
	$("#board .square-55d63").removeClass('highlight-hint');

	if (!game.game_over()) {
		let move = config.ponderMove;
		if (move == null)
			move = await getBestMove();
		$("#board .square-" + move.from).addClass('highlight-hint');
		$("#board .square-" + move.to).addClass('highlight-hint');
	}
}

async function makeBestMove() {
	config.movingPiece = true;
	let move = await getBestMove();
	if (!config.movingPiece)
		return; // interrupt move

	config.ponderMove = move.ponder;
	makeMove(move.from, move.to, "q");
	board.position(game.fen());
	config.movingPiece = false;
}

function highlightMove(move) {
	if (move.color == "b") {
		$("#board .square-55d63").removeClass("highlight-black");
	  	$("#board .square-" + move.from).addClass("highlight-black");
		$("#board .square-" + move.to).addClass("highlight-black");
	} else {
		$("#board .square-55d63").removeClass("highlight-white");
	  	$("#board .square-" + move.from).addClass("highlight-white");
		$("#board .square-" + move.to).addClass("highlight-white");
	}
}

function makeMove(from, to, promotion) {
	let move = game.move({ from, to, promotion });
	if (move == null)
		return null;

	let sum = evaluateBoard(move, config.globalSum, "b");
	move.sum = sum;
	move.status = checkStatus(move.color);
	config.moves.push(move);
	config.globalSum = sum;
	updateAdvantage();
	highlightMove(move);
	$("#board .square-55d63").removeClass('highlight-hint');
	$("#pgn").text(game.pgn());
	$("#fen").val(game.fen());

	if (config.mode != "online")
		storage.savedGame = { ...config };

	return move;
}

function onDrop(source, target) {
	config.undoStack = [];
	removeGreySquares();

	let move = makeMove(source, target, "q");
	if (move == null)
		return "snapback";

	switch (config.mode) {
		case "single":
			if (!move.status) {
				makeBestMove();
			}
			break;
		case "local":
			if (!move.status && storage.getItem("autoFlipLm", true)) {
				board.orientation(move.color == "w" ? "black" : "white");
			}
			break;
		case "online":
			socket.emit("make_move", move);
	}
}

function shouldMove(piece) {
	if (game.game_over())
		return false;

	switch (config.mode) {
		case "single":
		case "online":
			return piece[0] == config.color;
		case "local":
			return piece[0] == game.turn();
		default:
			return false;
	}
}

function onDragStart(source, piece, position, orientation) {
	return shouldMove(piece);
}

function removeGreySquares() {
	$("#board .square-55d63").removeClass("highlight-moveable")
}
  
function greySquare(square) {
	$("#board .square-" + square).addClass("highlight-moveable");
}

function onMouseoverSquare(square, piece) {
	if (!shouldMove(piece))
		return;

	let moves = game.moves({
		square,
		verbose: true
	});

	for (let i = 0; i < moves.length; i++)
		greySquare(moves[i].to);
}
  
function onMouseoutSquare(square, piece) {
	removeGreySquares();
}

function onSnapEnd() {
	board.position(game.fen());
}

function genCliId() {
	let str = "";
	for (let i = 0; i < 20; i++)
		str += Math.floor(Math.random() * 10);
	return str;
}

$("#version").text(clientConfig.cacheVersion);
$("#loading-screen").remove();

// lock
export const Lock = {
	lock: () => {
		console.log("%cChessCheta", `background-color:#800000;border:3px solid #ffff00;border-radius:10px;color:#ffffff;display:block;font-family:Ubuntu;font-size:24px;font-stretch:normal;font-style:normal;font-weight:600;height:fit-content;margin:10px;padding:10px;position:relative;text-align:start;text-decoration:none;width:fit-content`);
		console.log("%cPage Verified", `position: relative;display: block;width: fit-content;height: fit-content;color: #ffffff;background-color: #008000;font-size: 14px;font-weight: 600;font-family: "Ubuntu Mono";font-stretch: normal;text-align: start;text-decoration: none;`);
	}
};
