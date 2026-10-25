import {runAgent,validateConfig} from "./agent.js";
await runAgent(validateConfig({mode:process.argv[2] || "read-search"}),e=>{
 if(e.type==="answer")console.log(e.text);
 else if(e.type!=="message")console.log(JSON.stringify(e));
});
