import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

const NS = 'dsh-howmuch'
const POLL_INTERVAL_MS = 60_000

type Currency = 'CNY' | 'USD'
type FontWeight = 'normal' | 'bold'
type BalanceStatus = 'loading' | 'ready' | 'unavailable'
type Anchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface AppearanceConfig {
  fontSize: number
  fontWeight: FontWeight
  textColor: string
  enableShadow: boolean
}

interface DisplayConfig {
  showName: boolean
  showTotal: boolean
  showTooltip: boolean
}

interface PositionConfig {
  anchor?: Anchor
  offsetX?: number
  offsetY?: number
  posX?: number
  posY?: number
}

interface AnchorPlacement {
  anchor: Anchor
  offsetX: number
  offsetY: number
}

interface Viewport {
  width: number
  height: number
}

interface BoxSize {
  width: number
  height: number
}

interface PluginConfig {
  status: string
  writable: boolean
  appearance: AppearanceConfig
  display: DisplayConfig
  position: PositionConfig
}

interface BalanceState {
  status: BalanceStatus
  currency: Currency
  toppedUp: number
  granted: number
  total: number
}

interface Point {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

const DEFAULT_APPEARANCE: AppearanceConfig = {
  fontSize: 14,
  fontWeight: 'normal',
  textColor: '#FFFFFF',
  enableShadow: true,
}

const DEFAULT_DISPLAY: DisplayConfig = {
  showName: true,
  showTotal: true,
  showTooltip: true,
}

const EMPTY_BALANCE: BalanceState = {
  status: 'loading',
  currency: 'CNY',
  toppedUp: 0,
  granted: 0,
  total: 0,
}

const FALLBACK_VERSION = '0.2.1-rc.5'

const DEFAULT_ANCHOR: Anchor = 'bottom-right'
const DEFAULT_OFFSET_X = 12
const DEFAULT_OFFSET_Y = 12
const MIN_MARGIN = 4
const TOOLTIP_GAP = 8
const TOOLTIP_MARGIN = 8

const ANCHOR_LABELS: Record<Anchor, string> = {
  'top-left': '左上角',
  'top-right': '右上角',
  'bottom-left': '左下角',
  'bottom-right': '右下角',
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeAnchor(value: unknown): Anchor | undefined {
  return value === 'top-left' ||
    value === 'top-right' ||
    value === 'bottom-left' ||
    value === 'bottom-right'
    ? value
    : undefined
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeConfig(snapshot: any): PluginConfig {
  const value = isRecord(snapshot?.value) ? snapshot.value : {}
  const appearance = isRecord(value.appearance) ? value.appearance : {}
  const display = isRecord(value.display) ? value.display : {}
  const position = isRecord(value.position) ? value.position : {}
  return {
    status: typeof snapshot?.status === 'string' ? snapshot.status : 'loading',
    writable: snapshot?.writable === true,
    appearance: {
      fontSize:
        typeof appearance.fontSize === 'number' && Number.isFinite(appearance.fontSize)
          ? appearance.fontSize
          : DEFAULT_APPEARANCE.fontSize,
      fontWeight: appearance.fontWeight === 'bold' ? 'bold' : 'normal',
      textColor:
        typeof appearance.textColor === 'string' && appearance.textColor !== ''
          ? appearance.textColor
          : DEFAULT_APPEARANCE.textColor,
      enableShadow:
        typeof appearance.enableShadow === 'boolean'
          ? appearance.enableShadow
          : DEFAULT_APPEARANCE.enableShadow,
    },
    display: {
      showName:
        typeof display.showName === 'boolean' ? display.showName : DEFAULT_DISPLAY.showName,
      showTotal:
        typeof display.showTotal === 'boolean' ? display.showTotal : DEFAULT_DISPLAY.showTotal,
      showTooltip:
        typeof display.showTooltip === 'boolean'
          ? display.showTooltip
          : DEFAULT_DISPLAY.showTooltip,
    },
    position: {
      anchor: normalizeAnchor(position.anchor),
      offsetX: finiteNumber(position.offsetX),
      offsetY: finiteNumber(position.offsetY),
      posX: finiteNumber(position.posX),
      posY: finiteNumber(position.posY),
    },
  }
}

function useConfig(form: any): PluginConfig {
  const [snapshot, setSnapshot] = useState(() => form.getSnapshot())
  useEffect(() => form.subscribe(() => setSnapshot(() => form.getSnapshot())), [form])
  return useMemo(() => normalizeConfig(snapshot), [snapshot])
}

function walletCurrency(wallet: any): Currency {
  return typeof wallet?.currency === 'string' && wallet.currency.toUpperCase() === 'USD'
    ? 'USD'
    : 'CNY'
}

function walletAmount(wallet: any): number {
  const value =
    typeof wallet?.balance === 'number'
      ? wallet.balance
      : Number.parseFloat(String(wallet?.balance ?? ''))
  return Number.isFinite(value) ? value : 0
}

function parseBalance(result: any): BalanceState | undefined {
  if (result?.ok !== true) return undefined
  const value = result.value
  if (!isRecord(value) || value.status !== 'ready') return undefined
  const purchased: any[] = Array.isArray(value.value) ? value.value : []
  const bonuses: any[] = Array.isArray(value.bonusWallets) ? value.bonusWallets : []
  const all = [...purchased, ...bonuses]
  const currency: Currency =
    all.length === 0 || all.some((wallet) => walletCurrency(wallet) === 'CNY') ? 'CNY' : 'USD'
  const sum = (wallets: any[]) =>
    wallets.reduce(
      (total, wallet) => (walletCurrency(wallet) === currency ? total + walletAmount(wallet) : total),
      0,
    )
  const toppedUp = sum(purchased)
  const granted = sum(bonuses)
  return { status: 'ready', currency, toppedUp, granted, total: toppedUp + granted }
}

function getAccount(ctx: any): any {
  try {
    const account = ctx.get('remote.account')
    return account !== undefined && typeof account.getBalance === 'function' ? account : undefined
  } catch {
    return undefined
  }
}

function clientMetadata(ctx: any) {
  let locale = 'zh'
  try {
    const active = ctx.get('locale')?.getSnapshot?.().active
    if (typeof active === 'string' && active !== '') locale = active
  } catch {
    // locale is optional
  }
  const release = (globalThis as any).__DSH_BOOT__?.release
  const version =
    typeof release?.version === 'string' && release.version !== '' ? release.version : FALLBACK_VERSION
  return {
    version,
    locale,
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
  }
}

function useBalance(ctx: any): BalanceState {
  const [balance, setBalance] = useState<BalanceState>(EMPTY_BALANCE)

  useEffect(() => {
    let alive = true
    let inflight = false

    const load = async () => {
      if (inflight) return
      inflight = true
      try {
        const account = getAccount(ctx)
        if (account === undefined) {
          if (alive) setBalance((current) => ({ ...current, status: 'unavailable' }))
          return
        }
        const next = parseBalance(await account.getBalance(clientMetadata(ctx)))
        if (alive) setBalance(next ?? { ...EMPTY_BALANCE, status: 'unavailable' })
      } catch (error) {
        console.error('dsh-howmuch: balance read failed', error)
        if (alive) setBalance((current) => ({ ...current, status: 'unavailable' }))
      } finally {
        inflight = false
      }
    }

    void load()
    const timer = setInterval(() => {
      void load()
    }, POLL_INTERVAL_MS)

    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [ctx])

  return balance
}

function clampPoint(point: Point, viewport: Viewport, width: number, height: number): Point {
  const maxX = Math.max(MIN_MARGIN, viewport.width - width - MIN_MARGIN)
  const maxY = Math.max(MIN_MARGIN, viewport.height - height - MIN_MARGIN)
  return {
    x: Math.min(Math.max(MIN_MARGIN, point.x), maxX),
    y: Math.min(Math.max(MIN_MARGIN, point.y), maxY),
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function anchorToPoint(
  anchor: Anchor,
  offsetX: number,
  offsetY: number,
  viewport: Viewport,
  box: BoxSize,
): Point {
  const left = anchor.endsWith('left')
  const top = anchor.startsWith('top')
  return {
    x: left ? offsetX : viewport.width - box.width - offsetX,
    y: top ? offsetY : viewport.height - box.height - offsetY,
  }
}

function anchorOffsets(
  anchor: Anchor,
  point: Point,
  viewport: Viewport,
  box: BoxSize,
): { offsetX: number; offsetY: number } {
  const left = anchor.endsWith('left')
  const top = anchor.startsWith('top')
  return {
    offsetX: round1(Math.max(MIN_MARGIN, left ? point.x : viewport.width - point.x - box.width)),
    offsetY: round1(
      Math.max(MIN_MARGIN, top ? point.y : viewport.height - point.y - box.height),
    ),
  }
}

function nearestAnchor(point: Point, viewport: Viewport, box: BoxSize): AnchorPlacement {
  const centerX = point.x + box.width / 2
  const centerY = point.y + box.height / 2
  const anchor: Anchor = `${centerY < viewport.height / 2 ? 'top' : 'bottom'}-${
    centerX < viewport.width / 2 ? 'left' : 'right'
  }` as Anchor
  return { anchor, ...anchorOffsets(anchor, point, viewport, box) }
}

function legacyAnchor(
  position: PositionConfig,
  viewport: Viewport,
  box: BoxSize,
): AnchorPlacement | undefined {
  if (position.posX === undefined || position.posY === undefined) return undefined
  const point = clampPoint({ x: position.posX, y: position.posY }, viewport, box.width, box.height)
  return nearestAnchor(point, viewport, box)
}

function tooltipPoint(
  point: Point,
  box: BoxSize,
  tooltip: BoxSize,
  viewport: Viewport,
): Point {
  const above = point.y - TOOLTIP_GAP - tooltip.height
  const below = point.y + box.height + TOOLTIP_GAP
  let y: number
  if (above >= TOOLTIP_MARGIN) y = above
  else if (below + tooltip.height <= viewport.height - TOOLTIP_MARGIN) y = below
  else y = Math.max(TOOLTIP_MARGIN, viewport.height - TOOLTIP_MARGIN - tooltip.height)

  let x = point.x
  if (x + tooltip.width > viewport.width - TOOLTIP_MARGIN) {
    x = viewport.width - TOOLTIP_MARGIN - tooltip.width
  }
  x = Math.max(TOOLTIP_MARGIN, x)
  return { x, y }
}

function currencySymbol(currency: Currency): string {
  return currency === 'USD' ? '$' : '¥'
}

function BalanceOverlay({ ctx, form }: { ctx: any; form: any }) {
  const config = useConfig(form)
  const balance = useBalance(ctx)
  const [dragPoint, setDragPoint] = useState<Point | undefined>(undefined)
  const [dragging, setDragging] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [viewport, setViewport] = useState<Viewport>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const [boxSize, setBoxSize] = useState<BoxSize>({ width: 0, height: 0 })
  const [tooltipSize, setTooltipSize] = useState<BoxSize>({ width: 0, height: 0 })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | undefined>(undefined)
  const legacyRef = useRef<AnchorPlacement | undefined>(undefined)
  const legacyKeyRef = useRef<string | undefined>(undefined)

  useLayoutEffect(() => {
    const element = wrapperRef.current
    if (element === null) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      setBoxSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const element = tooltipRef.current
    if (element === null) return
    const measure = () => {
      const rect = element.getBoundingClientRect()
      setTooltipSize((current) =>
        current.width === rect.width && current.height === rect.height
          ? current
          : { width: rect.width, height: rect.height },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [config.display.showTooltip])

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setViewport((current) => {
          const next = { width: window.innerWidth, height: window.innerHeight }
          return current.width === next.width && current.height === next.height ? current : next
        })
      })
    }
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    document.addEventListener('fullscreenchange', update)
    const observer = new ResizeObserver(update)
    observer.observe(document.documentElement)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      document.removeEventListener('fullscreenchange', update)
      observer.disconnect()
    }
  }, [])

  const legacyKey =
    config.position.posX !== undefined && config.position.posY !== undefined
      ? `${config.position.posX}:${config.position.posY}`
      : undefined
  if (legacyKey !== undefined && boxSize.width > 0 && legacyKeyRef.current !== legacyKey) {
    legacyKeyRef.current = legacyKey
    legacyRef.current = legacyAnchor(config.position, viewport, boxSize)
  } else if (legacyKey === undefined) {
    legacyKeyRef.current = undefined
    legacyRef.current = undefined
  }

  const resolved =
    dragPoint ??
    (legacyRef.current !== undefined
      ? anchorToPoint(
          legacyRef.current.anchor,
          legacyRef.current.offsetX,
          legacyRef.current.offsetY,
          viewport,
          boxSize,
        )
      : anchorToPoint(
          config.position.anchor ?? DEFAULT_ANCHOR,
          config.position.offsetX ?? DEFAULT_OFFSET_X,
          config.position.offsetY ?? DEFAULT_OFFSET_Y,
          viewport,
          boxSize,
        ))
  const point = clampPoint(resolved, viewport, boxSize.width, boxSize.height)

  const savePosition = async (next: AnchorPlacement) => {
    try {
      const accepted = await form.mutate([
        {
          op: 'set',
          path: ['position'],
          value: next,
        },
      ])
      if (!accepted) throw new Error('宿主拒绝了位置写入')
    } catch (error) {
      console.error('dsh-howmuch: position save failed', error)
    } finally {
      setDragPoint(undefined)
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: point.x,
      originY: point.y,
      moved: false,
    }
    setDragging(true)
    setHovered(false)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag === undefined) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) <= 3) return
    drag.moved = true
    setDragPoint(
      clampPoint(
        { x: drag.originX + dx, y: drag.originY + dy },
        viewport,
        boxSize.width,
        boxSize.height,
      ),
    )
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (drag === undefined) return
    dragRef.current = undefined
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId)
    }
    if (!drag.moved) {
      setDragPoint(undefined)
      return
    }
    const next = clampPoint(
      {
        x: drag.originX + (event.clientX - drag.startX),
        y: drag.originY + (event.clientY - drag.startY),
      },
      viewport,
      boxSize.width,
      boxSize.height,
    )
    setDragPoint(next)
    void savePosition(nearestAnchor(next, viewport, boxSize))
  }

  const handlePointerCancel = () => {
    dragRef.current = undefined
    setDragging(false)
    setDragPoint(undefined)
  }

  const handleEnter = () => {
    setHovered(true)
  }

  const symbol = currencySymbol(balance.currency)
  const name = config.display.showName ? 'DeepSeek' : ''
  const amount = config.display.showTotal
    ? balance.status === 'ready'
      ? `${symbol}${balance.total.toFixed(2)}`
      : '--'
    : ''
  const parts = [name, amount].filter((part) => part !== '')
  const text = parts.length > 0 ? parts.join(' · ') : balance.status === 'ready' ? symbol : '--'

  const containerStyle: CSSProperties = {
    position: 'fixed',
    left: `${point.x}px`,
    top: `${point.y}px`,
    display: 'inline-block',
    cursor: dragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    touchAction: 'none',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif',
    zIndex: 1,
  }

  const textStyle: CSSProperties = {
    fontSize: `${config.appearance.fontSize}px`,
    fontWeight: config.appearance.fontWeight === 'bold' ? 700 : 400,
    color: config.appearance.textColor,
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
    textShadow: config.appearance.enableShadow ? '0 1px 3px rgba(0, 0, 0, 0.8)' : 'none',
  }

  const tip = tooltipPoint(point, boxSize, tooltipSize, viewport)
  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    left: `${tip.x}px`,
    top: `${tip.y}px`,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(24, 24, 28, 0.96)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    opacity: hovered && !dragging ? 1 : 0,
    transition: 'opacity 120ms ease',
  }

  const muted: CSSProperties = { color: '#9CA3AF' }

  return (
    <div
      ref={wrapperRef}
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setHovered(false)}
      title={config.display.showTooltip ? undefined : '拖动可调整位置'}
    >
      <div style={textStyle}>{text}</div>
      {config.display.showTooltip && (
        <div ref={tooltipRef} style={tooltipStyle} aria-hidden={!hovered || dragging}>
          <div style={{ fontWeight: 600 }}>DeepSeek 账户余额</div>
          {balance.status === 'ready' ? (
            <>
              <div>
                充值 {symbol}
                {balance.toppedUp.toFixed(2)} · 赠送 {symbol}
                {balance.granted.toFixed(2)}
              </div>
              <div style={muted}>
                合计 {symbol}
                {balance.total.toFixed(2)} · 每 60 秒自动刷新
              </div>
            </>
          ) : (
            <div style={muted}>余额暂不可用，请检查账号登录状态</div>
          )}
        </div>
      )}
    </div>
  )
}

