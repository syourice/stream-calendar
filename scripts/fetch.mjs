// YouTube Data API から配信予定を取得して schedules.json を作る（Node 20+, 依存なし）
import { readFile, writeFile } from "node:fs/promises";

const KEY = process.env.YT_API_KEY;
if (!KEY) { console.error("YT_API_KEY が未設定です"); process.exit(1); }

const DAYS_BACK = 7; // 何日前の配信まで残すか
const since = Date.now() - DAYS_BACK * 864e5;

async function yt(path, params) {
  const url = "https://www.googleapis.com/youtube/v3/" + path + "?" +
    new URLSearchParams({ ...params, key: KEY });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  return r.json();
}

const cfg = JSON.parse(await readFile("channels.json", "utf8"));
const channels = [], events = [];

for (const c of cfg) {
  try {
    // 1 unit: チャンネル情報（ハンドル or ID）
    const q = c.id ? { id: c.id } : { forHandle: c.handle };
    const ch = (await yt("channels", { part: "snippet,contentDetails", ...q })).items?.[0];
    if (!ch) { console.warn("見つかりません:", c.handle || c.id); continue; }
    channels.push({
      id: ch.id,
      name: c.name || ch.snippet.title,
      handle: c.handle || "channel/" + ch.id,
      color: c.color || "#3b82f6",
    });
    // 1 unit: 最新50件の動画ID（アップロード一覧）
    const pl = ch.contentDetails.relatedPlaylists.uploads;
    const items = (await yt("playlistItems", { part: "contentDetails", playlistId: pl, maxResults: 50 })).items;
    const ids = items.map(i => i.contentDetails.videoId);
    if (!ids.length) continue;
    // 1 unit: 配信予定時刻などの詳細
    const vids = (await yt("videos", { part: "snippet,liveStreamingDetails", id: ids.join(",") })).items;
    for (const v of vids) {
      const l = v.liveStreamingDetails;
      if (!l) continue; // 通常動画は除外
      const start = l.actualStartTime || l.scheduledStartTime;
      if (!start || Date.parse(start) < since) continue;
      events.push({
        id: v.id, ch: ch.id, title: v.snippet.title, start,
        status: v.snippet.liveBroadcastContent, // upcoming / live / none
        url: "https://www.youtube.com/watch?v=" + v.id,
      });
    }
  } catch (e) { console.warn(e.message); }
}

if (!channels.length) { console.error("1チャンネルも取得できませんでした（既存データは上書きしません）"); process.exit(1); }
events.sort((a, b) => a.start.localeCompare(b.start));
await writeFile("schedules.json", JSON.stringify({ updated: new Date().toISOString(), channels, events }, null, 1));
console.log(`OK: ${channels.length} channels, ${events.length} events`);
