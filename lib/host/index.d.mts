import z from "@deepseek-ai/schemastery";
declare const Config: z<NoInfer<Schemastery.ObjectS<NoInfer<{
  appearance: z<Schemastery.ObjectS<NoInfer<{
    fontSize: z<number, number, "defined">;
    fontWeight: z<"normal" | "bold", "normal" | "bold", "defined">;
    textColor: z<string, string, "defined">;
    enableShadow: z<boolean, boolean, "defined">;
  }>>, Schemastery.ObjectT<NoInfer<{
    fontSize: z<number, number, "defined">;
    fontWeight: z<"normal" | "bold", "normal" | "bold", "defined">;
    textColor: z<string, string, "defined">;
    enableShadow: z<boolean, boolean, "defined">;
  }>>, "plain">;
  display: z<Schemastery.ObjectS<NoInfer<{
    showName: z<boolean, boolean, "defined">;
    showTotal: z<boolean, boolean, "defined">;
    showTooltip: z<boolean, boolean, "defined">;
  }>>, Schemastery.ObjectT<NoInfer<{
    showName: z<boolean, boolean, "defined">;
    showTotal: z<boolean, boolean, "defined">;
    showTooltip: z<boolean, boolean, "defined">;
  }>>, "plain">;
  position: z<Schemastery.ObjectS<NoInfer<{
    anchor: z<"top-left" | "top-right" | "bottom-left" | "bottom-right", "top-left" | "top-right" | "bottom-left" | "bottom-right", "defined">;
    offsetX: z<number, number, "defined">;
    offsetY: z<number, number, "defined">;
    posX: z<number, number, "plain">;
    posY: z<number, number, "plain">;
  }>>, Schemastery.ObjectT<NoInfer<{
    anchor: z<"top-left" | "top-right" | "bottom-left" | "bottom-right", "top-left" | "top-right" | "bottom-left" | "bottom-right", "defined">;
    offsetX: z<number, number, "defined">;
    offsetY: z<number, number, "defined">;
    posX: z<number, number, "plain">;
    posY: z<number, number, "plain">;
  }>>, "plain">;
}>>>, NoInfer<Schemastery.ObjectT<NoInfer<{
  appearance: z<Schemastery.ObjectS<NoInfer<{
    fontSize: z<number, number, "defined">;
    fontWeight: z<"normal" | "bold", "normal" | "bold", "defined">;
    textColor: z<string, string, "defined">;
    enableShadow: z<boolean, boolean, "defined">;
  }>>, Schemastery.ObjectT<NoInfer<{
    fontSize: z<number, number, "defined">;
    fontWeight: z<"normal" | "bold", "normal" | "bold", "defined">;
    textColor: z<string, string, "defined">;
    enableShadow: z<boolean, boolean, "defined">;
  }>>, "plain">;
  display: z<Schemastery.ObjectS<NoInfer<{
    showName: z<boolean, boolean, "defined">;
    showTotal: z<boolean, boolean, "defined">;
    showTooltip: z<boolean, boolean, "defined">;
  }>>, Schemastery.ObjectT<NoInfer<{
    showName: z<boolean, boolean, "defined">;
    showTotal: z<boolean, boolean, "defined">;
    showTooltip: z<boolean, boolean, "defined">;
  }>>, "plain">;
  position: z<Schemastery.ObjectS<NoInfer<{
    anchor: z<"top-left" | "top-right" | "bottom-left" | "bottom-right", "top-left" | "top-right" | "bottom-left" | "bottom-right", "defined">;
    offsetX: z<number, number, "defined">;
    offsetY: z<number, number, "defined">;
    posX: z<number, number, "plain">;
    posY: z<number, number, "plain">;
  }>>, Schemastery.ObjectT<NoInfer<{
    anchor: z<"top-left" | "top-right" | "bottom-left" | "bottom-right", "top-left" | "top-right" | "bottom-left" | "bottom-right", "defined">;
    offsetX: z<number, number, "defined">;
    offsetY: z<number, number, "defined">;
    posX: z<number, number, "plain">;
    posY: z<number, number, "plain">;
  }>>, "plain">;
}>>>, "volatile">;
declare function apply(): void;
export { Config, apply };