const CARD: CSSProperties = {
  border: '1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l3, rgba(128, 128, 128, 0.25)))',
  borderRadius: 12,
  background: 'var(--dsw-alias-bg-layer-3, transparent)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  minHeight: 28,
}

const TITLE: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--dsw-alias-label-primary, inherit)',
}

const LABEL: CSSProperties = {
  fontSize: 13,
  color: 'var(--dsw-alias-label-secondary, inherit)',
}

const HINT: CSSProperties = {
  fontSize: 12,
  color: 'var(--dsw-alias-label-tertiary, rgba(160, 160, 160, 0.9))',
}

const INPUT: CSSProperties = {
  width: 72,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35))',
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  color: 'inherit',
  fontSize: 13,
}

const BUTTON: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-l2, rgba(128, 128, 128, 0.35))',
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  color: 'inherit',
  fontSize: 13,
  cursor: 'pointer',
}

const ERROR: CSSProperties = {
  fontSize: 12,
  color: 'var(--dsw-alias-label-error, #E5484D)',
}

function SettingsSection(props: any) {
  const form = props.form
  const config = useConfig(form)
  const [error, setError] = useState<string | undefined>(undefined)
  const [fontSizeDraft, setFontSizeDraft] = useState<string | undefined>(undefined)
  const [colorDraft, setColorDraft] = useState<string | undefined>(undefined)

  const disabled = !config.writable || config.status !== 'ready'

  const write = async (path: Array<string | number>, value: unknown) => {
    setError(undefined)
    try {
      const accepted = await form.mutate([{ op: 'set', path, value }])
      if (!accepted) throw new Error('宿主拒绝了本次写入')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  if (config.status === 'unavailable') {
    return <p style={HINT}>此插件尚未激活，配置暂不可用。</p>
  }

  const fontSizeText = fontSizeDraft ?? String(config.appearance.fontSize)
  const commitFontSize = () => {
    const parsed = Number.parseInt(fontSizeText, 10)
    setFontSizeDraft(undefined)
    if (!Number.isFinite(parsed)) return
    const next = Math.min(48, Math.max(8, parsed))
    if (next !== config.appearance.fontSize) void write(['appearance', 'fontSize'], next)
  }

  const colorValue = /^#[0-9a-fA-F]{6}$/.test(colorDraft ?? '')
    ? (colorDraft as string)
    : config.appearance.textColor

  const position = config.position
  const legacyPosition =
    position.posX !== undefined && position.posY !== undefined ? position : undefined
  const anchor = position.anchor ?? DEFAULT_ANCHOR
  const offsetX = position.offsetX ?? DEFAULT_OFFSET_X
  const offsetY = position.offsetY ?? DEFAULT_OFFSET_Y
  const horizontalEdge = anchor.endsWith('left') ? '距左' : '距右'
  const verticalEdge = anchor.startsWith('top') ? '距上' : '距下'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={TITLE}>余额悬浮框</div>
        <div style={HINT}>
          悬浮框会跟随窗口缩放与全屏变化，始终保持在所锚定的角落。拖动即可调整位置。
        </div>
      </header>

      <section style={CARD}>
        <div style={TITLE}>外观</div>
        <div style={ROW}>
          <span style={LABEL}>字体大小</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              min={8}
              max={48}
              step={1}
              style={INPUT}
              value={fontSizeText}
              disabled={disabled}
              onChange={(event) => setFontSizeDraft(event.target.value)}
              onBlur={commitFontSize}
              onKeyDown={(event) => {
                if (event.key === 'Enter') commitFontSize()
              }}
            />
            <span style={HINT}>px</span>
          </span>
        </div>
        <div style={ROW}>
          <span style={LABEL}>字体形态</span>
          <select
            style={{ ...INPUT, width: 120 }}
            value={config.appearance.fontWeight}
            disabled={disabled}
            onChange={(event) => void write(['appearance', 'fontWeight'], event.target.value)}
          >
            <option value="normal">常规</option>
            <option value="bold">粗体</option>
          </select>
        </div>
        <div style={ROW}>
          <span style={LABEL}>文字颜色</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={colorValue}
              disabled={disabled}
              style={{ width: 32, height: 26, padding: 0, border: 'none', background: 'transparent' }}
              onChange={(event) => setColorDraft(event.target.value)}
              onBlur={() => {
                const next = colorDraft
                setColorDraft(undefined)
                if (next !== undefined && next.toUpperCase() !== config.appearance.textColor.toUpperCase()) {
                  void write(['appearance', 'textColor'], next.toUpperCase())
                }
              }}
            />
            <span style={HINT}>{config.appearance.textColor.toUpperCase()}</span>
          </span>
        </div>
        <label style={ROW}>
          <span style={LABEL}>开启微弱阴影</span>
          <input
            type="checkbox"
            checked={config.appearance.enableShadow}
            disabled={disabled}
            onChange={(event) => void write(['appearance', 'enableShadow'], event.target.checked)}
          />
        </label>
      </section>

      <section style={CARD}>
        <div style={TITLE}>显示内容</div>
        <label style={ROW}>
          <span style={LABEL}>显示名称</span>
          <input
            type="checkbox"
            checked={config.display.showName}
            disabled={disabled}
            onChange={(event) => void write(['display', 'showName'], event.target.checked)}
          />
        </label>
        <label style={ROW}>
          <span style={LABEL}>显示总余额</span>
          <input
            type="checkbox"
            checked={config.display.showTotal}
            disabled={disabled}
            onChange={(event) => void write(['display', 'showTotal'], event.target.checked)}
          />
        </label>
        <label style={ROW}>
          <span style={LABEL}>悬停显示详情</span>
          <input
            type="checkbox"
            checked={config.display.showTooltip}
            disabled={disabled}
            onChange={(event) => void write(['display', 'showTooltip'], event.target.checked)}
          />
        </label>
        {!config.display.showName && !config.display.showTotal && (
          <div style={HINT}>名称与余额都隐藏时，悬浮框仅显示货币符号作为拖拽锚点。</div>
        )}
      </section>

      <section style={CARD}>
        <div style={TITLE}>位置</div>
        <div style={ROW}>
          <span style={LABEL}>当前位置</span>
          <span style={HINT}>
            {legacyPosition !== undefined
              ? `旧版坐标 X ${round1(legacyPosition.posX!)} · Y ${round1(
                  legacyPosition.posY!,
                )}（拖动一次后自动迁移）`
              : `锚定${ANCHOR_LABELS[anchor]} · ${horizontalEdge} ${round1(
                  offsetX,
                )}px · ${verticalEdge} ${round1(offsetY)}px`}
          </span>
        </div>
        <div style={ROW}>
          <span style={HINT}>拖动后松开鼠标自动保存；窗口大小变化时会保持相对位置。</span>
          <button
            type="button"
            style={BUTTON}
            disabled={disabled}
            onClick={() =>
              void write(['position'], {
                anchor: DEFAULT_ANCHOR,
                offsetX: DEFAULT_OFFSET_X,
                offsetY: DEFAULT_OFFSET_Y,
              })
            }
          >
            重置位置
          </button>
        </div>
      </section>

      {error !== undefined && <div style={ERROR}>{error}</div>}
    </div>
  )
}

export const inject = ['slots', 'configForms']

export function apply(ctx: any) {
  const form = ctx.configForms.get(NS)

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      { name: 'shell.overlay', id: NS, order: 100 },
      () => <BalanceOverlay ctx={ctx} form={form} />,
    ),
  )

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: NS,
        order: 200,
        label: '余额悬浮框',
        inject: () => ({ form }),
      },
      SettingsSection,
    ),
  )
}
