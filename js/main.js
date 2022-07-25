var positionCount, STACK_SIZE = 100,
	board = Chessboard("chess-board", {
		draggable: !0,
		position: "start",
		onDragStart: onDragStart,
		onDrop: onDrop,
		onMouseoutSquare: onMouseoutSquare,
		onMouseoverSquare: onMouseoverSquare,
		onSnapEnd: onSnapEnd
	}),
	$board = $("#chess-board"),
	game = new Chess,
	globalSum = 0,
	whiteSquareGrey = "#a9a9a9",
	blackSquareGrey = "#696969",
	squareClass = "square-55d63",
	squareToHighlight = null,
	colorToHighlight = null;
timer = null;
var weights = {
		p: 100,
		n: 280,
		b: 320,
		r: 479,
		q: 929,
		k: 6e4,
		k_e: 6e4
	},
	pst_w = {
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
	},
	pst_b = {
		p: pst_w.p.slice().reverse(),
		n: pst_w.n.slice().reverse(),
		b: pst_w.b.slice().reverse(),
		r: pst_w.r.slice().reverse(),
		q: pst_w.q.slice().reverse(),
		k: pst_w.k.slice().reverse(),
		k_e: pst_w.k_e.slice().reverse()
	},
	pstOpponent = {
		w: pst_b,
		b: pst_w
	},
	pstSelf = {
		w: pst_w,
		b: pst_b
	};

function evaluateBoard(e, t, o, a) {
	if (e.in_checkmate()) return t.color === a ? 10 ** 10 : -(10 ** 10);
	if (e.in_draw() || e.in_threefold_repetition() || e.in_stalemate()) return 0;
	e.in_check() && (t.color === a ? o += 50 : o -= 50);
	var i = [8 - parseInt(t.from[1]), t.from.charCodeAt(0) - "a".charCodeAt(0)],
		r = [8 - parseInt(t.to[1]), t.to.charCodeAt(0) - "a".charCodeAt(0)];
	return o < -1500 && "k" === t.piece && (t.piece = "k_e"), "captured" in t && (t.color === a ? o += weights[t.captured] + pstOpponent[t.color][t.captured][r[0]][r[1]] : o -= weights[t.captured] + pstSelf[t.color][t.captured][r[0]][r[1]]), t.flags.includes("p") ? (t.promotion = "q", t.color === a ? (o -= weights[t.piece] + pstSelf[t.color][t.piece][i[0]][i[1]], o += weights[t.promotion] + pstSelf[t.color][t.promotion][r[0]][r[1]]) : (o += weights[t.piece] + pstSelf[t.color][t.piece][i[0]][i[1]], o -= weights[t.promotion] + pstSelf[t.color][t.promotion][r[0]][r[1]])) : t.color !== a ? (o += pstSelf[t.color][t.piece][i[0]][i[1]], o -= pstSelf[t.color][t.piece][r[0]][r[1]]) : (o -= pstSelf[t.color][t.piece][i[0]][i[1]], o += pstSelf[t.color][t.piece][r[0]][r[1]]), o
}

function minimax(e, t, o, a, i, r, n) {
	positionCount++;
	var s, l = e.ugly_moves({
		verbose: !0
	});
	if (l.sort((function(e, t) {
			return .5 - Math.random()
		})), 0 === t || 0 === l.length) return [null, r];
	for (var u, c = Number.NEGATIVE_INFINITY, h = Number.POSITIVE_INFINITY, g = 0; g < l.length; g++) {
		s = l[g];
		var d = e.ugly_move(s),
			m = evaluateBoard(e, d, r, n),
			[p, b] = minimax(e, t - 1, o, a, !i, m, n);
		if (e.undo(), i ? (b > c && (c = b, u = d), b > o && (o = b)) : (b < h && (h = b, u = d), b < a && (a = b)), o >= a) break
	}
	return i ? [u, c] : [u, h]
}

function checkStatus(e) {
	if (game.in_checkmate()) $("#status").html(`<b>Checkmate!</b> Oops, <b>${e}</b> lost.`);
	else if (game.insufficient_material()) $("#status").html('It"s a <b>draw!</b> (Insufficient Material)');
	else if (game.in_threefold_repetition()) $("#status").html('It"s a <b>draw!</b> (Threefold Repetition)');
	else if (game.in_stalemate()) $("#status").html('It"s a <b>draw!</b> (Stalemate)');
	else {
		if (!game.in_draw()) return game.in_check() ? ($("#status").html(`Oops, <b>${e}</b> is in <b>check!</b>`), !1) : ($("#status").html("No check, checkmate, or draw."), !1);
		$("#status").html('It"s a <b>draw!</b> (50-move Rule)')
	}
	return !0
}

function updateAdvantage() {
	globalSum > 0 ? ($("#advantageColor").text("Black"), $("#advantageNumber").text(globalSum)) : globalSum < 0 ? ($("#advantageColor").text("White"), $("#advantageNumber").text(-globalSum)) : ($("#advantageColor").text("Neither side"), $("#advantageNumber").text(globalSum)), $("#advantageBar").attr({
		"aria-valuenow": "" + -globalSum,
		style: `width: ${(2e3-globalSum)/4e3*100}%`
	})
}

