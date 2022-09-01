"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function () {
    var baseUrl = (function () {
        var base = new URL(document.currentScript.src).href;
        return base.substring(0, base.lastIndexOf("/") + 1);
    })();
    function fallback(a, b) {
        if (a == null)
            return b;
        return a;
    }
    function waitForBody() {
        return new Promise(function (resolve) {
            var body = document.body;
            if (body == null) {
                document.addEventListener("DOMContentLoaded", function () {
                    resolve(document.body);
                });
            }
            resolve(body);
        });
    }
    function createFrame() {
        var frame = document.createElement("iframe");
        frame.setAttribute("type", "text/plain");
        frame.setAttribute("width", "1024");
        frame.setAttribute("height", "768");
        frame.setAttribute("style", "position:absolute;display:block;width:100%;height:100%;top:0px;left:0px;right:0px;bottom:0px;border:none;");
        frame.setAttribute("scrolling", "no");
        frame.setAttribute("loading", "eager");
        frame.setAttribute("allowfullscreen", "true");
        frame.setAttribute("allowtransparency", "true");
        frame.setAttribute("fetchpriority", "high");
        return frame;
    }
    function initButton(config, element) {
        if (config != null) {
            element.innerHTML = fallback(config.text, null);
            if (fallback(config.disabled, false))
                element.setAttribute("disabled", "true");
            else
                element.onclick = config.onclick;
        }
        else
            element.remove();
    }
    function fetchDoc(url) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch(new Request(url, {
                            method: "GET",
                            headers: {}
                        }))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            throw "Failed to fetch ".concat(url, ", status: ").concat(response.status, " ").concat(response.statusText);
                        return [4 /*yield*/, response.text()];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    var BaseDialog = /** @class */ (function () {
        function BaseDialog(cfg) {
            var _this = this;
            var config = fallback(cfg, {});
            var currentFrame = null;
            this.show = function () { return __awaiter(_this, void 0, void 0, function () {
                var frame, body, htmlDoc, win, doc, width, title, titleEl, message, messageEl, input, inputEl, customView, customViewEl;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            frame = createFrame();
                            return [4 /*yield*/, waitForBody()];
                        case 1:
                            body = _a.sent();
                            return [4 /*yield*/, fetchDoc("".concat(baseUrl, "dialog.html"))];
                        case 2:
                            htmlDoc = _a.sent();
                            htmlDoc = htmlDoc.replace("${baseURL}", baseUrl);
                            frame.setAttribute("srcdoc", htmlDoc);
                            body.style.overflow = "hidden";
                            body.appendChild(frame);
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    frame.onload = resolve;
                                })];
                        case 3:
                            _a.sent();
                            win = frame.contentWindow;
                            doc = frame.contentDocument;
                            width = config.width;
                            if (width != null)
                                doc.getElementById("dialog").style.width = config.width + "px";
                            title = fallback(config.title, "");
                            titleEl = doc.getElementById("title");
                            if (title.length > 0)
                                titleEl.innerHTML = title;
                            else
                                titleEl.remove();
                            message = fallback(config.message, "");
                            messageEl = doc.getElementById("message");
                            if (message.length > 0)
                                messageEl.innerHTML = message;
                            else
                                messageEl.remove();
                            input = config.input;
                            inputEl = doc.getElementById("input");
                            if (input != null) {
                                inputEl.type = fallback(input.type, "text");
                                inputEl.placeholder = fallback(input.placeholder, "");
                                inputEl.value = fallback(input.value, "");
                                this.inputElement = inputEl;
                            }
                            else
                                inputEl.remove();
                            customView = config.customView;
                            customViewEl = doc.getElementById("custom-view");
                            if (customView != null) {
                                customViewEl.innerHTML = customView;
                                this.viewElement = customViewEl;
                            }
                            else
                                customViewEl.remove();
                            initButton(config.positiveButton, doc.getElementById("positive-button"));
                            initButton(config.negativeButton, doc.getElementById("negative-button"));
                            initButton(config.neutralButton, doc.getElementById("neutral-button"));
                            currentFrame = frame;
                            return [2 /*return*/];
                    }
                });
            }); };
            this.close = this.dismiss = this.cancel = function () {
                if (currentFrame != null) {
                    // unlock scrolling
                    document.body.style.overflow = "";
                    currentFrame.remove();
                    currentFrame = null;
                }
            };
        }
        return BaseDialog;
    }());
    var Dialog = /** @class */ (function (_super) {
        __extends(Dialog, _super);
        function Dialog(config) {
            return _super.call(this, config) || this;
        }
        return Dialog;
    }(BaseDialog));
    var alert = function (message, title) {
        var dialog = new Dialog({
            message: message,
            title: title,
            positiveButton: {
                text: "OK",
                onclick: function () { return dialog.dismiss(); }
            }
        });
        dialog.show();
    };
    var confirm = function (message, title) {
        return new Promise(function (resolve) {
            var dialog = new Dialog({
                message: message,
                title: title,
                positiveButton: {
                    text: "OK",
                    onclick: function () {
                        resolve(true);
                        dialog.dismiss();
                    }
                },
                negativeButton: {
                    text: "Cancel",
                    onclick: function () {
                        resolve(false);
                        dialog.cancel();
                    }
                }
            });
            dialog.show();
        });
    };
    var prompt = function (message, defaultValue, title) {
        return new Promise(function (resolve) {
            var dialog = new Dialog({
                message: message,
                title: title,
                input: {
                    type: "text",
                    placeholder: defaultValue,
                    value: defaultValue
                },
                positiveButton: {
                    text: "OK",
                    onclick: function () {
                        resolve(dialog.inputElement.value);
                        dialog.dismiss();
                    }
                },
                negativeButton: {
                    text: "Cancel",
                    onclick: function () {
                        resolve(null);
                        dialog.cancel();
                    }
                }
            });
            dialog.show().then(function () {
                dialog.inputElement.onkeydown = function (e) {
                    if (e.keyCode == 13) { // enter
                        e.preventDefault();
                        resolve(e.target.value);
                        dialog.dismiss();
                    }
                };
            });
        });
    };
    var webAlert = {
        Dialog: Dialog,
        alert: alert,
        confirm: confirm,
        prompt: prompt
    };
    var win = window;
    win.nativeAlert = window.alert;
    win.nativeConfirm = window.confirm;
    win.nativePrompt = window.prompt;
    win.alert = alert;
    win.confirm = confirm;
    win.prompt = prompt;
    win.webAlert = webAlert;
})();
