export type Mode="read-search"|"repair"|"allow-rule"|"bare-deny"|"scoped-deny"|"protect-file"|"mcp-only";
export type RunConfig={mode:Mode};
export type Call={name:string;target:string;hostAllowed?:boolean};
export type LabEvent=
 | {type:"fixtures";files:{name:string;contents:string}[]}
 | {type:"options";config:RunConfig;options:Record<string,unknown>}
 | {type:"initialized";model:string;sessionId:string;tools:string[]}
 | {type:"message";sdkType:string;summary:string}
 | {type:"tool";name:string;target:string}
 | {type:"answer";text:string}
 | {type:"result";status:string;text:string;sessionId:string;costUsd:number}
 | {type:"evidence";mode:Mode;availableTools:string[];attempts:Call[];completed:Call[];permissionRequests:Call[];beforeTest:number;afterTest:number;sourceChanged:boolean;notesCreated:boolean;extraScriptRan:boolean;fakeSecretReturned:boolean;mcpCalls:number;originalFixturesUnchanged:boolean;testsAndScriptsUnchanged:boolean;protectedReadAttempted:boolean}
 | {type:"notice"|"error";text:string};
