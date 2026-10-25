import test from "node:test";
import assert from "node:assert/strict";
import {validateConfig,selection,directories,toolAllowed,lessonOptions} from "./agent.js";
test("only fixed classroom experiments are accepted",()=>{
 assert.deepEqual(validateConfig({mode:"repair",command:"untrusted"}),{mode:"repair"});
 for(const v of [null,[],{mode:"../../"},{mode:"custom"}])assert.throws(()=>validateConfig(v));
});
test("availability and pre-approval are separate configuration layers",()=>{
 assert.deepEqual(selection("allow-rule").tools,["Bash"]);
 assert.deepEqual(selection("allow-rule").allowedTools,["Bash(npm test)"]);
 assert.deepEqual(selection("bare-deny").disallowedTools,["Bash"]);
 assert.deepEqual(selection("scoped-deny").disallowedTools,["Bash(npm run extra)"]);
 assert.deepEqual(selection("mcp-only").tools,[]);
});
test("file guards allow classroom targets while rejecting other projects and instruction files",()=>{
 const cwd=directories("repair","test").cwd;
 assert.ok(toolAllowed({mode:"repair"},cwd,"Edit",{file_path:"utils.js"}));
 assert.equal(toolAllowed({mode:"repair"},cwd,"Edit",{file_path:"utils.test.js"}),false);
 assert.equal(toolAllowed({mode:"repair"},cwd,"Read",{file_path:"../.env"}),false);
 assert.equal(toolAllowed({mode:"read-search"},cwd,"Read",{file_path:".env"}),false);
 assert.ok(toolAllowed({mode:"protect-file"},cwd,"Read",{file_path:".env"}));
});
test("shell guards accept exact classroom commands and reject composition",()=>{
 const cwd=directories("allow-rule","test").cwd;
 assert.ok(toolAllowed({mode:"allow-rule"},cwd,"Bash",{command:"npm test"}));
 assert.ok(toolAllowed({mode:"allow-rule"},cwd,"Bash",{command:"npm run extra"}));
 for(const command of ["npm test && echo bypass","cd ..; npm test","node extra.cjs"])assert.equal(toolAllowed({mode:"allow-rule"},cwd,"Bash",{command}),false);
 assert.equal(toolAllowed({mode:"repair"},cwd,"Bash",{command:"npm run extra"}),false);
});
test("private configuration prevents unrelated settings, plugins and MCP sources",()=>{
 const o=lessonOptions({mode:"read-search"},"test",[],[],[]);
 assert.deepEqual(o.settingSources,[]);assert.deepEqual(o.plugins,[]);assert.equal(o.strictMcpConfig,true);
 assert.equal(o.permissionMode,"default");assert.equal(o.persistSession,false);
 assert.equal(o.env!.CLAUDE_CONFIG_DIR,directories("read-search","test").sdkHome);
});