function getBestMove(e, t, o) {
	if (positionCount = 0, "b" === t) var a = parseInt($("#search-depth").find(":selected").text());
	else a = parseInt($("#search-depth-white").find(":selected").text());
	var i = (new Date).getTime(),
		[r, n] = minimax(e, a, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, !0, o, t),
		s = (new Date).getTime() - i,
		l = 1e3 * positionCount / s;
	return $("#position-count").text(positionCount), $("#time").text(s / 1e3), $("#positions-per-s").text(Math.round(l)), [r, n]
}

function makeBestMove(e) {
	if ("b" === e) var t = getBestMove(game, e, globalSum)[0];
	else t = getBestMove(game, e, -globalSum)[0];
	globalSum = evaluateBoard(game, t, globalSum, "b"), updateAdvantage(), game.move(t), board.position(game.fen()), "b" === e ? (checkStatus("black"), $board.find("." + squareClass).removeClass("highlight-black"), $board.find(".square-" + t.from).addClass("highlight-black"), squareToHighlight = t.to, colorToHighlight = "black", $board.find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight)) : (checkStatus("white"), $board.find("." + squareClass).removeClass("highlight-white"), $board.find(".square-" + t.from).addClass("highlight-white"), squareToHighlight = t.to, colorToHighlight = "white", $board.find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight))
}

function compVsComp(e) {
	checkStatus({
		w: "white",
		b: "black"
	} [e]) || (timer = window.setTimeout((function() {
		makeBestMove(e), compVsComp(e = "w" === e ? "b" : "w")
	}), 250))
}

function reset() {
	game.reset(), globalSum = 0, $board.find("." + squareClass).removeClass("highlight-white"), $board.find("." + squareClass).removeClass("highlight-black"), $board.find("." + squareClass).removeClass("highlight-hint"), board.position(game.fen()), $("#advantageColor").text("Neither side"), $("#advantageNumber").text(globalSum), timer && (clearTimeout(timer), timer = null)
}
$("#ruyLopezBtn").on("click", (function() {
	reset(), game.load("r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1"), board.position(game.fen()), window.setTimeout((function() {
		makeBestMove("b")
	}), 250)
})), $("#italianGameBtn").on("click", (function() {
	reset(), game.load("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1"), board.position(game.fen()), window.setTimeout((function() {
		makeBestMove("b")
	}), 250)
})), $("#sicilianDefenseBtn").on("click", (function() {
	reset(), game.load("rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"), board.position(game.fen())
})), $("#startBtn").on("click", (function() {
	reset()
})), $("#compVsCompBtn").on("click", (function() {
	reset(), compVsComp("w")
})), $("#resetBtn").on("click", (function() {
	reset()
}));
var undo_stack = [];

function undo() {
	var e = game.undo();
	undo_stack.push(e), undo_stack.length > STACK_SIZE && undo_stack.shift(), board.position(game.fen())
}

function redo() {
	game.move(undo_stack.pop()), board.position(game.fen())
}

function showHint() {
	var e = document.getElementById("showHint");
	if ($board.find("." + squareClass).removeClass("highlight-hint"), e.checked) {
		var t = getBestMove(game, "w", -globalSum)[0];
		$board.find(".square-" + t.from).addClass("highlight-hint"), $board.find(".square-" + t.to).addClass("highlight-hint")
	}
}

function removeGreySquares() {
	$("#chess-board .square-55d63").css("background", "")
}

function greySquare(e) {
	var t = $("#chess-board .square-" + e),
		o = whiteSquareGrey;
	t.hasClass("black-3c85d") && (o = blackSquareGrey), t.css("background", o)
}

function onDragStart(e, t) {
	return !game.game_over() && (!("w" === game.turn() && -1 !== t.search(/^b/) || "b" === game.turn() && -1 !== t.search(/^w/)) && void 0)
}

function onDrop(e, t) {
	undo_stack = [], removeGreySquares();
	var o = game.move({
		from: e,
		to: t,
		promotion: "q"
	});
	if (null === o) return "snapback";
	globalSum = evaluateBoard(game, o, globalSum, "b"), updateAdvantage(), $board.find("." + squareClass).removeClass("highlight-white"), $board.find(".square-" + o.from).addClass("highlight-white"), squareToHighlight = o.to, colorToHighlight = "white", $board.find(".square-" + squareToHighlight).addClass("highlight-" + colorToHighlight), checkStatus("black"), window.setTimeout((function() {
		makeBestMove("b"), window.setTimeout((function() {
			showHint()
		}), 250)
	}), 250)
}

function onMouseoverSquare(e, t) {
	var o = game.moves({
		square: e,
		verbose: !0
	});
	if (0 !== o.length) {
		greySquare(e);
		for (var a = 0; a < o.length; a++) greySquare(o[a].to)
	}
}

function onMouseoutSquare(e, t) {
	removeGreySquares()
}

function onSnapEnd() {
	board.position(game.fen())
}
$("#undoBtn").on("click", (function() {
	game.history().length >= 2 ? ($board.find("." + squareClass).removeClass("highlight-white"), $board.find("." + squareClass).removeClass("highlight-black"), $board.find("." + squareClass).removeClass("highlight-hint"), undo(), window.setTimeout((function() {
		undo(), window.setTimeout((function() {
			showHint()
		}), 250)
	}), 250)) : alert("Nothing to undo.")
})), $("#redoBtn").on("click", (function() {
	undo_stack.length >= 2 ? (redo(), window.setTimeout((function() {
		redo(), window.setTimeout((function() {
			showHint()
		}), 250)
	}), 250)) : alert("Nothing to redo.")
})), $("#showHint").change((function() {
	window.setTimeout(showHint, 250)
}));