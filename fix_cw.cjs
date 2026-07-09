const fs = require('fs');
const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const cwOld = `  const CW = { stt: 32, name: 244, start: 96, dur: 48, prog: 80, action: readOnly ? 0 : 40 };`;
const cwNew = `  const CW = { stt: 32, name: 244, start: 96, dur: 48, end: 96, prog: 80, action: readOnly ? 0 : 40 };`;

const clOld = `  const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    prog: CW.stt + CW.name + CW.start + CW.dur,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.prog,
  };`;
const clNew = `  const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    end: CW.stt + CW.name + CW.start + CW.dur,
    prog: CW.stt + CW.name + CW.start + CW.dur + CW.end,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.end + CW.prog,
  };`;

function makeRegex(str) {
    let escaped = str.replace(/[.*+?^$\{\}()|\[\]\\]/g, '\\$&');
    let wsIgnored = escaped.replace(/\s+/g, '\\s*');
    return new RegExp(wsIgnored, 'g');
}

content = content.replace(makeRegex(cwOld), cwNew);
content = content.replace(makeRegex(clOld), clNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed CW and CL');
