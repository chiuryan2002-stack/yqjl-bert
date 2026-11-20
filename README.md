# 互動網頁：讀得出，卻沒用上——BERT 與「原、前、舊、老」

LING5006 期末專案的互動成果呈現。純靜態網頁，資料都已內嵌，不需要後端，也不需要安裝套件。

| 檔案 | 內容 |
|---|---|
| `index.html` | 研究網頁：捲動敘事（一個句子穿過 BERT 的 13 層）、語意星圖（2,271 句 × 13 層）、行為測試、心口不一（各層探針讀到的 vs. 實際填空）、語境改寫實驗室、時間滑桿 |
| `story.html` | 互動故事「小張的職場三十年」：8 幕職場情境，讀者和 BERT 一起填字 |
| `duel.html` | 「你來填：人類 vs. BERT」填空遊戲（個人模式，10 題） |
| `duel.html#host` | 主持模式（課堂投影用，6 題）：鍵盤 1–4 記票、Shift＋數字減票、T 計時 15 秒、Space 揭曉／下一題、← 上一題 |

## 部署到 GitHub Pages

1. 把本資料夾的檔案（含 `.nojekyll`）放在 repo 根目錄，push 到 `main`。
2. Settings → Pages → Source 選 *Deploy from a branch*，Branch 選 `main`／`/(root)`，按 Save。
3. 約一分鐘後網址會是 `https://<帳號>.github.io/<repo 名稱>/`，故事在 `…/story.html`，遊戲在 `…/duel.html`。

## 資料來源

COCT 2019 語料，2,271 筆有效標註語料；模型為 `bert-base-chinese`。分析程式與完整結果見期末專案主 repo。
