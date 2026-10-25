# Claude Agent SDK · Lesson 21 · Built-in tools tour

Based on Lesson21_Built_in_Tools_Tour.pptx. Five student pages, large text and coloured code for all 13 UML steps.

## What you will learn

- Tour the built-in families: Files: Read, Edit and Write. Search: Glob and Grep. Execution: Bash. Web: WebFetch and WebSearch. The live app focuses on local files, search and a fixed classroom test command.
- Separate availability from approval: tools chooses built-ins in context. allowedTools pre-approves matching calls; it does not remove unlisted tools. A bare disallowedTools name removes a tool, while a scoped deny rule leaves it visible.
- Observe searches and a real repair: Compare Glob, Grep and Read with an Edit, a Write and npm test. Independent host tests verify failure before the repair and success afterward. Original lesson fixtures remain unchanged.
- Compare scoped rules and callbacks: Bash(npm test) pre-approves that command. An unlisted extra script reaches the denying callback. Bash(npm run extra) is a scoped deny; compare attempted calls, completed tools and side effects.
- Protect a fake environment file: Read(./.env) applies to a dummy file in the private project. The real app .env is outside that project. Record whether the model attempts the Read or refuses in advance; do not invent an attempted denial.
- Inspect MCP-only availability: With tools: [], built-ins are absent while the configured classroom MCP tool remains. One actual in-process call proves this distinction. Orchestration tools and web tools are reference topics for later lessons.

## Configure and run

```powershell
git clone https://github.com/luiscoco/Udemy-Claude-Agent-SDK-lesson21-app.git
cd .\Udemy-Claude-Agent-SDK-lesson21-app
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
npm start
```

From presentations use `cd .\agent-sdk\lesson21-built-in-tools` instead of cloning. Open http://127.0.0.1:3121 and keep the terminal running.

## Create your .env file

Preserve an existing file or copy .env.example, enter your own key locally and restart after edits. Shell values take precedence. Node.js 24+ and model access are required; Windows may need Git Bash.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MODEL=claude-sonnet-4-6
PORT=3121
# Windows if needed: CLAUDE_CODE_GIT_BASH_PATH=C:/Program Files/Git/bin/bash.exe
```

The real app .env is separate from the generated fake file in the exercise. Neither file is committed.

## Run the experiments

### Search, read and repair

Run Read-only, then Repair. Inspect the actual call trace and before/after files. Host test exit 1 before repair and 0 afterward verify the change; tests and scripts must remain unchanged.

```powershell
npm run sample:env -- read-search
npm run sample:env -- repair
```

### Compare rule layers

Run Allow rule, Bare deny and Scoped deny. Compare availability, attempts, completed calls and callback requests. The harmless extra script must not execute.

```powershell
npm run sample:env -- allow-rule
npm run sample:env -- bare-deny
npm run sample:env -- scoped-deny
```

### Protect dummy data and inspect MCP-only mode

Run Protect file and inspect whether a Read was attempted; an advance refusal is recorded separately. Then run MCP only to call one constant tool with no built-ins in context.

```powershell
npm run sample:env -- protect-file
npm run sample:env -- mcp-only
npm test
```

## How the app was built

### 1. Validate the classroom experiment

Accept a listed experiment. Browser input cannot provide arbitrary paths, shell commands or tool definitions.

Source: `src/agent.ts`, lines 26–27. Selected source; surrounding code omitted.

```typescript
if(!value || typeof value!=="object" || Array.isArray(value) || !MODES.includes((value as RunConfig).mode))throw new Error("Choose a listed tool experiment.");
 return {mode:(value as RunConfig).mode};
```

### 2. Prepare a fresh fixture copy

Copy trusted fixtures into a new owned working directory. The protected .env contains only a generated fake classroom token, never the app API key.

Source: `src/agent.ts`, lines 36–38. Selected source; surrounding code omitted.

```typescript
for(const name of ["utils.js","utils.test.js","package.json","extra.cjs"])await copyFile(resolve(ROOT,"fixtures",name),resolve(d.cwd,name));
 if(c.mode!=="repair" && c.mode!=="read-search")await writeFile(resolve(d.cwd,"utils.js"),"export function add(a,b){ return a+b; }\n");
 const fakeToken="FAKE-CLASSROOM-21-"+randomUUID();
