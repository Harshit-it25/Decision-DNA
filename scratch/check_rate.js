import fs from 'fs';

const content = fs.readFileSync('./dataset.csv', 'utf8');
const lines = content.split('\n').slice(1);
const total = lines.filter(l => l.trim()).length;
const approved = lines.filter(l => l.includes('Approve')).length;

console.log(`Total: ${total}`);
console.log(`Approved: ${approved}`);
console.log(`Rate: ${(approved / total * 100).toFixed(2)}%`);
