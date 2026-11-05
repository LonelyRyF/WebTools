export interface PromptPreset {
  label: string
  description: string
  prompt: string
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    label: '赛博朋克夜景',
    description: '未来都市、霓虹倒影、高科技光影',
    prompt:
      '赛博朋克风格未来雨夜街道，潮湿地面倒映着绚丽霓虹灯光，全息广告牌，高耸摩天大楼，电影级质感与光影，虚幻引擎5渲染，超清细节 8k',
  },
  {
    label: '35mm 胶片人像',
    description: '电影级胶片质感、黄金时刻逆光',
    prompt:
      '35mm 胶片摄影风格大师级人像，黄金时刻柔和侧逆光，细腻皮肤质感与自然光晕，微小胶片颗粒感，电影画幅构图，哈苏相机拍摄',
  },
  {
    label: '吉卜力唯美风',
    description: '宫崎骏动画美学、治愈手绘水彩',
    prompt:
      '吉卜力工作室风格手绘插画，夏日广袤碧绿草甸与蓝天积雨云，微风吹拂，温暖治愈的水彩与水粉笔触，明亮清澈的色彩，新海诚唯美氛围',
  },
  {
    label: '极简 3D 粘土',
    description: '柔和马卡龙色调、可爱立体微缩',
    prompt:
      '极简主义可爱 3D 粘土材质微缩场景，柔和柔光漫反射照明，马卡龙低饱和粉嫩配色，C4D与Blender艺术渲染，光滑圆润造型，纯净浅色背景',
  },
  {
    label: '史诗科幻概念',
    description: '星际母舰、异星荒原、宏大叙事',
    prompt:
      '宏大史诗科幻概念艺术场景，巨型星际母舰悬停在外星荒原上空，沙尘暴与异星双月，冷暖对比强烈的光影，细致星舰机械结构，太空歌剧史诗感',
  },
  {
    label: '东方写意水墨',
    description: '传统国画烟雨山水、空灵留白',
    prompt:
      '传统中国水墨写意国画风格，烟雨蒙蒙中的群山叠嶂与孤舟渔翁，浓淡相宜的墨色晕染，大面积留白与飞鸟，空灵幽远，东方禅意意境',
  },
]
