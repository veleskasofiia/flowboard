"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type NodeTypes,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import FlowChat from "../../components/FlowChat";
import { supabase } from "../../lib/supabaseClient";
import NavBar from "../../components/NavBar";

// ─── App catalogue ───────────────────────────────────────────────────────────

type AppEntry = {
  key: string;
  label: string;
  icon: string;
  color: string;
  category: "trigger" | "action";
};

const PALETTE: AppEntry[] = [
  { key: "webhook",  label: "Webhook",            icon: "⚡", color: "#f59e0b", category: "trigger" },
  { key: "schedule", label: "Schedule",            icon: "⏰", color: "#8b5cf6", category: "trigger" },
  { key: "gmail",    label: "Gmail",               icon: "📧", color: "#ea4335", category: "action"  },
  { key: "outlook",  label: "Outlook Mail",        icon: "📨", color: "#0078d4", category: "action"  },
  { key: "ocal",     label: "Outlook Calendar",    icon: "📆", color: "#0f6cbd", category: "action"  },
  { key: "calendar", label: "Google Calendar",     icon: "📅", color: "#4285f4", category: "action"  },
  { key: "ical",     label: "iCal",                icon: "🗓️", color: "#007aff", category: "action"  },
  { key: "gdrive",   label: "Google Drive",        icon: "📁", color: "#34a853", category: "action"  },
  { key: "slack",    label: "Slack",               icon: "💬", color: "#36c5f0", category: "action"  },
  { key: "discord",  label: "Discord",             icon: "🎮", color: "#5865f2", category: "action"  },
  { key: "notion",   label: "Notion",              icon: "📓", color: "#374151", category: "action"  },
  { key: "todoist",  label: "Todoist",             icon: "✅", color: "#db4035", category: "action"  },
  { key: "ifelse",   label: "IF Condition",        icon: "🔀", color: "#6b7280", category: "action"  },
];

const PALETTE_BY_KEY = Object.fromEntries(PALETTE.map((a) => [a.key, a]));

// ─── Custom node ─────────────────────────────────────────────────────────────

type AppNodeData = { label: string; icon: string; color: string; category: "trigger" | "action"; condition?: string; note?: string };

