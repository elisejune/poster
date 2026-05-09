# 智能内容校正与管理评审工具

这是一个独立 Vue/Vite 项目，不依赖原 Poster 应用。

## 能力范围

- 文本输入和文件上传
- Word、PDF、图片 OCR、Excel 内容抽取
- 原文含义保真约束
- 错别字与语句通顺审核提示
- 行业信息对标审核提示
- 三位管理专家评审提示
- 文案校正者优化提示
- 产品经理需求细化与落地提示
- 总经理董事会呈现审核提示

## AI 后端

默认未配置 AI 后端时，页面会生成可复制的完整审核提示词。

如需自动生成审核结果，可配置：

```bash
VITE_AI_REVIEW_ENDPOINT=https://your-ai-proxy.example.com/review
```

该接口应返回：

```json
{
  "sections": [],
  "changes": [],
  "boardDraft": ""
}
```

## 本地运行

```bash
npm install
npm run dev -- --host 0.0.0.0
```

## 构建

```bash
npm run build
```
