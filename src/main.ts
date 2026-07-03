import { RendererController } from "./renderer";
const rendererController = RendererController.getInstance();
(window as any).$controller = rendererController;
