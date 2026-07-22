// Extract lines from the real report exactly as the app's rxReadPdfLines does.
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const PDF = process.argv[2] || '/root/.claude/uploads/69715230-574c-55a9-b161-947111767547/ce7b40b9-21072026.pdf';

(async function(){
  const data = new Uint8Array(fs.readFileSync(PDF));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts:true }).promise;
  console.log('numPages:', doc.numPages);
  for(let i=1;i<=doc.numPages;i++){
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const byY = {};
    content.items.forEach(item => {
      if(!item.str) return;
      const y = Math.round(item.transform[5]);
      (byY[y] = byY[y] || []).push({ s:item.str, x:item.transform[4] });
    });
    const lines = Object.keys(byY).map(Number).sort((a,b)=>b-a).map(y=>{
      return byY[y].sort((a,b)=>a.x-b.x).map(t=>t.s).join(' ').replace(/\s+/g,' ').trim();
    }).filter(Boolean);
    console.log('\n===== PAGE ' + i + ' (' + lines.length + ' lines) =====');
    lines.forEach((l,idx)=>console.log(String(idx).padStart(3,' ') + '| ' + l));
  }
})().catch(e=>{ console.error('ERR', e); process.exit(1); });
