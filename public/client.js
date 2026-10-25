import { renderMarkdown } from "./markdown.js";
const $ = (id) => document.getElementById(id);
const button = $("run");
const rows = [];
const json = (id, value) => { $(id).textContent = JSON.stringify(value, null, 2); window.Prism?.highlightElement($(id)); };
function receive(e) {
    rows.push(e);
    if (e.type === "fixtures") {
        const select = $("fixture");
        select.replaceChildren();
        e.files.forEach((f, i) => { const option = document.createElement("option"); option.value = String(i); option.textContent = f.name; select.append(option); });
        const show = () => { $("fixture-content").textContent = e.files[Number(select.value)].contents; };
        select.onchange = show;
        show();
    }
    if (e.type === "options")
        json("options", e.options);
    if (e.type === "initialized") {
        $("session").textContent = e.sessionId;
        json("init", e);
    }
    if (e.type === "initialized")
        json("discovery", { availableTools: e.tools, note: "Actual availability is distinct from approval for a call." });
    if (e.type === "answer")
        renderMarkdown($("answer"), e.text);
    if (e.type === "result") {
        $("status").textContent = e.status;
        $("cost").textContent = "$" + e.costUsd.toFixed(5);
        renderMarkdown($("answer"), e.text);
    }
    if (e.type === "evidence") {
        json("evidence", { mode: e.mode, availableTools: e.availableTools, completed: e.completed, failed: e.failed, permissionRequests: e.permissionRequests, beforeTest: e.beforeTest, afterTest: e.afterTest, sourceChanged: e.sourceChanged, notesCreated: e.notesCreated, extraScriptRan: e.extraScriptRan, fakeSecretReturned: e.fakeSecretReturned, protectedReadAttempted: e.protectedReadAttempted, mcpCalls: e.mcpCalls, attempts: e.attempts, originalFixturesUnchanged: e.originalFixturesUnchanged, testsAndScriptsUnchanged: e.testsAndScriptsUnchanged });
        const tr = document.createElement("tr"), config = rows.filter(x => x.type === "options").at(-1);
        for (const value of [config.config.mode, e.availableTools.join(", "), e.completed.map(t => t.name + ":" + t.target).join("; ") || "None", String(e.permissionRequests.length), e.beforeTest + " → " + e.afterTest]) {
            const td = document.createElement("td");
            td.textContent = value;
            tr.append(td);
        }
        $("history").append(tr);
    }
    if (e.type === "error" || e.type === "notice")
        $("notice").textContent = e.text;
    if (e.type === "error")
        $("status").textContent = "Could not finish";
    if (["message", "tool", "result", "error"].includes(e.type)) {
        const li = document.createElement("li");
        li.textContent = JSON.stringify(e);
        $("events").append(li);
    }
}
button.onclick = async () => {
    button.disabled = true;
    $("answer").replaceChildren();
    $("events").replaceChildren();
    $("notice").textContent = "";
    $("status").textContent = "Running…";
    json("init", {});
    json("discovery", {});
    $("session").textContent = "—";
    $("cost").textContent = "—";
    const config = { mode: $("mode").value };
    try {
        const response = await fetch("/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
        if (!response.ok)
            throw new Error(await response.text());
        const reader = response.body.getReader(), decoder = new TextDecoder();
        let pending = "";
        while (true) {
            const { done, value } = await reader.read();
            pending += decoder.decode(value, { stream: !done });
            const lines = pending.split("\n");
            pending = lines.pop();
            for (const line of lines)
                if (line.trim())
                    receive(JSON.parse(line));
            if (done)
                break;
        }
        if ($("status").textContent === "Running…")
            $("status").textContent = "No final result";
    }
    catch (error) {
        $("status").textContent = "Could not finish";
        $("notice").textContent = error instanceof Error ? error.message : "Request failed.";
    }
    finally {
        button.disabled = false;
    }
};
$("download").onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "lesson21-observations.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};
fetch("/api/config").then(r => r.json()).then(c => {
    $("configuration").textContent = c.ready ? "Key configured on server · " + c.model : "Set your key in .env and restart.";
    button.disabled = !c.ready;
});