function AppNode({ data, selected, id }: { data: AppNodeData; selected: boolean; id: string }) {
  const { setNodes } = useReactFlow();
  const isIf = data.label === "IF Condition";
  const isSchedule = data.label === "Schedule";

  function updateField(field: "condition" | "note", value: string) {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n));
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 10,
        border: `2px solid ${selected ? data.color : "#e2e8f0"}`,
        boxShadow: selected
          ? `0 0 0 3px ${data.color}33, 0 4px 12px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(0,0,0,0.08)",
        minWidth: 200,
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
        transition: "border 0.15s, box-shadow 0.15s",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: data.color, width: 10, height: 10, border: "2px solid white" }} />

      {/* Category badge */}
      <div style={{ background: data.color, padding: "3px 10px", fontSize: "0.6rem", color: "white", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {data.category}
      </div>

      {/* Title row */}
      <div style={{ padding: "10px 14px 6px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{data.icon}</span>
        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "#1e293b" }}>{data.label}</span>
      </div>

      {/* IF Condition — editable condition */}
      {isIf && (
        <div style={{ padding: "0 10px 10px" }}>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" }}>Condition</div>
          <input
            className="nodrag"
            style={{ width: "100%", fontSize: "0.78rem", border: "1px solid #e2e8f0", borderRadius: 5, padding: "4px 7px", color: "#1e293b", outline: "none" }}
            placeholder="e.g. Is it marked important?"
            value={data.condition ?? ""}
            onChange={(e) => updateField("condition", e.target.value)}
          />
          <div style={{ fontSize: "0.65rem", color: "#94a3b8", marginTop: 4 }}>
            ✅ True path → top output &nbsp;|&nbsp; ❌ False path → bottom output
          </div>
        </div>
      )}

      {/* Schedule / other nodes — optional note */}
      {!isIf && (
        <div style={{ padding: "0 10px 10px" }}>
          <input
            className="nodrag"
            style={{ width: "100%", fontSize: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 5, padding: "4px 7px", color: "#64748b", outline: "none" }}
            placeholder={isSchedule ? "e.g. Every day at 8 AM" : "Add a note…"}
            value={data.note ?? ""}
            onChange={(e) => updateField("note", e.target.value)}
          />
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: data.color, width: 10, height: 10, border: "2px solid white" }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { appNode: AppNode };

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#94a3b8", strokeWidth: 2 },
  animated: true,
};

const DEFAULT_NODES = [
  {
    id: "1",
    type: "appNode",
    position: { x: 160, y: 180 },
    data: { ...PALETTE_BY_KEY["webhook"] },
  },
  {
    id: "2",
    type: "appNode",
    position: { x: 420, y: 180 },
    data: { ...PALETTE_BY_KEY["gmail"] },
  },
];

const DEFAULT_EDGES = [
  { id: "e1-2", source: "1", target: "2", type: "smoothstep", animated: true, style: { stroke: "#94a3b8", strokeWidth: 2 } },
];

const STORAGE_KEY = "flowboard_canvas";

function loadCanvas() {
  if (typeof window === "undefined") return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
    return JSON.parse(saved);
  } catch {
    return { nodes: DEFAULT_NODES, edges: DEFAULT_EDGES };
  }
}

// ─── Inner canvas (needs ReactFlowProvider context) ───────────────────────────

function WorkflowCanvas({
  nodesRef,
  edgesRef,
  saveTrigger,
  onSaveComplete,
}: {
  nodesRef: React.MutableRefObject<Node[]>;
  edgesRef: React.MutableRefObject<Edge[]>;
  saveTrigger: number;
  onSaveComplete: (ok: boolean) => void;
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const saved = loadCanvas();
  const [nodes, setNodes, onNodesChange] = useNodesState(saved.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved.edges);

  // Keep refs in sync and auto-save to localStorage
  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // On mount: load from Supabase if user is logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("workflows")
        .select("nodes, edges")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setNodes(data.nodes);
            setEdges(data.edges);
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to Supabase when parent triggers it
  useEffect(() => {
    if (saveTrigger === 0) return;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { onSaveComplete(false); return; }
      const { error } = await supabase.from("workflows").upsert(
        { user_id: user.id, nodes: nodesRef.current, edges: edgesRef.current, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      onSaveComplete(!error);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const key = e.dataTransfer.getData("application/flowboard");
      const app = PALETTE_BY_KEY[key];
      if (!app) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((prev) => [
        ...prev,
        {
          id: `${key}-${Date.now()}`,
          type: "appNode",
          position,
          data: { ...app },
        },
      ]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Backspace"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls style={{ bottom: 24, left: 16 }} />
        <MiniMap
          nodeColor={(n) => (n.data as AppNodeData).color}
          style={{ bottom: 24, right: 16, borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}

// ─── Palette sidebar ──────────────────────────────────────────────────────────

function PaletteSidebar() {
  const triggers = PALETTE.filter((a) => a.category === "trigger");
  const actions  = PALETTE.filter((a) => a.category === "action");

  const onDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData("application/flowboard", key);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="palette-sidebar">
      <div className="palette-search-wrap">
        <input className="palette-search" placeholder="🔍  Search nodes…" />
      </div>

      <PaletteGroup title="Triggers" items={triggers} onDragStart={onDragStart} />
      <PaletteGroup title="Actions"  items={actions}  onDragStart={onDragStart} />

      <p className="palette-hint">Drag a node onto the canvas to add it to your flow.</p>
    </aside>
  );
}

function PaletteGroup({
  title, items, onDragStart,
}: {
  title: string;
  items: AppEntry[];
  onDragStart: (e: React.DragEvent, key: string) => void;
}) {
  return (
    <div className="palette-group">
      <h3 className="palette-group-title">{title}</h3>
      {items.map((app) => (
        <div
          key={app.key}
          className="palette-item"
          draggable
          onDragStart={(e) => onDragStart(e, app.key)}
          style={{ borderLeft: `3px solid ${app.color}` }}
        >
          <span className="palette-item-icon">{app.icon}</span>
          <span className="palette-item-label">{app.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectedAppsPage() {
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function handleSave() {
    setSaveStatus("saving");
    setSaveTrigger((t) => t + 1);
  }

  function handleSaveComplete(ok: boolean) {
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }

  async function handleRun() {
    setRunning(true);
    setRunResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const entityId = user?.id ?? "default";

      const payload = nodesRef.current.map((n) => ({
        label: (n.data as AppNodeData).label,
        category: (n.data as AppNodeData).category,
      }));
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: payload, entityId }),
      });
      const data = await res.json();
      const result: string = data.result ?? "Workflow ran.";
      setRunResult(result);
      const prev: RunRecord[] = JSON.parse(localStorage.getItem("flowboard_runs") || "[]");
      prev.unshift({
        id: Date.now(),
        result,
        nodes: payload.map((n) => n.label),
        ts: new Date().toISOString(),
      });
      localStorage.setItem("flowboard_runs", JSON.stringify(prev.slice(0, 10)));
    } catch {
      setRunResult("Run failed. Please try again.");
    }
    setRunning(false);
  }

  return (
    <div className="workflow-page">
      <NavBar />

      {/* Workflow toolbar */}
      <div className="workflow-toolbar">
        <span className="topbar-title">My Workflow</span>
        <div className="topbar-actions">
          <button className="topbar-btn run-btn" onClick={handleRun} disabled={running}>
            {running ? "⏳ Running…" : "▶ Run"}
          </button>
          <button className="topbar-btn save-btn" onClick={handleSave} disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "⚠ Sign in to save" : "💾 Save"}
          </button>
        </div>
      </div>

      {/* Run result banner */}
      {runResult && (
        <div className="run-result-banner">
          <div className="run-result-inner">
            <span className="run-result-title">✅ Workflow Result</span>
            <button className="run-result-close" onClick={() => setRunResult(null)}>✕</button>
          </div>
          <pre className="run-result-body">{runResult}</pre>
        </div>
      )}

      {/* Body */}
      <div className="workflow-body">
        <PaletteSidebar />

        <div className="canvas-area">
          <ReactFlowProvider>
            <WorkflowCanvas
              nodesRef={nodesRef}
              edgesRef={edgesRef}
              saveTrigger={saveTrigger}
              onSaveComplete={handleSaveComplete}
            />
          </ReactFlowProvider>
        </div>

        <div className="chat-sidebar">
          <FlowChat />
        </div>
      </div>
    </div>
  );
}

type RunRecord = { id: number; result: string; nodes: string[]; ts: string };
