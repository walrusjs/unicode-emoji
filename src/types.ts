export interface Emoji {
  /** 名称 */
  name: string;
  /** 所属分组 */
  group: string;
  /** 所属版本 */
  version: string;
  /** 是否支持设置肤色 */
  skin_tone_support: boolean;
  /** 支持设置肤色的版本 */
  skin_tone_support_version: string;
}
