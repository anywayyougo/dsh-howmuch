import z from '@deepseek-ai/schemastery';

export const Config = z
  .object({
    appearance: z
      .object({
        fontSize: z.number().min(8).max(48).default(14).description('字体大小（px）'),
        fontWeight: z.union(['normal', 'bold']).default('normal').description('字体形态'),
        textColor: z.string().default('#FFFFFF').description('文字颜色（#RRGGBB）'),
        enableShadow: z.boolean().default(true).description('开启微弱阴影'),
      })
      .description('外观设置'),
    display: z
      .object({
        showName: z.boolean().default(true).description('显示名称'),
        showTotal: z.boolean().default(true).description('显示总余额'),
        showTooltip: z.boolean().default(true).description('悬停显示详情'),
      })
      .description('显示内容'),
    position: z
      .object({
        anchor: z
          .union(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
          .default('bottom-right')
          .description('锚定角落'),
        offsetX: z.number().default(12).description('距锚定边的水平距离（px）'),
        offsetY: z.number().default(12).description('距锚定边的垂直距离（px）'),
        posX: z.number().description('旧版 X 轴坐标（仅用于兼容旧配置）'),
        posY: z.number().description('旧版 Y 轴坐标（仅用于兼容旧配置）'),
      })
      .description('位置调整'),
  })
  .volatile();

export function apply() {}
