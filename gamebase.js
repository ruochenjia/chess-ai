"use strict";

/*
 * Adapted from chess.js
 * https://github.com/jhlywa/chess.js/blob/master/chess.js
 */
const SYMBOLS="pnbrqkPNBRQK",DEFAULT_POSITION="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",TERMINATION_MARKERS=["1-0","0-1","1/2-1/2","*"],PAWN_OFFSETS={b:[16,32,17,15],w:[-16,-32,-17,-15]},PIECE_OFFSETS={n:[-18,-33,-31,-14,18,33,31,14],b:[-17,-15,17,15],r:[-16,1,16,-1],q:[-17,-16,-15,1,17,16,15,-1],k:[-17,-16,-15,1,17,16,15,-1]},ATTACKS=[20,0,0,0,0,0,0,24,0,0,0,0,0,0,20,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,24,24,24,24,24,24,56,0,56,24,24,24,24,24,24,0,0,0,0,0,0,2,53,56,53,2,0,0,0,0,0,0,0,0,0,0,0,20,2,24,2,20,0,0,0,0,0,0,0,0,0,0,20,0,0,24,0,0,20,0,0,0,0,0,0,0,0,20,0,0,0,24,0,0,0,20,0,0,0,0,0,0,20,0,0,0,0,24,0,0,0,0,20,0,0,0,0,20,0,0,0,0,0,24,0,0,0,0,0,20,0,0,20,0,0,0,0,0,0,24,0,0,0,0,0,0,20],RAYS=[17,0,0,0,0,0,0,16,0,0,0,0,0,0,15,0,0,17,0,0,0,0,0,16,0,0,0,0,0,15,0,0,0,0,17,0,0,0,0,16,0,0,0,0,15,0,0,0,0,0,0,17,0,0,0,16,0,0,0,15,0,0,0,0,0,0,0,0,17,0,0,16,0,0,15,0,0,0,0,0,0,0,0,0,0,17,0,16,0,15,0,0,0,0,0,0,0,0,0,0,0,0,17,16,15,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,-1,-1,-1,-1,-1,-1,-1,0,0,0,0,0,0,0,-15,-16,-17,0,0,0,0,0,0,0,0,0,0,0,0,-15,0,-16,0,-17,0,0,0,0,0,0,0,0,0,0,-15,0,0,-16,0,0,-17,0,0,0,0,0,0,0,0,-15,0,0,0,-16,0,0,0,-17,0,0,0,0,0,0,-15,0,0,0,0,-16,0,0,0,0,-17,0,0,0,0,-15,0,0,0,0,0,-16,0,0,0,0,0,-17,0,0,-15,0,0,0,0,0,0,-16,0,0,0,0,0,0,-17],SHIFTS={p:0,n:1,b:2,r:3,q:4,k:5},BITS={NORMAL:1,CAPTURE:2,BIG_PAWN:4,EP_CAPTURE:8,PROMOTION:16,KSIDE_CASTLE:32,QSIDE_CASTLE:64},RANK_1=7,RANK_2=6,RANK_3=5,RANK_4=4,RANK_5=3,RANK_6=2,RANK_7=1,RANK_8=0,SQUARE_MAP={a8:0,b8:1,c8:2,d8:3,e8:4,f8:5,g8:6,h8:7,a7:16,b7:17,c7:18,d7:19,e7:20,f7:21,g7:22,h7:23,a6:32,b6:33,c6:34,d6:35,e6:36,f6:37,g6:38,h6:39,a5:48,b5:49,c5:50,d5:51,e5:52,f5:53,g5:54,h5:55,a4:64,b4:65,c4:66,d4:67,e4:68,f4:69,g4:70,h4:71,a3:80,b3:81,c3:82,d3:83,e3:84,f3:85,g3:86,h3:87,a2:96,b2:97,c2:98,d2:99,e2:100,f2:101,g2:102,h2:103,a1:112,b1:113,c1:114,d1:115,e1:116,f1:117,g1:118,h1:119},ROOKS={w:[{square:SQUARE_MAP.a1,flag:BITS.QSIDE_CASTLE},{square:SQUARE_MAP.h1,flag:BITS.KSIDE_CASTLE}],b:[{square:SQUARE_MAP.a8,flag:BITS.QSIDE_CASTLE},{square:SQUARE_MAP.h8,flag:BITS.KSIDE_CASTLE}]},PARSER_STRICT=0,PARSER_SLOPPY=1;function get_disambiguator(r,e){for(var n=r.from,t=r.to,o=r.piece,i=0,a=0,l=0,f=0,u=e.length;f<u;f++){var c=e[f].from,s=e[f].to;o===e[f].piece&&n!==c&&t===s&&(i++,rank(n)===rank(c)&&a++,file(n)===file(c)&&l++)}return i>0?a>0&&l>0?algebraic(n):l>0?algebraic(n).charAt(1):algebraic(n).charAt(0):""}function infer_piece_type(r){var e=r.charAt(0);if(e>="a"&&e<="h"){if(r.match(/[a-h]\d.*[a-h]\d/))return;return PAWN}return"o"===(e=e.toLowerCase())?KING:e}function stripped_san(r){return r.replace(/=/,"").replace(/[+#]?[?!]*$/,"")}function rank(r){return r>>4}function file(r){return 15&r}function algebraic(r){var e=file(r),n=rank(r);return"abcdefgh".substring(e,e+1)+"87654321".substring(n,n+1)}function swap_color(r){return r===WHITE?BLACK:WHITE}function is_digit(r){return-1!=="0123456789".indexOf(r)}function clone(r){var e=r instanceof Array?[]:{};for(var n in r)e[n]="object"==typeof n?clone(r[n]):r[n];return e}function trim(r){return r.replace(/^\s+|\s+$/g,"")}export const BLACK="b";export const WHITE="w";export const EMPTY=-1;export const PAWN="p";export const KNIGHT="n";export const BISHOP="b";export const ROOK="r";export const QUEEN="q";export const KING="k";export const SQUARES=function(){for(var r=[],e=SQUARE_MAP.a8;e<=SQUARE_MAP.h1;e++)136&e?e+=7:r.push(algebraic(e));return r}();export const FLAGS={NORMAL:"n",CAPTURE:"c",BIG_PAWN:"b",EP_CAPTURE:"e",PROMOTION:"p",KSIDE_CASTLE:"k",QSIDE_CASTLE:"q"};export const Chess=function(r){var e=new Array(128),n={w:-1,b:-1},t=WHITE,o={w:0,b:0},i=-1,a=0,l=1,f=[],u={},c={};function s(r){void 0===r&&(r=!1),e=new Array(128),n={w:-1,b:-1},t=WHITE,o={w:0,b:0},i=-1,a=0,l=1,f=[],r||(u={}),c={},v(E())}function p(){for(var r=[],e={},n=function(r){r in c&&(e[r]=c[r])};f.length>0;)r.push(K());for(n(E());r.length>0;)y(r.pop()),n(E());c=e}function S(){A(DEFAULT_POSITION)}function A(r,e){void 0===e&&(e=!1);var n=r.split(/\s+/),f=n[0],u=0;if(!g(r).valid)return!1;s(e);for(var c=0;c<f.length;c++){var p=f.charAt(c);if("/"===p)u+=8;else if(is_digit(p))u+=parseInt(p,10);else{var S=p<"a"?WHITE:BLACK;T({type:p.toLowerCase(),color:S},algebraic(u)),u++}}return t=n[1],n[2].indexOf("K")>-1&&(o.w|=BITS.KSIDE_CASTLE),n[2].indexOf("Q")>-1&&(o.w|=BITS.QSIDE_CASTLE),n[2].indexOf("k")>-1&&(o.b|=BITS.KSIDE_CASTLE),n[2].indexOf("q")>-1&&(o.b|=BITS.QSIDE_CASTLE),i="-"===n[3]?-1:SQUARE_MAP[n[3]],a=parseInt(n[4],10),l=parseInt(n[5],10),v(E()),!0}function g(r){var e=r.split(/\s+/);if(6!==e.length)return{valid:!1,error_number:1,error:"FEN string must contain six space-delimited fields."};if(isNaN(parseInt(e[5]))||parseInt(e[5],10)<=0)return{valid:!1,error_number:2,error:"6th field (move number) must be a positive integer."};if(isNaN(parseInt(e[4]))||parseInt(e[4],10)<0)return{valid:!1,error_number:3,error:"5th field (half move counter) must be a non-negative integer."};if(!/^(-|[abcdefgh][36])$/.test(e[3]))return{valid:!1,error_number:4,error:"4th field (en-passant square) is invalid."};if(!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(e[2]))return{valid:!1,error_number:5,error:"3rd field (castling availability) is invalid."};if(!/^(w|b)$/.test(e[1]))return{valid:!1,error_number:6,error:"2nd field (side to move) is invalid."};var n=e[0].split("/");if(8!==n.length)return{valid:!1,error_number:7,error:"1st field (piece positions) does not contain 8 '/'-delimited rows."};for(var t=0;t<n.length;t++){for(var o=0,i=!1,a=0;a<n[t].length;a++)if(isNaN(n[t][a])){if(!/^[prnbqkPRNBQK]$/.test(n[t][a]))return{valid:!1,error_number:9,error:"1st field (piece positions) is invalid [invalid piece]."};o+=1,i=!1}else{if(i)return{valid:!1,error_number:8,error:"1st field (piece positions) is invalid [consecutive numbers]."};o+=parseInt(n[t][a],10),i=!0}if(8!==o)return{valid:!1,error_number:10,error:"1st field (piece positions) is invalid [row too large]."}}return"3"==e[3][1]&&"w"==e[1]||"6"==e[3][1]&&"b"==e[1]?{valid:!1,error_number:11,error:"Illegal en-passant square"}:{valid:!0,error_number:0,error:"No errors."}}function E(){for(var r=0,n="",f=SQUARE_MAP.a8;f<=SQUARE_MAP.h1;f++){if(null==e[f])r++;else{r>0&&(n+=r,r=0);var u=e[f].color,c=e[f].type;n+=u===WHITE?c.toUpperCase():c.toLowerCase()}f+1&136&&(r>0&&(n+=r),f!==SQUARE_MAP.h1&&(n+="/"),r=0,f+=8)}var s="";o[WHITE]&BITS.KSIDE_CASTLE&&(s+="K"),o[WHITE]&BITS.QSIDE_CASTLE&&(s+="Q"),o[BLACK]&BITS.KSIDE_CASTLE&&(s+="k"),o[BLACK]&BITS.QSIDE_CASTLE&&(s+="q"),s=s||"-";var p=-1===i?"-":algebraic(i);return[n,t,s,p,a,l].join(" ")}function _(r){for(var e=0;e<r.length;e+=2)"string"==typeof r[e]&&"string"==typeof r[e+1]&&(u[r[e]]=r[e+1]);return u}function v(r){f.length>0||(r!==DEFAULT_POSITION?(u.SetUp="1",u.FEN=r):(delete u.SetUp,delete u.FEN))}function h(r){var n=e[SQUARE_MAP[r]];return n?{type:n.type,color:n.color}:null}function T(r,t){if(!("type"in r)||!("color"in r))return!1;if(-1===SYMBOLS.indexOf(r.type.toLowerCase()))return!1;if(!(t in SQUARE_MAP))return!1;var o=SQUARE_MAP[t];return(r.type!=KING||-1==n[r.color]||n[r.color]==o)&&(e[o]={type:r.type,color:r.color},r.type===KING&&(n[r.color]=o),v(E()),!0)}function I(r,e,n,o,i){var a={color:t,from:e,to:n,flags:o,piece:r[e].type};return i&&(a.flags|=BITS.PROMOTION,a.promotion=i),r[n]?a.captured=r[n].type:o&BITS.EP_CAPTURE&&(a.captured=PAWN),a}function b(r){function a(r,e,n,t,o){if(r[n].type!==PAWN||0!==rank(t)&&7!==rank(t))e.push(I(r,n,t,o));else for(var i=["q","r","b","n"],a=0,l=i.length;a<l;a++)e.push(I(r,n,t,o,i[a]))}var l=[],f=t,u=swap_color(f),c={b:1,w:6},s=SQUARE_MAP.a8,p=SQUARE_MAP.h1,S=!1,A=void 0===r||!("legal"in r)||r.legal,g=void 0===r||!("piece"in r)||"string"!=typeof r.piece||r.piece.toLowerCase();if(void 0!==r&&"square"in r){if(!(r.square in SQUARE_MAP))return[];s=p=SQUARE_MAP[r.square],S=!0}for(var E=s;E<=p;E++)if(136&E)E+=7;else{var _=e[E];if(null!=_&&_.color===f)if(_.type!==PAWN||!0!==g&&g!==PAWN){if(!0===g||g===_.type)for(var v=0,h=PIECE_OFFSETS[_.type].length;v<h;v++){var T=PIECE_OFFSETS[_.type][v];for(b=E;!(136&(b+=T));){if(null!=e[b]){if(e[b].color===f)break;a(e,l,E,b,BITS.CAPTURE);break}if(a(e,l,E,b,BITS.NORMAL),"n"===_.type||"k"===_.type)break}}}else{var b=E+PAWN_OFFSETS[f][0];if(null==e[b]){a(e,l,E,b,BITS.NORMAL);b=E+PAWN_OFFSETS[f][1];c[f]===rank(E)&&null==e[b]&&a(e,l,E,b,BITS.BIG_PAWN)}for(v=2;v<4;v++)136&(b=E+PAWN_OFFSETS[f][v])||(null!=e[b]&&e[b].color===u?a(e,l,E,b,BITS.CAPTURE):b===i&&a(e,l,E,i,BITS.EP_CAPTURE))}}if(!(!0!==g&&g!==KING||S&&p!==n[f])){if(o[f]&BITS.KSIDE_CASTLE){var d=(m=n[f])+2;null!=e[m+1]||null!=e[d]||R(u,n[f])||R(u,m+1)||R(u,d)||a(e,l,n[f],d,BITS.KSIDE_CASTLE)}var m;if(o[f]&BITS.QSIDE_CASTLE)d=(m=n[f])-2,null!=e[m-1]||null!=e[m-2]||null!=e[m-3]||R(u,n[f])||R(u,m-1)||R(u,d)||a(e,l,n[f],d,BITS.QSIDE_CASTLE)}if(!A)return l;var C=[];for(E=0,h=l.length;E<h;E++)y(l[E]),P(f)||C.push(l[E]),K();return C}function d(r,e){var n="";if(r.flags&BITS.KSIDE_CASTLE)n="O-O";else if(r.flags&BITS.QSIDE_CASTLE)n="O-O-O";else{if(r.piece!==PAWN){var t=get_disambiguator(r,e);n+=r.piece.toUpperCase()+t}r.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)&&(r.piece===PAWN&&(n+=algebraic(r.from)[0]),n+="x"),n+=algebraic(r.to),r.flags&BITS.PROMOTION&&(n+="="+r.promotion.toUpperCase())}return y(r),m()&&(C()?n+="#":n+="+"),K(),n}function R(r,n){for(var t=SQUARE_MAP.a8;t<=SQUARE_MAP.h1;t++)if(136&t)t+=7;else if(null!=e[t]&&e[t].color===r){var o=e[t],i=t-n,a=i+119;if(ATTACKS[a]&1<<SHIFTS[o.type]){if(o.type===PAWN){if(i>0){if(o.color===WHITE)return!0}else if(o.color===BLACK)return!0;continue}if("n"===o.type||"k"===o.type)return!0;for(var l=RAYS[a],f=t+l,u=!1;f!==n;){if(null!=e[f]){u=!0;break}f+=l}if(!u)return!0}}return!1}function P(r){return R(swap_color(r),n[r])}function m(){return P(t)}function C(){return m()&&0===b().length}function O(){return!m()&&0===b().length}function N(){for(var r={},n=[],t=0,o=0,i=SQUARE_MAP.a8;i<=SQUARE_MAP.h1;i++)if(o=(o+1)%2,136&i)i+=7;else{var a=e[i];a&&(r[a.type]=a.type in r?r[a.type]+1:1,"b"===a.type&&n.push(o),t++)}if(2===t)return!0;if(3===t&&(1===r.b||1===r.n))return!0;if(t===r.b+2){var l=0,f=n.length;for(i=0;i<f;i++)l+=n[i];if(0===l||l===f)return!0}return!1}function B(){for(var r=[],e={},n=!1;;){var t=K();if(!t)break;r.push(t)}for(;;){var o=E().split(" ").slice(0,4).join(" ");if(e[o]=o in e?e[o]+1:1,e[o]>=3&&(n=!0),!r.length)break;y(r.pop())}return n}function y(r){var u=t,c=swap_color(u);if(function(r){f.push({move:r,kings:{b:n.b,w:n.w},turn:t,castling:{b:o.b,w:o.w},ep_square:i,half_moves:a,move_number:l})}(r),e[r.to]=e[r.from],e[r.from]=null,r.flags&BITS.EP_CAPTURE&&(t===BLACK?e[r.to-16]=null:e[r.to+16]=null),r.flags&BITS.PROMOTION&&(e[r.to]={type:r.promotion,color:u}),e[r.to].type===KING){if(n[e[r.to].color]=r.to,r.flags&BITS.KSIDE_CASTLE){var s=r.to-1,p=r.to+1;e[s]=e[p],e[p]=null}else r.flags&BITS.QSIDE_CASTLE&&(s=r.to+1,p=r.to-2,e[s]=e[p],e[p]=null);o[u]=""}if(o[u])for(var S=0,A=ROOKS[u].length;S<A;S++)if(r.from===ROOKS[u][S].square&&o[u]&ROOKS[u][S].flag){o[u]^=ROOKS[u][S].flag;break}if(o[c])for(S=0,A=ROOKS[c].length;S<A;S++)if(r.to===ROOKS[c][S].square&&o[c]&ROOKS[c][S].flag){o[c]^=ROOKS[c][S].flag;break}i=r.flags&BITS.BIG_PAWN?"b"===t?r.to-16:r.to+16:-1,r.piece===PAWN||r.flags&(BITS.CAPTURE|BITS.EP_CAPTURE)?a=0:a++,t===BLACK&&l++,t=swap_color(t)}function K(){var r=f.pop();if(null==r)return null;var u=r.move;n=r.kings,t=r.turn,o=r.castling,i=r.ep_square,a=r.half_moves,l=r.move_number;var c,s,p=t,S=swap_color(t);if(e[u.from]=e[u.to],e[u.from].type=u.piece,e[u.to]=null,u.flags&BITS.CAPTURE)e[u.to]={type:u.captured,color:S};else if(u.flags&BITS.EP_CAPTURE){var A;A=p===BLACK?u.to-16:u.to+16,e[A]={type:PAWN,color:S}}return u.flags&(BITS.KSIDE_CASTLE|BITS.QSIDE_CASTLE)&&(u.flags&BITS.KSIDE_CASTLE?(c=u.to+1,s=u.to-1):u.flags&BITS.QSIDE_CASTLE&&(c=u.to-2,s=u.to+1),e[c]=e[s],e[s]=null),u}function L(r,e){for(var n=stripped_san(r),t=0;t<2;t++){if(1==t){if(!e)return null;var o=!1;if(u=n.match(/([pnbrqkPNBRQK])?([a-h][1-8])x?-?([a-h][1-8])([qrbnQRBN])?/)){var i=u[1],a=u[2],l=u[3],f=u[4];1==a.length&&(o=!0)}else{var u;(u=n.match(/([pnbrqkPNBRQK])?([a-h]?[1-8]?)x?-?([a-h][1-8])([qrbnQRBN])?/))&&(i=u[1],a=u[2],l=u[3],f=u[4],1==a.length&&(o=!0))}}for(var c=infer_piece_type(n),s=b({legal:!0,piece:i||c}),p=0,S=s.length;p<S;p++)switch(t){case 0:if(n===stripped_san(d(s[p],s)))return s[p];break;case 1:if(u){if(!(i&&i.toLowerCase()!=s[p].piece||SQUARE_MAP[a]!=s[p].from||SQUARE_MAP[l]!=s[p].to||f&&f.toLowerCase()!=s[p].promotion))return s[p];if(o){var A=algebraic(s[p].from);if(!(i&&i.toLowerCase()!=s[p].piece||SQUARE_MAP[l]!=s[p].to||a!=A[0]&&a!=A[1]||f&&f.toLowerCase()!=s[p].promotion))return s[p]}}}}return null}function U(r){var e=clone(r);e.san=d(e,b({legal:!0})),e.to=algebraic(e.to),e.from=algebraic(e.from);var n="";for(var t in BITS)BITS[t]&e.flags&&(n+=FLAGS[t]);return e.flags=n,e}function Q(r){for(var e=b({legal:!1}),n=0,o=t,i=0,a=e.length;i<a;i++)y(e[i]),P(o)||(r-1>0?n+=Q(r-1):n++),K();return n}return A(void 0===r?DEFAULT_POSITION:r),{load:function(r){return A(r)},reset:function(){return S()},moves:function(r){for(var e=b(r),n=[],t=0,o=e.length;t<o;t++)void 0!==r&&"verbose"in r&&r.verbose?n.push(U(e[t])):n.push(d(e[t],b({legal:!0})));return n},in_check:function(){return m()},in_checkmate:function(){return C()},in_stalemate:function(){return O()},in_draw:function(){return a>=100||O()||N()||B()},insufficient_material:function(){return N()},in_threefold_repetition:function(){return B()},game_over:function(){return a>=100||C()||O()||N()||B()},validate_fen:function(r){return g(r)},fen:function(){return E()},board:function(){for(var r=[],n=[],t=SQUARE_MAP.a8;t<=SQUARE_MAP.h1;t++)null==e[t]?n.push(null):n.push({square:algebraic(t),type:e[t].type,color:e[t].color}),t+1&136&&(r.push(n),n=[],t+=8);return r},pgn:function(r){var e="object"==typeof r&&"string"==typeof r.newline_char?r.newline_char:"\n",n="object"==typeof r&&"number"==typeof r.max_width?r.max_width:0,t=[],o=!1;for(var i in u)t.push("["+i+' "'+u[i]+'"]'+e),o=!0;o&&f.length&&t.push(e);for(var a=function(r){var e=c[E()];return void 0!==e&&(r=`${r}${r.length>0?" ":""}{${e}}`),r},s=[];f.length>0;)s.push(K());var p=[],S="";for(0===s.length&&p.push(a(""));s.length>0;){S=a(S);var A=s.pop();if(f.length||"b"!==A.color)"w"===A.color&&(S.length&&p.push(S),S=l+".");else{const r=`${l}. ...`;S=S?`${S} ${r}`:r}S=S+" "+d(A,b({legal:!0})),y(A)}if(S.length&&p.push(a(S)),void 0!==u.Result&&p.push(u.Result),0===n)return t.join("")+p.join(" ");var g=function(){return t.length>0&&" "===t[t.length-1]&&(t.pop(),!0)},_=function(r,o){for(var i of o.split(" "))if(i){if(r+i.length>n){for(;g();)r--;t.push(e),r=0}t.push(i),r+=i.length,t.push(" "),r++}return g()&&r--,r},v=0;for(i=0;i<p.length;i++)v+p[i].length>n&&p[i].includes("{")?v=_(v,p[i]):(v+p[i].length>n&&0!==i?(" "===t[t.length-1]&&t.pop(),t.push(e),v=0):0!==i&&(t.push(" "),v++),t.push(p[i]),v+=p[i].length);return t.join("")},load_pgn:function(r,e){var n=void 0!==e&&"sloppy"in e&&e.sloppy;function t(r){return r.replace(/\\/g,"\\")}r=r.trim();var o="object"==typeof e&&"string"==typeof e.newline_char?e.newline_char:"\r?\n",i=new RegExp("^(\\[((?:"+t(o)+")|.)*\\])(?:\\s*"+t(o)+"){2}"),a=i.test(r)?i.exec(r)[1]:"";S();var l=function(r,e){for(var n="object"==typeof e&&"string"==typeof e.newline_char?e.newline_char:"\r?\n",o={},i=r.split(new RegExp(t(n))),a="",l="",f=0;f<i.length;f++){var u=/^\s*\[([A-Za-z]+)\s*"(.*)"\s*\]\s*$/;a=i[f].replace(u,"$1"),l=i[f].replace(u,"$2"),trim(a).length>0&&(o[a]=l)}return o}(a,e),f="";for(var s in l)"fen"===s.toLowerCase()&&(f=l[s]),_([s,l[s]]);if(n){if(f&&!A(f,!0))return!1}else if(!("1"!==l.SetUp||"FEN"in l&&A(l.FEN,!0)))return!1;for(var p=function(r){return`{${function(r){return Array.from(r).map((function(r){return r.charCodeAt(0)<128?r.charCodeAt(0).toString(16):encodeURIComponent(r).replace(/\%/g,"").toLowerCase()})).join("")}((r=r.replace(new RegExp(t(o),"g")," ")).slice(1,r.length-1))}}`},g=function(r){if(r.startsWith("{")&&r.endsWith("}"))return function(r){return 0==r.length?"":decodeURIComponent("%"+r.match(/.{1,2}/g).join("%"))}(r.slice(1,r.length-1))},v=r.replace(a,"").replace(new RegExp(`({[^}]*})+?|;([^${t(o)}]*)`,"g"),(function(r,e,n){return void 0!==e?p(e):" "+p(`{${n.slice(1)}}`)})).replace(new RegExp(t(o),"g")," "),h=/(\([^\(\)]+\))+?/g;h.test(v);)v=v.replace(h,"");var T=trim(v=(v=(v=v.replace(/\d+\.(\.\.)?/g,"")).replace(/\.\.\./g,"")).replace(/\$\d+/g,"")).split(new RegExp(/\s+/));T=T.join(",").replace(/,,+/g,",").split(",");for(var I="",b="",d=0;d<T.length;d++){var R=g(T[d]);if(void 0===R)if(null==(I=L(T[d],n))){if(!(TERMINATION_MARKERS.indexOf(T[d])>-1))return!1;b=T[d]}else b="",y(I);else c[E()]=R}return b&&Object.keys(u).length&&!u.Result&&_(["Result",b]),!0},header:function(){return _(arguments)},turn:function(){return t},move:function(r,e){var n=void 0!==e&&"sloppy"in e&&e.sloppy,t=null;if("string"==typeof r)t=L(r,n);else if("object"==typeof r)for(var o=b(),i=0,a=o.length;i<a;i++)if(r.from===algebraic(o[i].from)&&r.to===algebraic(o[i].to)&&(!("promotion"in o[i])||r.promotion===o[i].promotion)){t=o[i];break}if(!t)return null;var l=U(t);return y(t),l},undo:function(){var r=K();return r?U(r):null},clear:function(){return s()},put:function(r,e){return T(r,e)},get:function(r){return h(r)},ascii(){for(var r="   +------------------------+\n",n=SQUARE_MAP.a8;n<=SQUARE_MAP.h1;n++){if(0===file(n)&&(r+=" "+"87654321"[rank(n)]+" |"),null==e[n])r+=" . ";else{var t=e[n].type;r+=" "+(e[n].color===WHITE?t.toUpperCase():t.toLowerCase())+" "}n+1&136&&(r+="|\n",n+=8)}return(r+="   +------------------------+\n")+"     a  b  c  d  e  f  g  h"},remove:function(r){return function(r){var t=h(r);return e[SQUARE_MAP[r]]=null,t&&t.type===KING&&(n[t.color]=-1),v(E()),t}(r)},perft:function(r){return Q(r)},square_color:function(r){if(r in SQUARE_MAP){var e=SQUARE_MAP[r];return(rank(e)+file(e))%2==0?"light":"dark"}return null},history:function(r){for(var e=[],n=[],t=(void 0!==r&&"verbose"in r&&r.verbose);f.length>0;)e.push(K());for(;e.length>0;){var o=e.pop();t?n.push(U(o)):n.push(d(o,b({legal:!0}))),y(o)}return n},get_comment:function(){return c[E()]},set_comment:function(r){c[E()]=r.replace("{","[").replace("}","]")},delete_comment:function(){var r=c[E()];return delete c[E()],r},get_comments:function(){return p(),Object.keys(c).map((function(r){return{fen:r,comment:c[r]}}))},delete_comments:function(){return p(),Object.keys(c).map((function(r){var e=c[r];return delete c[r],{fen:r,comment:e}}))}}};(()=>{let e=window.location.hostname;if("localhost"!==e&&"chess-ai.ruochenjia.repl.co"!==e&&"chessai.whitespider.gq"!=e&&(window.location.hostname=e),"serviceWorker"in window.navigator&&"localhost"!==e&&window.navigator.serviceWorker.register("/sw.js",{scope:"/",type:"classic",updateViaCache:"all"}).catch((e=>{console.warn("Failed to register service worker",e)})),"localhost"===e){let e=Chessboard("free-board",{draggable:!0,sparePieces:!0,position:"start",dropOffBoard:"trash",onDrop:()=>{$("#fen").html(e.fen())}})}else $("#cvc-block").remove()})();

export const game = new Chess();

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


export function evaluateBoard(move, prevSum, color) {
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