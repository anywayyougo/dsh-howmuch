window.__ModuleLoader__.load({ id: "dsh-howmuch", factory: (require) => { const module = { exports: {} }; const exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_jsx_runtime = require("react/jsx-runtime");
// src/client/index.tsx
const NS = "dsh-howmuch";
const POLL_INTERVAL_MS = 6e4;
const DEFAULT_APPEARANCE = {
	fontSize: 14,
	fontWeight: "normal",
	textColor: "#FFFFFF",
	enableShadow: true
};
const DEFAULT_DISPLAY = {
	showName: true,
	showTotal: true,
	showTooltip: true
};
const EMPTY_BALANCE = {
	status: "loading",
	currency: "CNY",
	toppedUp: 0,
	granted: 0,
	total: 0
};
const FALLBACK_VERSION = "0.2.1-rc.5";
const DEFAULT_ANCHOR = "bottom-right";
const DEFAULT_OFFSET_X = 12;
const DEFAULT_OFFSET_Y = 12;
const MIN_MARGIN = 4;
const TOOLTIP_GAP = 8;
const TOOLTIP_MARGIN = 8;
const ANCHOR_LABELS = {
	"top-left": "左上角",
	"top-right": "右上角",
	"bottom-left": "左下角",
	"bottom-right": "右下角"
};
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizeAnchor(value) {
	return value === "top-left" || value === "top-right" || value === "bottom-left" || value === "bottom-right" ? value : void 0;
}
function finiteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function normalizeConfig(snapshot) {
	const value = isRecord(snapshot?.value) ? snapshot.value : {};
	const appearance = isRecord(value.appearance) ? value.appearance : {};
	const display = isRecord(value.display) ? value.display : {};
	const position = isRecord(value.position) ? value.position : {};
	return {
		status: typeof snapshot?.status === "string" ? snapshot.status : "loading",
		writable: snapshot?.writable === true,
		appearance: {
			fontSize: typeof appearance.fontSize === "number" && Number.isFinite(appearance.fontSize) ? appearance.fontSize : DEFAULT_APPEARANCE.fontSize,
			fontWeight: appearance.fontWeight === "bold" ? "bold" : "normal",
			textColor: typeof appearance.textColor === "string" && appearance.textColor !== "" ? appearance.textColor : DEFAULT_APPEARANCE.textColor,
			enableShadow: typeof appearance.enableShadow === "boolean" ? appearance.enableShadow : DEFAULT_APPEARANCE.enableShadow
		},
		display: {
			showName: typeof display.showName === "boolean" ? display.showName : DEFAULT_DISPLAY.showName,
			showTotal: typeof display.showTotal === "boolean" ? display.showTotal : DEFAULT_DISPLAY.showTotal,
			showTooltip: typeof display.showTooltip === "boolean" ? display.showTooltip : DEFAULT_DISPLAY.showTooltip
		},
		position: {
			anchor: normalizeAnchor(position.anchor),
			offsetX: finiteNumber(position.offsetX),
			offsetY: finiteNumber(position.offsetY),
			posX: finiteNumber(position.posX),
			posY: finiteNumber(position.posY)
		}
	};
}
function useConfig(form) {
	const [snapshot, setSnapshot] = (0, react.useState)(() => form.getSnapshot());
	(0, react.useEffect)(() => form.subscribe(() => setSnapshot(() => form.getSnapshot())), [form]);
	return (0, react.useMemo)(() => normalizeConfig(snapshot), [snapshot]);
}
function walletCurrency(wallet) {
	return typeof wallet?.currency === "string" && wallet.currency.toUpperCase() === "USD" ? "USD" : "CNY";
}
function walletAmount(wallet) {
	const value = typeof wallet?.balance === "number" ? wallet.balance : Number.parseFloat(String(wallet?.balance ?? ""));
	return Number.isFinite(value) ? value : 0;
}
function parseBalance(result) {
	if (result?.ok !== true) return void 0;
	const value = result.value;
	if (!isRecord(value) || value.status !== "ready") return void 0;
	const purchased = Array.isArray(value.value) ? value.value : [];
	const bonuses = Array.isArray(value.bonusWallets) ? value.bonusWallets : [];
	const all = [...purchased, ...bonuses];
	const currency = all.length === 0 || all.some((wallet) => walletCurrency(wallet) === "CNY") ? "CNY" : "USD";
	const sum = (wallets) => wallets.reduce((total, wallet) => walletCurrency(wallet) === currency ? total + walletAmount(wallet) : total, 0);
	const toppedUp = sum(purchased);
	const granted = sum(bonuses);
	return {
		status: "ready",
		currency,
		toppedUp,
		granted,
		total: toppedUp + granted
	};
}
function getAccount(ctx) {
	try {
		const account = ctx.get("remote.account");
		return account !== void 0 && typeof account.getBalance === "function" ? account : void 0;
	} catch {
		return;
	}
}
function clientMetadata(ctx) {
	let locale = "zh";
	try {
		const active = ctx.get("locale")?.getSnapshot?.().active;
		if (typeof active === "string" && active !== "") locale = active;
	} catch {}
	const release = globalThis.__DSH_BOOT__?.release;
	return {
		version: typeof release?.version === "string" && release.version !== "" ? release.version : FALLBACK_VERSION,
		locale,
		timezoneOffsetSeconds: -(/* @__PURE__ */ new Date()).getTimezoneOffset() * 60
	};
}
function useBalance(ctx) {
	const [balance, setBalance] = (0, react.useState)(EMPTY_BALANCE);
	(0, react.useEffect)(() => {
		let alive = true;
		let inflight = false;
		const load = async () => {
			if (inflight) return;
			inflight = true;
			try {
				const account = getAccount(ctx);
				if (account === void 0) {
					if (alive) setBalance((current) => ({
						...current,
						status: "unavailable"
					}));
					return;
				}
				const next = parseBalance(await account.getBalance(clientMetadata(ctx)));
				if (alive) setBalance(next ?? {
					...EMPTY_BALANCE,
					status: "unavailable"
				});
			} catch (error) {
				console.error("dsh-howmuch: balance read failed", error);
				if (alive) setBalance((current) => ({
					...current,
					status: "unavailable"
				}));
			} finally {
				inflight = false;
			}
		};
		load();
		const timer = setInterval(() => {
			load();
		}, POLL_INTERVAL_MS);
		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, [ctx]);
	return balance;
}
function clampPoint(point, viewport, width, height) {
	const maxX = Math.max(MIN_MARGIN, viewport.width - width - MIN_MARGIN);
	const maxY = Math.max(MIN_MARGIN, viewport.height - height - MIN_MARGIN);
	return {
		x: Math.min(Math.max(MIN_MARGIN, point.x), maxX),
		y: Math.min(Math.max(MIN_MARGIN, point.y), maxY)
	};
}
function round1(value) {
	return Math.round(value * 10) / 10;
}
function anchorToPoint(anchor, offsetX, offsetY, viewport, box) {
	const left = anchor.endsWith("left");
	const top = anchor.startsWith("top");
	return {
		x: left ? offsetX : viewport.width - box.width - offsetX,
		y: top ? offsetY : viewport.height - box.height - offsetY
	};
}
function anchorOffsets(anchor, point, viewport, box) {
	const left = anchor.endsWith("left");
	const top = anchor.startsWith("top");
	return {
		offsetX: round1(Math.max(MIN_MARGIN, left ? point.x : viewport.width - point.x - box.width)),
		offsetY: round1(Math.max(MIN_MARGIN, top ? point.y : viewport.height - point.y - box.height))
	};
}
function nearestAnchor(point, viewport, box) {
	const centerX = point.x + box.width / 2;
	const anchor = `${point.y + box.height / 2 < viewport.height / 2 ? "top" : "bottom"}-${centerX < viewport.width / 2 ? "left" : "right"}`;
	return {
		anchor,
		...anchorOffsets(anchor, point, viewport, box)
	};
}
function legacyAnchor(position, viewport, box) {
	if (position.posX === void 0 || position.posY === void 0) return void 0;
	return nearestAnchor(clampPoint({
		x: position.posX,
		y: position.posY
	}, viewport, box.width, box.height), viewport, box);
}
function tooltipPoint(point, box, tooltip, viewport) {
	const above = point.y - TOOLTIP_GAP - tooltip.height;
	const below = point.y + box.height + TOOLTIP_GAP;
	let y;
	if (above >= TOOLTIP_MARGIN) y = above;
	else if (below + tooltip.height <= viewport.height - TOOLTIP_MARGIN) y = below;
	else y = Math.max(TOOLTIP_MARGIN, viewport.height - TOOLTIP_MARGIN - tooltip.height);
	let x = point.x;
	if (x + tooltip.width > viewport.width - TOOLTIP_MARGIN) x = viewport.width - TOOLTIP_MARGIN - tooltip.width;
	x = Math.max(TOOLTIP_MARGIN, x);
	return {
		x,
		y
	};
}
function currencySymbol(currency) {
	return currency === "USD" ? "$" : "¥";
}
function BalanceOverlay({ ctx, form }) {
	const config = useConfig(form);
	const balance = useBalance(ctx);
	const [dragPoint, setDragPoint] = (0, react.useState)(void 0);
	const [dragging, setDragging] = (0, react.useState)(false);
	const [hovered, setHovered] = (0, react.useState)(false);
	const [viewport, setViewport] = (0, react.useState)(() => ({
		width: window.innerWidth,
		height: window.innerHeight
	}));
	const [boxSize, setBoxSize] = (0, react.useState)({
		width: 0,
		height: 0
	});
	const [tooltipSize, setTooltipSize] = (0, react.useState)({
		width: 0,
		height: 0
	});
	const wrapperRef = (0, react.useRef)(null);
	const tooltipRef = (0, react.useRef)(null);
	const dragRef = (0, react.useRef)(void 0);
	const legacyRef = (0, react.useRef)(void 0);
	const legacyKeyRef = (0, react.useRef)(void 0);
	(0, react.useLayoutEffect)(() => {
		const element = wrapperRef.current;
		if (element === null) return;
		const measure = () => {
			const rect = element.getBoundingClientRect();
			setBoxSize((current) => current.width === rect.width && current.height === rect.height ? current : {
				width: rect.width,
				height: rect.height
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	(0, react.useLayoutEffect)(() => {
		const element = tooltipRef.current;
		if (element === null) return;
		const measure = () => {
			const rect = element.getBoundingClientRect();
			setTooltipSize((current) => current.width === rect.width && current.height === rect.height ? current : {
				width: rect.width,
				height: rect.height
			});
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [config.display.showTooltip]);
	(0, react.useEffect)(() => {
		let frame = 0;
		const update = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				setViewport((current) => {
					const next = {
						width: window.innerWidth,
						height: window.innerHeight
					};
					return current.width === next.width && current.height === next.height ? current : next;
				});
			});
		};
		window.addEventListener("resize", update);
		window.visualViewport?.addEventListener("resize", update);
		document.addEventListener("fullscreenchange", update);
		const observer = new ResizeObserver(update);
		observer.observe(document.documentElement);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", update);
			window.visualViewport?.removeEventListener("resize", update);
			document.removeEventListener("fullscreenchange", update);
			observer.disconnect();
		};
	}, []);
	const legacyKey = config.position.posX !== void 0 && config.position.posY !== void 0 ? `${config.position.posX}:${config.position.posY}` : void 0;
	if (legacyKey !== void 0 && boxSize.width > 0 && legacyKeyRef.current !== legacyKey) {
		legacyKeyRef.current = legacyKey;
		legacyRef.current = legacyAnchor(config.position, viewport, boxSize);
	} else if (legacyKey === void 0) {
		legacyKeyRef.current = void 0;
		legacyRef.current = void 0;
	}
	const point = clampPoint(dragPoint ?? (legacyRef.current !== void 0 ? anchorToPoint(legacyRef.current.anchor, legacyRef.current.offsetX, legacyRef.current.offsetY, viewport, boxSize) : anchorToPoint(config.position.anchor ?? DEFAULT_ANCHOR, config.position.offsetX ?? DEFAULT_OFFSET_X, config.position.offsetY ?? DEFAULT_OFFSET_Y, viewport, boxSize)), viewport, boxSize.width, boxSize.height);
	const savePosition = async (next) => {
		try {
			if (!await form.mutate([{
				op: "set",
				path: ["position"],
				value: next
			}])) throw new Error("宿主拒绝了位置写入");
		} catch (error) {
			console.error("dsh-howmuch: position save failed", error);
		} finally {
			setDragPoint(void 0);
		}
	};
	const handlePointerDown = (event) => {
		if (event.button !== 0) return;
		dragRef.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originX: point.x,
			originY: point.y,
			moved: false
		};
		setDragging(true);
		setHovered(false);
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const handlePointerMove = (event) => {
		const drag = dragRef.current;
		if (drag === void 0) return;
		const dx = event.clientX - drag.startX;
		const dy = event.clientY - drag.startY;
		if (!drag.moved && Math.abs(dx) + Math.abs(dy) <= 3) return;
		drag.moved = true;
		setDragPoint(clampPoint({
			x: drag.originX + dx,
			y: drag.originY + dy
		}, viewport, boxSize.width, boxSize.height));
	};
	const handlePointerUp = (event) => {
		const drag = dragRef.current;
		if (drag === void 0) return;
		dragRef.current = void 0;
		setDragging(false);
		if (event.currentTarget.hasPointerCapture(drag.pointerId)) event.currentTarget.releasePointerCapture(drag.pointerId);
		if (!drag.moved) {
			setDragPoint(void 0);
			return;
		}
		const next = clampPoint({
			x: drag.originX + (event.clientX - drag.startX),
			y: drag.originY + (event.clientY - drag.startY)
		}, viewport, boxSize.width, boxSize.height);
		setDragPoint(next);
		savePosition(nearestAnchor(next, viewport, boxSize));
	};
	const handlePointerCancel = () => {
		dragRef.current = void 0;
		setDragging(false);
		setDragPoint(void 0);
	};
	const handleEnter = () => {
		setHovered(true);
	};
	const symbol = currencySymbol(balance.currency);
	const parts = [config.display.showName ? "DeepSeek" : "", config.display.showTotal ? balance.status === "ready" ? `${symbol}${balance.total.toFixed(2)}` : "--" : ""].filter((part) => part !== "");
	const text = parts.length > 0 ? parts.join(" · ") : balance.status === "ready" ? symbol : "--";
	const containerStyle = {
		position: "fixed",
		left: `${point.x}px`,
		top: `${point.y}px`,
		display: "inline-block",
		cursor: dragging ? "grabbing" : "grab",
		userSelect: "none",
		touchAction: "none",
		fontFamily: "system-ui, -apple-system, \"Segoe UI\", \"Microsoft YaHei\", sans-serif",
		zIndex: 1
	};
	const textStyle = {
		fontSize: `${config.appearance.fontSize}px`,
		fontWeight: config.appearance.fontWeight === "bold" ? 700 : 400,
		color: config.appearance.textColor,
		whiteSpace: "nowrap",
		lineHeight: 1.4,
		textShadow: config.appearance.enableShadow ? "0 1px 3px rgba(0, 0, 0, 0.8)" : "none"
	};
	const tip = tooltipPoint(point, boxSize, tooltipSize, viewport);
	const tooltipStyle = {
		position: "fixed",
		left: `${tip.x}px`,
		top: `${tip.y}px`,
		padding: "8px 12px",
		borderRadius: 8,
		border: "1px solid rgba(255, 255, 255, 0.08)",
		background: "rgba(24, 24, 28, 0.96)",
		boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
		color: "#FFFFFF",
		fontSize: 12,
		lineHeight: 1.5,
		whiteSpace: "nowrap",
		pointerEvents: "none",
		opacity: hovered && !dragging ? 1 : 0,
		transition: "opacity 120ms ease"
	};
	const muted = { color: "#9CA3AF" };
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		ref: wrapperRef,
		style: containerStyle,
		onPointerDown: handlePointerDown,
		onPointerMove: handlePointerMove,
		onPointerUp: handlePointerUp,
		onPointerCancel: handlePointerCancel,
		onMouseEnter: handleEnter,
		onMouseLeave: () => setHovered(false),
		title: config.display.showTooltip ? void 0 : "拖动可调整位置",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
			style: textStyle,
			children: text
		}), config.display.showTooltip && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			ref: tooltipRef,
			style: tooltipStyle,
			"aria-hidden": !hovered || dragging,
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: { fontWeight: 600 },
				children: "DeepSeek 账户余额"
			}), balance.status === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [
				"充值 ",
				symbol,
				balance.toppedUp.toFixed(2),
				" · 赠送 ",
				symbol,
				balance.granted.toFixed(2)
			] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: muted,
				children: [
					"合计 ",
					symbol,
					balance.total.toFixed(2),
					" · 每 60 秒自动刷新"
				]
			})] }) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: muted,
				children: "余额暂不可用，请检查账号登录状态"
			})]
		})]
	});
}
const CARD = {
	border: "1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.25)))",
	borderRadius: 12,
	background: "var(--dsw-alias-bg-layer-3, transparent)",
	padding: "12px 14px",
	display: "flex",
	flexDirection: "column",
	gap: 10
};
const ROW = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 12,
	minHeight: 28
};
const TITLE = {
	fontSize: 13,
	fontWeight: 600,
	color: "var(--dsw-alias-label-primary, inherit)"
};
const LABEL = {
	fontSize: 13,
	color: "var(--dsw-alias-label-secondary, inherit)"
};
const HINT = {
	fontSize: 12,
	color: "var(--dsw-alias-label-tertiary, rgba(160, 160, 160, 0.9))"
};
const INPUT = {
	width: 72,
	padding: "4px 8px",
	borderRadius: 6,
	border: "1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35))",
	background: "var(--dsw-alias-bg-layer-2, transparent)",
	color: "inherit",
	fontSize: 13
};
const BUTTON = {
	padding: "5px 12px",
	borderRadius: 6,
	border: "1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35))",
	background: "var(--dsw-alias-bg-layer-2, transparent)",
	color: "inherit",
	fontSize: 13,
	cursor: "pointer"
};
const ERROR = {
	fontSize: 12,
	color: "var(--dsw-alias-label-error, #E5484D)"
};
function SettingsSection(props) {
	const form = props.form;
	const config = useConfig(form);
	const [error, setError] = (0, react.useState)(void 0);
	const [fontSizeDraft, setFontSizeDraft] = (0, react.useState)(void 0);
	const [colorDraft, setColorDraft] = (0, react.useState)(void 0);
	const disabled = !config.writable || config.status !== "ready";
	const write = async (path, value) => {
		setError(void 0);
		try {
			if (!await form.mutate([{
				op: "set",
				path,
				value
			}])) throw new Error("宿主拒绝了本次写入");
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : String(cause));
		}
	};
	if (config.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
		style: HINT,
		children: "此插件尚未激活，配置暂不可用。"
	});
	const fontSizeText = fontSizeDraft ?? String(config.appearance.fontSize);
	const commitFontSize = () => {
		const parsed = Number.parseInt(fontSizeText, 10);
		setFontSizeDraft(void 0);
		if (!Number.isFinite(parsed)) return;
		const next = Math.min(48, Math.max(8, parsed));
		if (next !== config.appearance.fontSize) write(["appearance", "fontSize"], next);
	};
	const colorValue = /^#[0-9a-fA-F]{6}$/.test(colorDraft ?? "") ? colorDraft : config.appearance.textColor;
	const position = config.position;
	const legacyPosition = position.posX !== void 0 && position.posY !== void 0 ? position : void 0;
	const anchor = position.anchor ?? DEFAULT_ANCHOR;
	const offsetX = position.offsetX ?? DEFAULT_OFFSET_X;
	const offsetY = position.offsetY ?? DEFAULT_OFFSET_Y;
	const horizontalEdge = anchor.endsWith("left") ? "距左" : "距右";
	const verticalEdge = anchor.startsWith("top") ? "距上" : "距下";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		style: {
			display: "flex",
			flexDirection: "column",
			gap: 14,
			maxWidth: 760
		},
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 4
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: TITLE,
					children: "余额悬浮框"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: HINT,
					children: "悬浮框会跟随窗口缩放与全屏变化，始终保持在所锚定的角落。拖动即可调整位置。"
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				style: CARD,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: TITLE,
						children: "外观"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "字体大小"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 6
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "number",
								min: 8,
								max: 48,
								step: 1,
								style: INPUT,
								value: fontSizeText,
								disabled,
								onChange: (event) => setFontSizeDraft(event.target.value),
								onBlur: commitFontSize,
								onKeyDown: (event) => {
									if (event.key === "Enter") commitFontSize();
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: HINT,
								children: "px"
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "字体形态"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
							style: {
								...INPUT,
								width: 120
							},
							value: config.appearance.fontWeight,
							disabled,
							onChange: (event) => void write(["appearance", "fontWeight"], event.target.value),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "normal",
								children: "常规"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
								value: "bold",
								children: "粗体"
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "文字颜色"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: 8
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "color",
								value: colorValue,
								disabled,
								style: {
									width: 32,
									height: 26,
									padding: 0,
									border: "none",
									background: "transparent"
								},
								onChange: (event) => setColorDraft(event.target.value),
								onBlur: () => {
									const next = colorDraft;
									setColorDraft(void 0);
									if (next !== void 0 && next.toUpperCase() !== config.appearance.textColor.toUpperCase()) write(["appearance", "textColor"], next.toUpperCase());
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: HINT,
								children: config.appearance.textColor.toUpperCase()
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "开启微弱阴影"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: config.appearance.enableShadow,
							disabled,
							onChange: (event) => void write(["appearance", "enableShadow"], event.target.checked)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				style: CARD,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: TITLE,
						children: "显示内容"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "显示名称"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: config.display.showName,
							disabled,
							onChange: (event) => void write(["display", "showName"], event.target.checked)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "显示总余额"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: config.display.showTotal,
							disabled,
							onChange: (event) => void write(["display", "showTotal"], event.target.checked)
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "悬停显示详情"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: config.display.showTooltip,
							disabled,
							onChange: (event) => void write(["display", "showTooltip"], event.target.checked)
						})]
					}),
					!config.display.showName && !config.display.showTotal && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: HINT,
						children: "名称与余额都隐藏时，悬浮框仅显示货币符号作为拖拽锚点。"
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				style: CARD,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: TITLE,
						children: "位置"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: LABEL,
							children: "当前位置"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: HINT,
							children: legacyPosition !== void 0 ? `旧版坐标 X ${round1(legacyPosition.posX)} · Y ${round1(legacyPosition.posY)}（拖动一次后自动迁移）` : `锚定${ANCHOR_LABELS[anchor]} · ${horizontalEdge} ${round1(offsetX)}px · ${verticalEdge} ${round1(offsetY)}px`
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: ROW,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: HINT,
							children: "拖动后松开鼠标自动保存；窗口大小变化时会保持相对位置。"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							style: BUTTON,
							disabled,
							onClick: () => void write(["position"], {
								anchor: DEFAULT_ANCHOR,
								offsetX: DEFAULT_OFFSET_X,
								offsetY: DEFAULT_OFFSET_Y
							}),
							children: "重置位置"
						})]
					})
				]
			}),
			error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				style: ERROR,
				children: error
			})
		]
	});
}
const inject = ["slots", "configForms"];
function apply(ctx) {
	const form = ctx.configForms.get(NS);
	ctx.slots.inject("shell.overlay", () => ctx.slots.register({
		name: "shell.overlay",
		id: NS,
		order: 100
	}, () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(BalanceOverlay, {
		ctx,
		form
	})));
	ctx.slots.inject("settings.section", () => ctx.slots.register({
		name: "settings.section",
		id: NS,
		order: 200,
		label: "余额悬浮框",
		inject: () => ({ form })
	}, SettingsSection));
}
exports.apply = apply;
exports.inject = inject;

return module.exports; } });