```

### 3. Choose built-in availability

Select Read/Glob/Grep for inspection or Read/Edit/Write/Bash for repair. The tools array controls built-ins in the model context.

Source: `src/agent.ts`, lines 43–44. Selected source; surrounding code omitted.

```typescript
if(mode==="read-search")return {tools:["Read","Glob","Grep"],allowedTools:[],disallowedTools:[]};
 if(mode==="repair")return {tools:["Read","Edit","Write","Bash"],allowedTools:["Edit","Write","Bash(npm test)"],disallowedTools:[]};
```

### 4. Compare pre-approval and deny rules

Pre-approve npm test without removing Bash. Compare a bare Bash deny with a command-scoped deny; these operate at different layers.

Source: `src/agent.ts`, lines 45–47. Selected source; surrounding code omitted.

```typescript
if(mode==="allow-rule")return {tools:["Bash"],allowedTools:["Bash(npm test)"],disallowedTools:[]};
 if(mode==="bare-deny")return {tools:["Bash"],allowedTools:[],disallowedTools:["Bash"]};
 if(mode==="scoped-deny")return {tools:["Bash"],allowedTools:[],disallowedTools:["Bash(npm run extra)"]};
```

### 5. Enforce the separate host boundary

The pre-tool hook records the actual target and checks fixed classroom paths and command strings. This guard is independent of native SDK permission rules.

Source: `src/agent.ts`, lines 78–80. Selected source; surrounding code omitted.

```typescript
const value=input.tool_input as Record<string,unknown>,hostAllowed=toolAllowed(c,d.cwd,input.tool_name,value);
    attempts.push({name:input.tool_name,target:target(d.cwd,input.tool_name,value),hostAllowed});
    return hostAllowed ? {} : {hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Outside the fixed classroom tool/target boundary."}};
```

### 6. Deny unresolved permission requests

The callback records calls not already resolved by the SDK’s permission flow. In this lab it denies them; allowedTools is pre-approval, not a complete allowlist.

Source: `src/agent.ts`, lines 91–93. Selected source; surrounding code omitted.

```typescript
permissionRequests.push({name,target:target(d.cwd,name,input)});
   return {behavior:"deny",message:"The classroom callback denies requests not resolved by the configured permission rules. Do not bypass."};
  },
```

### 7. Run the SDK with streaming input

An async input generator keeps the query open for the in-process MCP preview. The SDK owns the model/tool loop; the host consumes its real messages.

Source: `src/agent.ts`, lines 127–128. Selected source; surrounding code omitted.

```typescript
const run=query({prompt:input(),options});
 try {
```

### 8. Inspect actual init.tools

Read the actual runtime inventory rather than assuming the requested options are the complete context. Bare deny and MCP-only experiments compare this field.

Source: `src/agent.ts`, lines 132–133. Selected source; surrounding code omitted.

```typescript
availableTools=message.tools;sessionId=message.session_id;
    emit({type:"initialized",model:message.model,sessionId,tools:message.tools});
```

### 9. Record successful tool completion

PostToolUse records completed calls separately from attempts, callback requests and model claims. A blocked call must not be counted as completed.

Source: `src/agent.ts`, lines 83–84. Selected source; surrounding code omitted.

```typescript
if(input.hook_event_name==="PostToolUse")completed.push({name:input.tool_name,target:target(d.cwd,input.tool_name,input.tool_input as Record<string,unknown>)});
    return {};
```

### 10. Register the MCP-only preview

With tools empty, the configured MCP tool remains. Its actual handler increments a counter and returns a fixed course card; no external service is called.

Source: `src/agent.ts`, lines 116–118. Selected source; surrounding code omitted.

```typescript
tool("course_card","Return a fixed classroom course card",{},async()=>{
   mcpCalls++;return {content:[{type:"text",text:JSON.stringify({topic:"Built-in tools tour",marker:"MCP-ONLY-21"})}]};
  }),
```

### 11. Verify tests independently

The host invokes Node’s test runner directly in the owned copy before and after the query. This check does not rely on the model saying npm test passed.

Source: `src/agent.ts`, lines 98–100. Selected source; surrounding code omitted.

```typescript
try {await execute(process.execPath,["--test","utils.test.js"],{cwd,windowsHide:true,timeout:15000});return 0;}
 catch(error){return typeof (error as {code?:unknown}).code==="number" ? (error as {code:number}).code : -1;}
}
```

### 12. Preserve evidence and snapshots

Compare test/script hashes and display actual after files. Keep original fixture integrity, dummy-data protection and model effects separate.

Source: `src/agent.ts`, lines 149–151. Selected source; surrounding code omitted.

```typescript
const testsAndScriptsUnchanged=(await Promise.all(names.slice(1).map(async(name,i)=>hash(await readFile(resolve(d.cwd,name),"utf8"))===original[i+1]))).every(Boolean);
 const afterFiles=await Promise.all(names.map(async name=>({name:"after/"+name,contents:await readFile(resolve(d.cwd,name),"utf8")})));
 if(notesCreated)afterFiles.push({name:"after/repair-notes.md",contents:await readFile(resolve(d.cwd,"repair-notes.md"),"utf8")});
