const esc=(v:unknown)=>`"${String(v??"").replace(/"/g,'""')}"`;
export const toCsv=(rows:Record<string,unknown>[])=>{
  if(!rows.length)return "";
  const headers=Object.keys(rows[0]);
  return [headers.join(","),...rows.map(r=>headers.map(h=>esc(r[h])).join(","))].join("\n");
};
