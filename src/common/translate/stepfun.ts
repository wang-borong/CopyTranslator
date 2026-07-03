import { OpenAI } from "./openai";

/**
 * 阶跃星辰翻译器
 * 继承自 OpenAI，使用阶跃星辰的 OpenAI 兼容接口
 */
export class Stepfun extends OpenAI {
  readonly name: string = "stepfun";

  constructor(options: { axios: any; config: any }) {
    super(options);
  }
}

export default Stepfun;