```

### 13. Format the actual answer

Parse and sanitize assistant Markdown. Show typed results alongside actual call traces, permission events and independent checks.

Source: `src/client.ts`, lines 19–21. Selected source; surrounding code omitted.

```typescript
if (e.type === "answer") renderMarkdown($("answer"), e.text);
  if (e.type === "result") {
    $("status").textContent = e.status; $("cost").textContent = "$" + e.costUsd.toFixed(5);
```

## Reference topics and limits

- Core tools and permission requirements: Read, Glob and Grep generally run without prompts for paths inside working directories; outside paths can prompt. Bash has some read-only exceptions. Edits, writes and web operations have their own permission requirements. Platform defaults differ, so inspect initialization.
- Orchestration tools: Agent, Skill, AskUserQuestion, task tools, ToolSearch and MCP resource tools coordinate work. They are reference topics here and are not invoked in this app. WebFetch/WebSearch, notebooks and PowerShell are also reference-only.
- Rule format: ToolName(specifier) uses tool-specific command, path, domain, skill or agent matching. This app executes Bash(npm test), Bash(npm run extra) and Read(./.env) examples. Other rule examples from the slides are reference material.
- Cross-tool path rules: An Edit allow rule can grant read access. A Read deny can also affect Edit/Write on its path. This lesson’s fake-file experiment uses Read only; it does not claim to execute every cross-tool case.
- Independent classroom guard: The host limits file targets and exact commands separately from SDK pre-approval. Repair uses broad Edit/Write pre-approval while the guard permits only utils.js edits and repair-notes.md writes. Private directories are not an operating-system sandbox.
- Observed refusals and concurrency: A model may refuse a known-denied operation without calling a tool. protectedReadAttempted makes this visible. Read-only tools may run in parallel, but this app does not require or claim a particular scheduling order.
- MCP preview: The one constant in-process MCP tool completes the slide’s tools: [] exercise. The next lesson explains authoring custom tools in depth. Built-in availability is distinct from configured MCP tools.
- Short temporary workspaces: Generated projects use short paths under the operating system temporary directory. This avoids Windows shell bookkeeping failures caused by deeply nested course paths. The original fixtures and real application .env remain in the application folder.

Media, .env, dependencies and private runtime files remain local and excluded from Git. No stored answer replaces an actual result.

## References

- [Tools reference](https://code.claude.com/docs/en/tools-reference)
- [SDK permissions](https://code.claude.com/docs/en/agent-sdk/permissions)
- [Custom tool preview](https://code.claude.com/docs/en/agent-sdk/custom-tools)

Regenerate student pages with `python scripts/build-pages.py`.
