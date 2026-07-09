const fs = require('fs');
const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const cwRegex = /const CW = \{ stt: 32, name: 244, start: 96, dur: 48, prog: 80, action: readOnly \? 0 : 40 \};/;
const cwNew = `const CW = { stt: 32, name: 244, start: 96, dur: 48, end: 96, prog: 80, action: readOnly ? 0 : 40 };`;

const clRegex = /const CL = \{\s*stt: 0,\s*name: CW\.stt,\s*start: CW\.stt \+ CW\.name,\s*dur: CW\.stt \+ CW\.name \+ CW\.start,\s*prog: CW\.stt \+ CW\.name \+ CW\.start \+ CW\.dur,\s*action: CW\.stt \+ CW\.name \+ CW\.start \+ CW\.dur \+ CW\.prog,\s*\};/;

const clNew = `const CL = {
    stt: 0,
    name: CW.stt,
    start: CW.stt + CW.name,
    dur: CW.stt + CW.name + CW.start,
    end: CW.stt + CW.name + CW.start + CW.dur,
    prog: CW.stt + CW.name + CW.start + CW.dur + CW.end,
    action: CW.stt + CW.name + CW.start + CW.dur + CW.end + CW.prog,
  };`;

content = content.replace(cwRegex, cwNew);
content = content.replace(clRegex, clNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed CW and CL safely');
