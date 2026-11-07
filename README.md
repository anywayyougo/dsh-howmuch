# dsh-howmuch

极简透明的 DeepSeek 余额悬浮框，DSH 桌面端插件。

在窗口角落常驻显示账户余额，悬停查看充值/赠送明细；支持拖拽定位、四角锚定，窗口缩放与无边框全屏后位置保持不变。

## 功能

- **实时余额**：每 60 秒自动刷新，自动识别 CNY / USD 货币符号
- **悬停详情**：显示充值余额、赠送余额与合计
- **拖拽移动**：按住悬浮框拖动，松手自动保存并吸附到最近的角落
- **锚定定位**：四角锚定 + 偏移量，窗口缩放 / 全屏切换后保持相对位置
- **贴边安全**：悬浮框贴近窗口边缘时，悬停详情自动避让，不会超出可视区域
- **外观自定义**：字号（8–48px）、常规/粗体、文字颜色、微弱阴影
- **显示内容开关**：名称、总余额、悬停详情均可独立开关
- **优雅降级**：余额不可用时显示 `--`，不影响主界面

## 环境要求

- DSH 桌面端（使用其内置的 React 运行时与 `@deepseek-ai/*` 客户端包）
- 已登录 DeepSeek 账号（余额数据来自 `remote.account.getBalance`）

## 安装

### 本地安装

```bash
# 1. 构建插件
npm install
npm run build

# 2. 在 DSH profile 目录（%USERPROFILE%\.dsh\profiles\desktop）中链接本地插件
pnpm add link:<插件目录绝对路径>
```

确认 profile 的 `package.json` 中 `dsh.profile.bundles` 包含 `dsh-howmuch`：

```json
{
  "dsh": {
    "profile": {
      "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-howmuch"]
    }
  }
}
```

重启 DSH 后生效。

### 插件管理器安装

设置 → 插件 → 添加插件，输入 `dsh-howmuch`（npm 包发布后可用）。

## 使用

- 拖动悬浮框到任意位置，松手自动保存位置并吸附最近角落
- 鼠标悬停查看余额明细
- 设置 → 余额悬浮框，可调整外观、显示内容与位置
- 点击「重置位置」恢复默认右下角 12px / 12px

## 配置项

| 分组 | 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| appearance | fontSize | number | 14 | 字体大小（8–48px） |
| appearance | fontWeight | `normal` \| `bold` | `normal` | 字体形态 |
| appearance | textColor | string | `#FFFFFF` | 文字颜色（#RRGGBB） |
| appearance | enableShadow | boolean | true | 开启微弱阴影 |
| display | showName | boolean | true | 显示名称 |
| display | showTotal | boolean | true | 显示总余额 |
| display | showTooltip | boolean | true | 悬停显示详情 |
| position | anchor | `top-left` \| `top-right` \| `bottom-left` \| `bottom-right` | `bottom-right` | 锚定角落 |
| position | offsetX | number | 12 | 距锚定边的水平距离（px） |
| position | offsetY | number | 12 | 距锚定边的垂直距离（px） |
| position | posX / posY | number | — | 旧版绝对坐标，仅用于兼容旧配置 |

## 开发

```bash
npm install
npm run build        # tsdown 构建
npx tsc --noEmit     # 类型检查
```

构建产物：

- `lib/host/index.mjs`：宿主端（ESM），声明配置 schema
- `lib/client/index.cjs`：客户端（CJS），由 `window.__ModuleLoader__.load(...)` 包装注入

## 项目结构

```
src/host/index.ts    配置 schema（schemastery）
src/client/index.tsx 悬浮框、设置页、拖拽与定位逻辑
cordis.patch.yml     插件 bundle 注入
lib/                 构建产物
```

## 实现说明

- 位置持久化采用「锚定角落 + 偏移量」模型，兼容旧版 `posX/posY` 绝对坐标（拖动一次后自动迁移）
- 监听 `resize`、`visualViewport.resize`、`fullscreenchange` 与 `ResizeObserver`，窗口缩放 / 全屏切换时保持相对位置
- 悬停详情使用 `position: fixed` 定位，并在上下左右四个方向自动翻转 / 平移，始终限制在视口内
- 余额数据：`ctx.get('remote.account').getBalance(metadata)`，60 秒轮询
