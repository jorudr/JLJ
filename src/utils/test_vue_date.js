const d1 = new Date(1780879764196);
const str = "2026-06-08T00:49:24.196Z";
const d2 = new Date(str);

console.log("d1 (Date object):", d1.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
console.log("d2 (Parsed string):", d2.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));

const d3 = new Date(d1); // What ExTradeAnalysisPanel does
console.log("d3 (new Date(Date)):", d3.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
