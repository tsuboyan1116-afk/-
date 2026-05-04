“use client”;
import { useState, useEffect, useRef } from “react”;
import { supabase } from “../lib/supabase”;

const FILTERS = [“すべて”, “未完了”, “完了”];

export default function TodoApp() {
const [todos, setTodos] = useState([]);
const [input, setInput] = useState(””);
const [filter, setFilter] = useState(“すべて”);
const [animating, setAnimating] = useState(null);
const [loading, setLoading] = useState(true);
const [saveStatus, setSaveStatus] = useState(null);
const [error, setError] = useState(null);

// — Fetch todos on mount —
useEffect(() => {
fetchTodos();

```
// リアルタイム同期
const channel = supabase
  .channel("todos")
  .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, () => {
    fetchTodos();
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

}, []);

async function fetchTodos() {
try {
const { data, error } = await supabase
.from(“todos”)
.select(”*”)
.order(“created_at”, { ascending: false });
if (error) throw error;
setTodos(data || []);
setError(null);
} catch (e) {
setError(“データの読み込みに失敗しました”);
} finally {
setLoading(false);
}
}

async function addTodo() {
const text = input.trim();
if (!text) return;
setInput(””);
setSaveStatus(“saving”);

```
const { data, error } = await supabase
  .from("todos")
  .insert([{ text, done: false }])
  .select()
  .single();

if (!error && data) {
  setAnimating(data.id);
  setTimeout(() => setAnimating(null), 500);
  setSaveStatus("saved");
  setTimeout(() => setSaveStatus(null), 1500);
} else {
  setError("追加に失敗しました");
  setSaveStatus(null);
}
```

}

async function toggleTodo(id, currentDone) {
const { error } = await supabase
.from(“todos”)
.update({ done: !currentDone })
.eq(“id”, id);
if (error) setError(“更新に失敗しました”);
}

async function deleteTodo(id) {
const { error } = await supabase.from(“todos”).delete().eq(“id”, id);
if (error) setError(“削除に失敗しました”);
}

async function clearDone() {
const { error } = await supabase.from(“todos”).delete().eq(“done”, true);
if (error) setError(“削除に失敗しました”);
}

const filtered = todos.filter((t) => {
if (filter === “未完了”) return !t.done;
if (filter === “完了”) return t.done;
return true;
});

const doneCount = todos.filter((t) => t.done).length;
const progress = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

if (loading) {
return (
<div style={s.center}>
<svg className="spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round">
<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
</svg>
</div>
);
}

return (
<div style={s.root}>
{/* Header */}
<div style={s.header}>
<div style={s.titleRow}>
<span style={s.star}>✦</span>
<h1 style={s.title}>タスク</h1>
<span style={{ …s.saveIndicator, opacity: saveStatus ? 1 : 0 }}>
{saveStatus === “saving” ? “保存中…” : “✓ 保存済み”}
</span>
</div>
<p style={s.subtitle}>{doneCount} / {todos.length} 完了</p>
<div style={s.track}>
<div style={{ …s.fill, width: `${progress}%` }} />
</div>
{error && (
<p style={s.errorMsg} onClick={() => setError(null)}>⚠ {error}（タップで消去）</p>
)}
</div>

```
  {/* Input */}
  <div style={s.inputRow}>
    <input
      style={s.input}
      placeholder="新しいタスクを追加..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && addTodo()}
    />
    <button style={s.addBtn} className="addBtn" onClick={addTodo}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>

  {/* Filters */}
  <div style={s.filters}>
    {FILTERS.map((f) => (
      <button
        key={f}
        style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
        onClick={() => setFilter(f)}
      >
        {f}
      </button>
    ))}
  </div>

  {/* List */}
  <div style={s.list}>
    {filtered.length === 0 && (
      <div style={s.empty}>タスクがありません</div>
    )}
    {filtered.map((todo) => (
      <div
        key={todo.id}
        style={{ ...s.item, ...(todo.done ? s.itemDone : {}) }}
        className={animating === todo.id ? "slideIn" : ""}
      >
        <button
          style={{ ...s.check, ...(todo.done ? s.checkDone : {}) }}
          className="checkBtn"
          onClick={() => toggleTodo(todo.id, todo.done)}
        >
          {todo.done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </button>
        <span style={{ ...s.text, ...(todo.done ? s.textDone : {}) }}>
          {todo.text}
        </span>
        <button style={s.deleteBtn} className="deleteBtn" onClick={() => deleteTodo(todo.id)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    ))}
  </div>

  {/* Footer */}
  {todos.some((t) => t.done) && (
    <div style={s.footer}>
      <button style={s.clearBtn} className="clearBtn" onClick={clearDone}>
        完了済みを削除
      </button>
    </div>
  )}
</div>
```

);
}

const s = {
center: {
minHeight: “100vh”, display: “flex”, alignItems: “center”, justifyContent: “center”, background: “#0d0d0d”,
},
root: {
minHeight: “100vh”, background: “#0d0d0d”,
display: “flex”, flexDirection: “column”, alignItems: “center”,
padding: “48px 16px 80px”,
},
header: { width: “100%”, maxWidth: 480, marginBottom: 28 },
titleRow: { display: “flex”, alignItems: “center”, gap: 10, marginBottom: 4 },
star: { fontSize: 22, color: “#e8d5a0” },
title: { margin: 0, fontSize: 32, fontWeight: 700, color: “#f5f0e8”, letterSpacing: “-0.02em” },
saveIndicator: { marginLeft: “auto”, fontSize: 11, color: “#c9a84c”, letterSpacing: “0.03em”, transition: “opacity 0.3s” },
subtitle: { margin: “0 0 16px 32px”, fontSize: 13, color: “#666”, letterSpacing: “0.04em” },
track: { height: 3, background: “#222”, borderRadius: 999, overflow: “hidden” },
fill: { height: “100%”, background: “linear-gradient(90deg, #c9a84c, #e8d5a0)”, borderRadius: 999, transition: “width 0.5s cubic-bezier(0.4,0,0.2,1)” },
errorMsg: { marginTop: 10, fontSize: 12, color: “#e07070”, cursor: “pointer” },
inputRow: { display: “flex”, gap: 10, width: “100%”, maxWidth: 480, marginBottom: 20 },
input: { flex: 1, padding: “14px 18px”, background: “#1a1a1a”, border: “1px solid #2a2a2a”, borderRadius: 12, color: “#f5f0e8”, fontSize: 15, transition: “border-color 0.2s” },
addBtn: { width: 50, height: 50, background: “#c9a84c”, border: “none”, borderRadius: 12, color: “#0d0d0d”, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0, transition: “background 0.2s, transform 0.1s” },
filters: { display: “flex”, gap: 6, width: “100%”, maxWidth: 480, marginBottom: 20 },
filterBtn: { padding: “7px 16px”, background: “transparent”, border: “1px solid #2a2a2a”, borderRadius: 999, color: “#555”, fontSize: 13, cursor: “pointer”, transition: “all 0.2s” },
filterActive: { background: “#1e1a12”, border: “1px solid #c9a84c”, color: “#e8d5a0” },
list: { width: “100%”, maxWidth: 480, display: “flex”, flexDirection: “column”, gap: 8 },
item: { display: “flex”, alignItems: “center”, gap: 14, padding: “16px 18px”, background: “#141414”, border: “1px solid #1f1f1f”, borderRadius: 14, transition: “all 0.25s ease” },
itemDone: { opacity: 0.5, background: “#111” },
check: { width: 22, height: 22, borderRadius: 6, border: “2px solid #333”, background: “transparent”, cursor: “pointer”, display: “flex”, alignItems: “center”, justifyContent: “center”, flexShrink: 0, transition: “all 0.2s” },
checkDone: { background: “#c9a84c”, border: “2px solid #c9a84c” },
text: { flex: 1, fontSize: 15, color: “#ddd”, lineHeight: 1.4 },
textDone: { textDecoration: “line-through”, color: “#444” },
deleteBtn: { background: “transparent”, border: “none”, color: “#444”, cursor: “pointer”, padding: 4, display: “flex”, alignItems: “center”, borderRadius: 6, transition: “color 0.2s”, flexShrink: 0 },
empty: { textAlign: “center”, color: “#444”, fontSize: 14, padding: “40px 0” },
footer: { marginTop: 24, width: “100%”, maxWidth: 480, display: “flex”, justifyContent: “flex-end” },
clearBtn: { background: “transparent”, border: “none”, color: “#444”, fontSize: 13, cursor: “pointer”, padding: “4px 0”, textDecoration: “underline”, textUnderlineOffset: 3, transition: “color 0.2s” },
};
